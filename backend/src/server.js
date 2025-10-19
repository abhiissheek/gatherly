import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import passport from "./lib/passport.js";

import authRoutes from "./routes/auth.route.js";
import meetingRoutes from "./routes/meeting.route.js";

import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./lib/socket.js";
import { initializeMeetingScheduler } from "./lib/scheduler.js";
import { getIceServersController } from "./lib/webrtc.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000', 
  process.env.FRONTEND_URL || 'https://gatherly-virid.vercel.app',
  'https://gatherly-trjg.onrender.com',
  'https://gatherly-virid.vercel.app',
  'https://gatherly-m902prz19-abhis-projects-059091ef.vercel.app', // New Vercel URL
  'http://localhost:3000',  // Add localhost:3000 for local development
  'http://localhost:5173',  // Add localhost:5173 for Vite default
  'http://localhost:5175'   // Add localhost:5175 as fallback
];

console.log('Allowed CORS origins:', allowedOrigins);
console.log('Environment variables:');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      console.log('Socket.IO CORS request from origin:', origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('No origin provided for Socket.IO, allowing request');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('Socket.IO origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('Socket.IO origin not allowed:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO handlers
initializeSocket(io);

// Initialize meeting scheduler
initializeMeetingScheduler();

app.use(cookieParser());

// Express session middleware (required for Google OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Express CORS request from origin:', origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('No origin provided for Express, allowing request');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('Express origin allowed:', origin);
        callback(null, true);
      } else {
        console.log('Express origin not allowed:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Redirect for backward compatibility with frontend requests to /auth/me
app.get("/auth/me", async (req, res) => {
  try {
    console.log("Auth check - cookies:", req.cookies);
    console.log("Auth check - req.user:", req.user);
    
    // Check for JWT token in cookies first (Google OAuth sets this)
    const token = req.cookies.jwt;
    if (token) {
      console.log("JWT token found, verifying...");
      const jwt = await import("jsonwebtoken");
      const UserModule = await import("./models/User.js");
      const User = UserModule.default;
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        console.log("JWT auth successful for user:", user.email);
        return res.status(200).json({ success: true, user });
      }
    }
    
    // Fallback to session-based auth
    if (req.user) {
      console.log("Session auth successful for user:", req.user.email);
      return res.status(200).json({ success: true, user: req.user });
    }
    
    console.log("No authentication found");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  } catch (error) {
    console.error("Error in /auth/me:", error);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// WebRTC ICE servers endpoint
app.get("/api/webrtc/ice-servers", getIceServersController);

// In production with separate frontend deployment, we don't need to serve frontend files
// Frontend is served by Vercel, backend by Render
if (process.env.NODE_ENV === "production") {
  // Health check endpoint
  app.get("/", (req, res) => {
    res.json({ message: "Gatherly Backend is running", status: "ok" });
  });
}

// Export io instance for use in other modules
export { io };

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
  connectDB();
});