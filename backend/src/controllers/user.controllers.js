import bcrypt from "bcryptjs";
import User from "../../shared/models/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

// ── Token helpers ─────────────────────────────────────────────────────────────
// Short-lived ACCESS token (Bearer, in localStorage) + long-lived REFRESH token
// (httpOnly cookie). The access token carries type:"access"; the refresh token
// type:"refresh". isLoggedIn rejects refresh tokens so they can't be used as access.
const ACCESS_TTL = process.env.ACCESS_TTL || "1d";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const signAccessToken = (userId) =>
  jwt.sign({ id: userId, type: "access" }, process.env.JWTSECRET_KEY, { expiresIn: ACCESS_TTL });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: "refresh" }, process.env.JWTSECRET_KEY, { expiresIn: "30d" });

// Cookie config. In production the frontend and API live on different domains, so cookies must
// be "Secure" + SameSite=None (HTTPS only). On http://localhost those settings are rejected by
// some browsers (e.g. Safari), so development uses Lax and no Secure flag.
const isProd = process.env.NODE_ENV === "production";
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  path: "/",
};
// maxAge (not a fixed expires date) so the lifetime is counted from each login, not from server start.
const refreshCookieOptions = { ...baseCookieOptions, maxAge: REFRESH_TTL_MS };
const accessCookieOptions = { ...baseCookieOptions, maxAge: 24 * 60 * 60 * 1000 };

// Issues both tokens, sets cookies, and returns the access token to send in the body.
const issueSession = (res, userId) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  res.cookie("token", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  return accessToken;
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }

    // Normalize email so "A@X.com" and "a@x.com" are treated as the same account.
    const normalizedEmail = email.trim().toLowerCase();

    // Account-enumeration protection: do NOT reveal that the email already exists.
    // An explicit "email already registered" message lets an attacker probe which
    // emails have accounts. We return the same generic error used for bad logins.
    // (Full enumeration-resistance needs email verification — a later enhancement.)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Wrong Credentials",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    if (!newUser) {
      return res.status(400).json({
        success: false,
        message: "Failed to create user",
      });
    }

    const token = issueSession(res, newUser._id);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token: token,

      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating user",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Wrong Credentials",
      });
    }

    // Accounts created via Google sign-in have no password; treat as wrong credentials.
    const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;

    if (!isMatch) {
      // 401 Unauthorized (not 400) — the request was well-formed, the credentials were wrong.
      return res.status(401).json({
        success: false,
        message: "Wrong Credentials",
      });
    }

    const token = issueSession(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token: token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while login",
    });
  }
};
// ── POST /auth/google — sign in / sign up with a Google ID token ──────────────
// The browser gets a signed ID token from Google Identity Services. We verify its signature and
// that it was issued for OUR Client ID, then find-or-create the user and issue the normal session.
const googleClient = new OAuth2Client();

export const googleLogin = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: "Google sign-in is not configured" });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: req.body.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid Google credential" });
    }

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, message: "Google account email is not verified" });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: (payload.name || email.split("@")[0]).trim(),
        email,
        googleId: payload.sub,
        avatar: payload.picture,
      });
    } else if (!user.googleId) {
      // Existing email/password account: link it to this Google identity (email is Google-verified).
      user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    } else if (user.googleId !== payload.sub) {
      return res.status(401).json({ success: false, message: "Wrong Credentials" });
    }

    const token = issueSession(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while signing in with Google",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while getting user data",
    });
  }
};
export const logout = async (req, res) => {
  try {
    const cookiesOption = baseCookieOptions;
    res.clearCookie("token", cookiesOption);
    res.clearCookie("token", { path: "/" });
    res.clearCookie("token");
    res.clearCookie("refreshToken", cookiesOption);
    res.clearCookie("refreshToken", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while logging out",
    });
  }
};

// ── POST /auth/refresh — exchange a valid refresh cookie for a new access token ──
export const refreshAccessToken = async (req, res) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (!rt) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(rt, process.env.JWTSECRET_KEY);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    // Rotate: issue a fresh access token (and refresh cookie) on every refresh.
    const token = issueSession(res, user._id);

    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal server error while refreshing token" });
  }
};
