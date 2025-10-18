import Message from "../models/Message.js";
import MeetingParticipant from "../models/MeetingParticipant.js";
import Meeting from "../models/Meeting.js";

// Store active connections
const activeUsers = new Map(); // userId -> socketId
const activeMeetings = new Map(); // meetingId -> Set of socketIds

export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a meeting
    socket.on("join-meeting", async ({ meetingId, userId, userName }) => {
      try {
        // Verify meeting exists
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }

        // Check if meeting is active
        if (!meeting.isActive) {
          socket.emit("error", { message: "Meeting is not active" });
          return;
        }

        // Join the room
        socket.join(meetingId);
        activeUsers.set(userId, socket.id);

        // Track meeting participants
        if (!activeMeetings.has(meetingId)) {
          activeMeetings.set(meetingId, new Set());
        }
        activeMeetings.get(meetingId).add(socket.id);

        // Get participant info or update status if already exists
        let participant = await MeetingParticipant.findOne({ meetingId, userId });
        
        if (!participant) {
          // Create new participant record
          participant = await MeetingParticipant.create({
            meetingId,
            userId,
            role: meeting.creator.toString() === userId ? "admin" : "participant",
          });
        } else if (participant.status === "left") {
          // Update status if user is rejoining
          participant.status = "joined";
          participant.joinedAt = new Date();
          await participant.save();
        }

        // Notify others in the meeting
        socket.to(meetingId).emit("user-joined", {
          userId,
          userName,
          socketId: socket.id,
          permissions: participant.permissions,
        });

        // Send current participants to the new user
        const participants = await MeetingParticipant.find({
          meetingId,
          status: "joined",
        }).populate("userId", "fullName profilePic");

        socket.emit("meeting-participants", { participants });

        console.log(`User ${userName} joined meeting ${meetingId}`);
      } catch (error) {
        console.error("Error joining meeting:", error);
        socket.emit("error", { message: "Failed to join meeting" });
      }
    });

    // WebRTC Signaling - Offer
    socket.on("offer", ({ meetingId, offer, targetUserId, fromUserId }) => {
      const targetSocketId = activeUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("offer", {
          offer,
          fromUserId: fromUserId,
        });
      } else {
        console.log(`Target user ${targetUserId} not found for offer from ${fromUserId}`);
      }
    });

    // WebRTC Signaling - Answer
    socket.on("answer", ({ meetingId, answer, targetUserId, fromUserId }) => {
      const targetSocketId = activeUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("answer", {
          answer,
          fromUserId: fromUserId,
        });
      } else {
        console.log(`Target user ${targetUserId} not found for answer from ${fromUserId}`);
      }
    });

    // WebRTC Signaling - ICE Candidate
    socket.on("ice-candidate", ({ meetingId, candidate, targetUserId, fromUserId }) => {
      const targetSocketId = activeUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("ice-candidate", {
          candidate,
          fromUserId: fromUserId,
        });
      } else {
        console.log(`Target user ${targetUserId} not found for ICE candidate from ${fromUserId}`);
      }
    });

    // Chat Message
    socket.on("chat-message", async ({ meetingId, userId, content }) => {
      try {
        // Save message to database
        const message = await Message.create({
          meetingId,
          sender: userId,
          content,
          type: "text",
        });

        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "fullName profilePic"
        );

        // Broadcast to all in meeting
        io.to(meetingId).emit("chat-message", populatedMessage);
      } catch (error) {
        console.error("Error sending chat message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Toggle Audio
    socket.on("toggle-audio", ({ meetingId, userId, isAudioOn }) => {
      socket.to(meetingId).emit("user-audio-toggled", {
        userId,
        isAudioOn,
      });
    });

    // Toggle Video
    socket.on("toggle-video", ({ meetingId, userId, isVideoOn }) => {
      socket.to(meetingId).emit("user-video-toggled", {
        userId,
        isVideoOn,
      });
    });

    // Screen Share Start
    socket.on("screen-share-start", ({ meetingId, userId }) => {
      socket.to(meetingId).emit("screen-share-started", {
        userId,
        socketId: socket.id,
      });
    });

    // Screen Share Stop
    socket.on("screen-share-stop", ({ meetingId, userId }) => {
      socket.to(meetingId).emit("screen-share-stopped", {
        userId,
      });
    });

    // Request Permission (participant asks admin)
    socket.on("request-permission", async ({ meetingId, userId, permissionType }) => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        const creatorSocketId = activeUsers.get(meeting.creator.toString());

        if (creatorSocketId) {
          io.to(creatorSocketId).emit("permission-requested", {
            userId,
            permissionType,
          });
        }
      } catch (error) {
        console.error("Error requesting permission:", error);
      }
    });

    // Grant Permission (admin grants to participant)
    socket.on("grant-permission", async ({ meetingId, userId, permissionType, granted }) => {
      try {
        const participant = await MeetingParticipant.findOne({ meetingId, userId });
        
        if (participant) {
          participant.permissions[permissionType] = granted;
          await participant.save();

          const targetSocketId = activeUsers.get(userId);
          if (targetSocketId) {
            io.to(targetSocketId).emit("permission-updated", {
              permissionType,
              granted,
            });
          }
        }
      } catch (error) {
        console.error("Error granting permission:", error);
      }
    });

    // Leave Meeting
    socket.on("leave-meeting", async ({ meetingId, userId }) => {
      try {
        await handleUserLeave(socket, meetingId, userId);
      } catch (error) {
        console.error("Error leaving meeting:", error);
      }
    });

    // Handle Disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.id}`);

      // Find and remove user from active users
      let disconnectedUserId = null;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }

      // Remove from active meetings and notify others
      for (const [meetingId, socketIds] of activeMeetings.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          
          if (disconnectedUserId) {
            await handleUserLeave(socket, meetingId, disconnectedUserId);
          }

          // Clean up empty meetings
          if (socketIds.size === 0) {
            activeMeetings.delete(meetingId);
          }
        }
      }
    });
  });
};

// Helper function to handle user leaving
async function handleUserLeave(socket, meetingId, userId, isKicked = false) {
  try {
    // Get user details before updating
    const participant = await MeetingParticipant.findOne(
      { meetingId, userId }
    ).populate('userId', 'fullName');

    // Update participant status
    await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      { status: isKicked ? "kicked" : "left", leftAt: new Date() }
    );

    // Notify others with userName
    const userName = participant?.userId?.fullName || null;
    socket.to(meetingId).emit("user-left", { userId, userName });

    // If user was kicked, notify them specifically
    if (isKicked) {
      const kickedUserSocketId = activeUsers.get(userId);
      if (kickedUserSocketId) {
        io.to(kickedUserSocketId).emit("kicked-from-meeting", { 
          message: "You have been removed from the meeting by the host" 
        });
      }
    }

    // Leave the room
    socket.leave(meetingId);

    console.log(`User ${userId} ${isKicked ? 'kicked from' : 'left'} meeting ${meetingId}`);
  } catch (error) {
    console.error("Error in handleUserLeave:", error);
  }
}

// Kick participant from meeting (admin only)
export const kickParticipant = async (meetingId, userId, adminId) => {
  try {
    // Verify admin is the meeting creator
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      throw new Error("Meeting not found");
    }

    if (meeting.creator.toString() !== adminId) {
      throw new Error("Only meeting creator can kick participants");
    }

    // Get participant socket ID
    const participantSocketId = activeUsers.get(userId);
    if (!participantSocketId) {
      throw new Error("Participant not connected");
    }

    // Get participant details
    const participant = await MeetingParticipant.findOne({ meetingId, userId });
    if (!participant) {
      throw new Error("Participant not found");
    }

    // Update participant status to "kicked"
    await MeetingParticipant.findOneAndUpdate(
      { meetingId, userId },
      { status: "kicked", leftAt: new Date() }
    );

    // Notify the participant they've been kicked
    const io = require("../server.js").getIO();
    io.to(participantSocketId).emit("kicked-from-meeting", {
      message: "You have been removed from the meeting by the host"
    });

    // Notify others in the meeting
    const participantDetails = await MeetingParticipant.findOne({ meetingId, userId })
      .populate('userId', 'fullName');
    
    io.to(meetingId).emit("user-left", { 
      userId, 
      userName: participantDetails?.userId?.fullName || null 
    });

    // Make the participant leave the room
    const socket = require("../server.js").getSocket(participantSocketId);
    if (socket) {
      socket.leave(meetingId);
    }

    // Remove from active users map
    activeUsers.delete(userId);

    // Remove from active meetings set
    if (activeMeetings.has(meetingId)) {
      activeMeetings.get(meetingId).delete(participantSocketId);
    }

    console.log(`User ${userId} kicked from meeting ${meetingId} by admin ${adminId}`);
    return { success: true, message: "Participant kicked successfully" };
  } catch (error) {
    console.error("Error kicking participant:", error);
    throw error;
  }
};
