import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001";
  }
  
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4); // Remove '/api' from the end
  }
  return apiUrl || window.location.origin;
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const initializeSocket = () => {
  console.log("Initializing socket connection to:", SOCKET_URL);
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }
  return socket;
};

export const getSocket = () => {
  console.log("Getting socket instance");
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  console.log("Disconnecting socket");
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
};