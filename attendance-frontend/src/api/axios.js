import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "../utils/tokenService";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  withCredentials: true,  // IMPORTANT for refresh cookie
});

// Attach access token automatically
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

// Auto refresh if access expires
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/auth/refresh/",
          {},
          { withCredentials: true }
        );

        const newAccess = response.data.access;
        setAccessToken(newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (refreshError) {
        clearAccessToken();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
