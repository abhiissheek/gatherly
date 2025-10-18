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
const PORT = process.env.PORT;

const __dirname = path.resolve();

// CORS configuration
const allowedOrigins = [process.env.CLIENT_URL, 'https://gatherly-trjg.onrender.com'];

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

app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

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

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
  connectDB();
});