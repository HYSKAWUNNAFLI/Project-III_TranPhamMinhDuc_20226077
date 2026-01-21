import axios, { AxiosError } from "axios";

// Prefer .env config; fallback to backend dev port 8000 with /api prefix
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8000/api"; // be domain

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Enable sending/receiving cookies
});

console.log("API Base URL:", API_BASE_URL);

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    // No need to manually set Authorization header

    console.log(
      "Making request to:",
      (config.baseURL || "") + (config.url || "")
    );
    console.log("Request config:", config);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors consistently
apiClient.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error: AxiosError) => {
    // Normalize error response
    const normalizedError = {
      message: "An error occurred",
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    if (error.response) {
      // Server responded with error status
      normalizedError.message =
        (error.response.data as any)?.message ||
        error.message ||
        `Request failed with status ${error.response.status}`;

      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - optionally redirect to login
        // window.location.href = '/login';
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        normalizedError.message =
          "You do not have permission to perform this action";
      }
    } else if (error.request) {
      // Request made but no response received
      normalizedError.message =
        "No response from server. Please check your connection.";
    } else {
      // Error setting up the request
      normalizedError.message = error.message;
    }

    return Promise.reject(normalizedError);
  }
);

export { apiClient, API_BASE_URL };
