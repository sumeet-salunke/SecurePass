import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./token.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// Request interceptor: attach in-memory access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh access token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints to prevent endless loops
    const isAuthEndpoint =
      originalRequest?.url?.includes("/api/auth/refresh") ||
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/register") ||
      originalRequest?.url?.includes("/api/auth/verify-otp") ||
      originalRequest?.url?.includes("/api/auth/mfa/verify-login") ||
      originalRequest?.url?.includes("/api/auth/mfa/verify-recovery");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint.");
        }

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;