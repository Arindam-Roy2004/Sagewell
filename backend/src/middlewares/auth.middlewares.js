import jwt from "jsonwebtoken";
import User from "../../shared/models/user.model.js";
import "../../shared/libs/env.js";
import { touchActivity } from "../../shared/libs/activity.js";

export const ACCOUNT_BLOCKED_MESSAGE = "This account has been blocked. Contact support if you think this is a mistake.";

export const isLoggedIn = async (req, res, next) => {
  try {
    // Bearer header only. A cookie is sent by the browser automatically, even on requests a
    // different website triggers, so accepting one here would allow cross-site request
    // forgery (CSRF). The Authorization header can only be set by our own frontend code.
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // 401 (not 400): the request is well-formed, it just lacks valid credentials.
      // The frontend's axios interceptor keys off 401 to redirect to login.
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWTSECRET_KEY);

    // A refresh token must never be accepted as an access token.
    if (decoded.type === "refresh") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    // Checked on every request, so a block takes effect immediately, not when the token expires.
    if (user.blockedAt) {
      return res.status(401).json({ success: false, message: ACCOUNT_BLOCKED_MESSAGE });
    }

    req.user = user;
    touchActivity(user._id);

    next();
  } catch (error) {
    // jwt.verify throws on expired/invalid tokens — that is a 401, not a 500/400.
    console.error("Auth error:", error.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
};

// Bootstrap admin by email via env (optional), e.g. ADMIN_EMAIL="you@example.com".
// Long-term, admin status lives on the user's `role` field in the database.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

/**
 * Middleware restricting access to admins.
 * A user is admin if their `role` is "admin" OR their email matches ADMIN_EMAIL.
 */
export const userIsAdmin = (user) =>
  Boolean(user) &&
  (user.role === "admin" || Boolean(ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()));

export const isAdmin = (req, res, next) => {
  if (!userIsAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: admin access required",
    });
  }
  next();
};
