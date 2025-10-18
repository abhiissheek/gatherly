import nodemailer from "nodemailer";
import "dotenv/config";

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Email credentials not configured. Email notifications disabled.");
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const transporter = createTransporter();

// Send meeting invitation email
export const sendMeetingInvite = async (email, meetingDetails) => {
  if (!transporter) {
    console.log("Email service not configured, skipping invite email");
    return;
  }

  const { title, meetingId, scheduledAt, creator } = meetingDetails;

  const meetingUrl = `${process.env.FRONTEND_URL}/meeting/${meetingId}`;
  const scheduledTime = scheduledAt
    ? new Date(scheduledAt).toLocaleString()
    : "Instant Meeting";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Meeting Invitation: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited to a meeting!</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">${title}</h3>
          <p><strong>Organized by:</strong> ${creator}</p>
          <p><strong>Scheduled for:</strong> ${scheduledTime}</p>
          <p><strong>Meeting ID:</strong> ${meetingId}</p>
        </div>
        <a href="${meetingUrl}" 
           style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
          Join Meeting
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${meetingUrl}">${meetingUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Meeting invite sent to ${email}`);
  } catch (error) {
    console.error("Error sending meeting invite:", error);
  }
};

// Send meeting reminder email
export const sendMeetingReminder = async (email, meetingDetails) => {
  if (!transporter) {
    console.log("Email service not configured, skipping reminder email");
    return;
  }

  const { title, meetingId, scheduledAt, creator } = meetingDetails;

  const meetingUrl = `${process.env.FRONTEND_URL}/meeting/${meetingId}`;
  const scheduledTime = new Date(scheduledAt).toLocaleString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Reminder: Meeting starts in 15 minutes - ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Meeting Reminder</h2>
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
          <h3 style="color: #555; margin-top: 0;">${title}</h3>
          <p><strong>Starts at:</strong> ${scheduledTime}</p>
          <p><strong>Organized by:</strong> ${creator}</p>
          <p style="color: #FF9800; font-weight: bold;">Your meeting starts in 15 minutes!</p>
        </div>
        <a href="${meetingUrl}" 
           style="display: inline-block; background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
          Join Meeting Now
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Meeting ID: ${meetingId}<br>
          <a href="${meetingUrl}">${meetingUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Meeting reminder sent to ${email}`);
  } catch (error) {
    console.error("Error sending meeting reminder:", error);
  }
};
