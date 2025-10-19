import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Google OAuth callback
export async function googleCallback(req, res) {
  try {
    console.log("Google OAuth callback - req.user:", req.user);
    console.log("Google OAuth callback - cookies:", req.cookies);
    
    // User is already authenticated by passport
    const user = req.user;
    
    if (!user) {
      console.log("No user found in Google OAuth callback");
      return res.redirect(`${process.env.FRONTEND_URL || process.env.CLIENT_URL}/login?error=no_user`);
    }

    console.log("Google OAuth successful for user:", user.email);

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    console.log("JWT token generated, setting cookie...");

    // Set cookie with proper cross-origin settings
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: "none", // Required for cross-origin
      secure: true, // Required for HTTPS
      domain: undefined, // Don't set domain for cross-origin
      path: "/", // Available on all paths
    });

    console.log("Redirecting to frontend with token...");

    // Redirect to frontend with token in URL (for localStorage)
    const redirectUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5175";
    const finalUrl = `${redirectUrl}?token=${token}`;
    console.log("Redirecting to:", finalUrl);
    res.redirect(finalUrl);
  } catch (error) {
    console.log("Error in googleCallback controller", error);
    res.redirect(`${process.env.FRONTEND_URL || process.env.CLIENT_URL}/login?error=auth_failed`);
  }
}

export function logout(req, res) {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
  });
  res.clearCookie("jwt");
  res.clearCookie("connect.sid");
  res.status(200).json({ success: true, message: "Logout successful" });
}