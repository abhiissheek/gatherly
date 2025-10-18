import express from "express";
import {
  createMeeting,
  scheduleMeeting,
  getMeeting,
  joinMeeting,
  getUpcomingMeetings,
  getMeetingHistory,
  updatePermissions,
  endMeeting,
  getChatHistory,
  activateMeeting,
  deleteMeeting,
} from "../controllers/meeting.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Create instant meeting
router.post("/create", createMeeting);

// Schedule future meeting
router.post("/schedule", scheduleMeeting);

// Get meeting details
router.get("/:meetingId", getMeeting);

// Join meeting
router.post("/:meetingId/join", joinMeeting);

// Get upcoming scheduled meetings
router.get("/user/upcoming", getUpcomingMeetings);

// Get meeting history
router.get("/user/history", getMeetingHistory);

// Update participant permissions (admin only)
router.put("/:meetingId/permissions", updatePermissions);

// End meeting (admin only)
router.post("/:meetingId/end", endMeeting);

// Activate scheduled meeting (admin only)
router.post("/:meetingId/activate", activateMeeting);

// Get chat history for a meeting
router.get("/:meetingId/chat", getChatHistory);

// Delete scheduled meeting (creator only)
router.delete("/:meetingId", deleteMeeting);

export default router;