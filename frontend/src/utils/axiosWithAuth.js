import axios from "axios";

const axiosWithAuth = axios.create({
  baseURL: "http://127.0.0.1:5000", // Your backend base URL
});

// Attach token to every request
axiosWithAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔒 Intercept responses and redirect on 401
axiosWithAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      window.location.href = "/"; // or use your LoginPage route
    }
    return Promise.reject(error);
  }
);

export default axiosWithAuth;
