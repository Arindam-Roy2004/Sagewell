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
