import api from "../lib/axios";

// Signup
export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

// Login
export const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// Current User
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};