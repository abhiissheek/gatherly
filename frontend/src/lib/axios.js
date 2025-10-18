import axios from "axios";

// Ensure the API URL always includes the /api prefix
const getBaseUrl = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001/api";
  }
  
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.endsWith('/api')) {
    return `${apiUrl}/api`;
  }
  return apiUrl || "/api";
};

const BASE_URL = getBaseUrl();

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});