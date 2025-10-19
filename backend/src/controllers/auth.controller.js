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

    // Set cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    console.log("Cookie set, redirecting to frontend...");

    // Redirect to frontend
    const redirectUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5175";
    console.log("Redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
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