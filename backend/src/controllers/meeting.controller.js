import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import Meeting from "../models/Meeting.js";
import MeetingParticipant from "../models/MeetingParticipant.js";
import Message from "../models/Message.js";
import { kickParticipant as socketKickParticipant } from "../lib/socket.js";

// Create instant meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, settings } = req.body;
    const userId = req.user.id;

    // Generate unique meeting ID
    const meetingId = uuidv4();

    // Create meeting
    const meeting = await Meeting.create({
      meetingId,
      title,
      description,
      creator: userId,
      isActive: true,
      isScheduled: false,
      settings: settings || {},
    });

    // Add creator as admin participant
    await MeetingParticipant.create({
      meetingId,
      userId,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        description: meeting.description,
        isActive: meeting.isActive,
        settings: meeting.settings,
      },
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Failed to create meeting" });
  }
};

// Schedule future meeting
export const scheduleMeeting = async (req, res) => {
  try {
    const { title, description, scheduledAt, duration, settings, reminder } = req.body;
    const userId = req.user.id;

    // Validate scheduled time
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: "Scheduled time must be in the future" });
    }

    // Generate unique meeting ID
    const meetingId = uuidv4();

    // Create scheduled meeting
    const meeting = await Meeting.create({
      meetingId,
      title,
      description,
      creator: userId,
      scheduledAt: scheduledDate,
      duration: duration || 60,
      reminder: reminder || false,
      isActive: false,
      isScheduled: true,
      settings: settings || {},
    });

    res.status(201).json({
      success: true,
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        description: meeting.description,
        scheduledAt: meeting.scheduledAt,
        duration: meeting.duration,
        reminder: meeting.reminder,
        settings: meeting.settings,
      },
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({ message: "Failed to schedule meeting" });
  }
};

// Get meeting details
export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId })
      .populate("creator", "fullName profilePic email")
      .lean();

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Get participants
    const participants = await MeetingParticipant.find({ meetingId })
      .populate("userId", "fullName profilePic")
      .lean();

    res.status(200).json({
      success: true,
      meeting: {
        ...meeting,
        participants,
      },
    });
  } catch (error) {
    console.error("Error getting meeting:", error);
    res.status(500).json({ message: "Failed to get meeting details" });
  }
};

// Join meeting
export const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if meeting is active
    if (!meeting.isActive) {
      return res.status(400).json({ message: "Meeting is not active yet" });
    }

    // Check if user is already a participant
    let participant = await MeetingParticipant.findOne({ meetingId, userId });

    if (!participant) {
      // Add user as participant
      participant = await MeetingParticipant.create({
        meetingId,
        userId,
        role: "participant",
      });
    } else if (participant.status === "left") {
      // Rejoin meeting
      participant.status = "joined";
      participant.joinedAt = new Date();
      await participant.save();
    }

    res.status(200).json({
      success: true,
      message: "Joined meeting successfully",
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        settings: meeting.settings,
      },
      participant: {
        role: participant.role,
        permissions: participant.permissions,
      },
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({ message: "Failed to join meeting" });
  }
};

// Get user's upcoming scheduled meetings
export const getUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await Meeting.find({
      creator: userId,
      isScheduled: true,
      scheduledAt: { $gte: new Date() },
      endedAt: null,
    })
      .sort({ scheduledAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.error("Error getting upcoming meetings:", error);
    res.status(500).json({ message: "Failed to get upcoming meetings" });
  }
};

// Get user's meeting history
export const getMeetingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const participants = await MeetingParticipant.find({ userId })
      .populate({
        path: "meetingId",
        model: "Meeting",
        populate: {
          path: "creator",
          select: "fullName profilePic",
        },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      meetings: participants,
    });
  } catch (error) {
    console.error("Error getting meeting history:", error);
    res.status(500).json({ message: "Failed to get meeting history" });
  }
};

// Update participant permissions (admin only)
export const updatePermissions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, permissions } = req.body;
    const adminId = req.user.id;

    // Verify admin is the meeting creator
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.creator.toString() !== adminId) {
      return res.status(403).json({ message: "Only meeting creator can update permissions" });
    }

    // Update participant permissions
    const participant = await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      { permissions },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    res.status(200).json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Failed to update permissions" });
  }
};

// End meeting (admin only)
export const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only meeting creator can end the meeting" });
    }

    meeting.isActive = false;
    meeting.endedAt = new Date();
    await meeting.save();

    // Update all participants to left status
    await MeetingParticipant.updateMany(
      { meetingId, status: "joined" },
      { status: "left", leftAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "Meeting ended successfully",
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    res.status(500).json({ message: "Failed to end meeting" });
  }
};

// Get meeting chat history
export const getChatHistory = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const messages = await Message.find({ meetingId })
      .populate("sender", "fullName profilePic")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({ message: "Failed to get chat history" });
  }
};

// Activate scheduled meeting
export const activateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only meeting creator can activate the meeting" });
    }

    if (!meeting.isScheduled) {
      return res.status(400).json({ message: "This is not a scheduled meeting" });
    }

    meeting.isActive = true;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: "Meeting activated successfully",
      meeting,
    });
  } catch (error) {
    console.error("Error activating meeting:", error);
    res.status(500).json({ message: "Failed to activate meeting" });
  }
};

// Delete scheduled meeting (creator only)
export const deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    console.log("Delete meeting request:", { meetingId, userId });

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      console.log("Meeting not found:", meetingId);
      return res.status(404).json({ message: "Meeting not found" });
    }

    console.log("Meeting found:", { meetingId, creator: meeting.creator.toString(), userId });

    // Only creator can delete the meeting
    if (meeting.creator.toString() !== userId) {
      console.log("Permission denied: user is not creator");
      return res.status(403).json({ message: "Only meeting creator can delete the meeting" });
    }

    // Prevent deletion of active meetings
    if (meeting.isActive) {
      console.log("Cannot delete active meeting");
      return res.status(400).json({ message: "Cannot delete an active meeting. Please end it first." });
    }

    // Delete meeting and all associated data
    await Meeting.deleteOne({ meetingId });
    await MeetingParticipant.deleteMany({ meetingId });
    await Message.deleteMany({ meetingId });

    console.log("Meeting deleted successfully:", meetingId);

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
};