// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout } from "../utils/api";
import axios from "axios";

const API_URL = "http://localhost:4000/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-load user on refresh
  useEffect(() => {
    axios
      .get(`${API_URL}/auth/me`)
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = async ({ name, email, password }) => {
    const res = await axios.post(`${API_URL}/auth/signup`, {
      name,
      email,
      password,
    });

    if (res.data?.user) {
      setUser(res.data.user);
    }

    return res.data;
  };

  const login = async ({ email, password }) => {
    const res = await apiLogin({ email, password });
    
    if (res.data?.user) {
      setUser(res.data.user);
    }

    return res.data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const res = await axios.put(`${API_URL}/auth/me`, payload);
    if (res.data) setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
