import { axiosInstance } from "./axios";

// Create instant meeting
export const createMeeting = async (meetingData) => {
  try {
    console.log("Creating meeting with data:", meetingData);
    const response = await axiosInstance.post("/meetings/create", meetingData);
    console.log("Meeting created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating meeting:", error);
    throw error;
  }
};

// Schedule future meeting
export const scheduleMeeting = async (meetingData) => {
  try {
    console.log("Scheduling meeting with data:", meetingData);
    const response = await axiosInstance.post("/meetings/schedule", meetingData);
    console.log("Meeting scheduled successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    throw error;
  }
};

// Join meeting
export const joinMeeting = async (meetingId) => {
  try {
    console.log("Joining meeting:", meetingId);
    const response = await axiosInstance.post(`/meetings/${meetingId}/join`);
    console.log("Successfully joined meeting:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error joining meeting:", error);
    throw error;
  }
};

// Get meeting details
export const getMeeting = async (meetingId) => {
  try {
    console.log("Fetching meeting details for:", meetingId);
    const response = await axiosInstance.get(`/meetings/${meetingId}`);
    console.log("Meeting details fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching meeting details:", error);
    throw error;
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async () => {
  try {
    console.log("Fetching upcoming meetings");
    const response = await axiosInstance.get("/meetings/user/upcoming");
    console.log("Upcoming meetings fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    throw error;
  }
};

// Get meeting history
export const getMeetingHistory = async () => {
  try {
    console.log("Fetching meeting history");
    const response = await axiosInstance.get("/meetings/user/history");
    console.log("Meeting history fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching meeting history:", error);
    throw error;
  }
};

// End meeting (admin only)
export const endMeeting = async (meetingId) => {
  try {
    console.log("Ending meeting:", meetingId);
    const response = await axiosInstance.post(`/meetings/${meetingId}/end`);
    console.log("Meeting ended successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error ending meeting:", error);
    throw error;
  }
};

// Delete scheduled meeting (creator only)
export const deleteMeeting = async (meetingId) => {
  try {
    console.log("Deleting meeting:", meetingId);
    const response = await axiosInstance.delete(`/meetings/${meetingId}`);
    console.log("Meeting deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting meeting:", error);
    throw error;
  }
};

// Update participant permissions (admin only)
export const updatePermissions = async (meetingId, userId, permissions) => {
  try {
    console.log("Updating permissions for user:", userId, "in meeting:", meetingId, "permissions:", permissions);
    const response = await axiosInstance.put(`/meetings/${meetingId}/permissions`, {
      userId,
      permissions,
    });
    console.log("Permissions updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating permissions:", error);
    throw error;
  }
};

// Get chat history
export const getChatHistory = async (meetingId) => {
  try {
    console.log("Fetching chat history for meeting:", meetingId);
    const response = await axiosInstance.get(`/meetings/${meetingId}/chat`);
    console.log("Chat history fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Get ICE servers for WebRTC
export const getIceServers = async () => {
  try {
    console.log("Fetching ICE servers");
    const response = await axiosInstance.get("/webrtc/ice-servers");
    console.log("ICE servers fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching ICE servers:", error);
    throw error;
  }
};

// Activate scheduled meeting
export const activateMeeting = async (meetingId) => {
  try {
    console.log("Activating meeting:", meetingId);
    const response = await axiosInstance.post(`/meetings/${meetingId}/activate`);
    console.log("Meeting activated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error activating meeting:", error);
    throw error;
  }
};