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
  'https://gatherly-trjg.onrender.com',
  'https://gatherly-virid.vercel.app',
  'http://localhost:3000',  // Add localhost:3000 for local development
  'http://localhost:5173',  // Add localhost:5173 for Vite default
  'http://localhost:5175'   // Add localhost:5175 as fallback
];

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
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

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Redirect for backward compatibility with frontend requests to /auth/me
app.get("/auth/me", (req, res) => {
  // Check if user is authenticated
  if (req.user) {
    res.status(200).json({ success: true, user: req.user });
  } else {
    // Check for JWT token in cookies
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
    // Verify token and get user
    import("jsonwebtoken").then((jwt) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        import("./models/User.js").then((UserModule) => {
          const User = UserModule.default;
          User.findById(decoded.userId).then((user) => {
            if (!user) {
              return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            res.status(200).json({ success: true, user });
          }).catch((err) => {
            res.status(401).json({ success: false, message: "Unauthorized" });
          });
        });
      } catch (error) {
        res.status(401).json({ success: false, message: "Unauthorized" });
      }
    });
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