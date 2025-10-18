import cron from "node-cron";
import Meeting from "../models/Meeting.js";
import User from "../models/User.js";
import { sendMeetingReminder } from "./email.js";

// Check for upcoming meetings every 5 minutes
export const initializeMeetingScheduler = () => {
  console.log("Meeting scheduler initialized");

  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      await checkUpcomingMeetings();
      await autoActivateMeetings();
    } catch (error) {
      console.error("Error in meeting scheduler:", error);
    }
  });
};

// Check for meetings starting in 15 minutes and send reminders
const checkUpcomingMeetings = async () => {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in20Minutes = new Date(now.getTime() + 20 * 60 * 1000);

    // Find meetings scheduled between 15 and 20 minutes from now
    const upcomingMeetings = await Meeting.find({
      isScheduled: true,
      scheduledAt: {
        $gte: in15Minutes,
        $lte: in20Minutes,
      },
      isActive: false,
      reminder: true, // Only send reminders for meetings with reminder enabled
    }).populate("creator", "fullName email");

    for (const meeting of upcomingMeetings) {
      // Send reminder to creator
      if (meeting.creator.email) {
        await sendMeetingReminder(meeting.creator.email, {
          title: meeting.title,
          meetingId: meeting.meetingId,
          scheduledAt: meeting.scheduledAt,
          creator: meeting.creator.fullName,
        });
      }

      console.log(`Sent reminder for meeting: ${meeting.title}`);
    }
  } catch (error) {
    console.error("Error checking upcoming meetings:", error);
  }
};

// Auto-activate meetings at their scheduled time
const autoActivateMeetings = async () => {
  try {
    const now = new Date();

    // Find meetings that should be activated now
    const meetingsToActivate = await Meeting.find({
      isScheduled: true,
      scheduledAt: { $lte: now },
      isActive: false,
      endedAt: null,
    });

    for (const meeting of meetingsToActivate) {
      meeting.isActive = true;
      await meeting.save();
      console.log(`Auto-activated meeting: ${meeting.title}`);
    }
  } catch (error) {
    console.error("Error auto-activating meetings:", error);
  }
};

// Auto-end meetings that have exceeded their duration
export const autoEndMeetings = async () => {
  try {
    const meetings = await Meeting.find({
      isActive: true,
      scheduledAt: { $ne: null },
      endedAt: null,
    });

    const now = new Date();

    for (const meeting of meetings) {
      const scheduledEnd = new Date(
        meeting.scheduledAt.getTime() + meeting.duration * 60 * 1000
      );

      if (now > scheduledEnd) {
        meeting.isActive = false;
        meeting.endedAt = now;
        await meeting.save();
        console.log(`Auto-ended meeting: ${meeting.title}`);
      }
    }
  } catch (error) {
    console.error("Error auto-ending meetings:", error);
  }
};

// Optional: Run auto-end check every 10 minutes
cron.schedule("*/10 * * * *", autoEndMeetings);
