import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  try {
    // Clear localStorage token
    localStorage.removeItem('authToken');
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  } catch (error) {
    // Even if backend logout fails, clear local token
    localStorage.removeItem('authToken');
    console.log("Logout error:", error);
    return { success: true, message: "Logged out locally" };
  }
};

export const getAuthUser = async () => {
  try {
    console.log("Making auth request to:", axiosInstance.defaults.baseURL + "/auth/me");
    console.log("Axios config:", axiosInstance.defaults);
    const res = await axiosInstance.get("/auth/me");
    console.log("Auth response:", res.data);
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    console.log("Error response:", error.response?.data);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}
