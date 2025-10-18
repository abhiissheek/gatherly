import mongoose from "mongoose";

const meetingParticipantSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "participant"],
      default: "participant",
    },
    permissions: {
      canVideo: {
        type: Boolean,
        default: true,
      },
      canAudio: {
        type: Boolean,
        default: true,
      },
      canShare: {
        type: Boolean,
        default: true,
      },
      canChat: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ["waiting", "joined", "left", "denied"],
      default: "joined",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
meetingParticipantSchema.index({ meetingId: 1, userId: 1 });

const MeetingParticipant = mongoose.model("MeetingParticipant", meetingParticipantSchema);

export default MeetingParticipant;
