import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Google OAuth callback
export async function googleCallback(req, res) {
  try {
    // User is already authenticated by passport
    const user = req.user;

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5175");
  } catch (error) {
    console.log("Error in googleCallback controller", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
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
