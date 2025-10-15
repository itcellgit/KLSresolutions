import { API_BASE_URL } from "../config";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check for stored user data on app launch
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError("");

    try {
      console.log(
        "🔍 Attempting login to:",
        `${API_BASE_URL}/user/validateUser`
      );

      // *** CHANGED: Using /user/validateUser endpoint (original mobile endpoint) ***
      const response = await fetch(`${API_BASE_URL}/user/validateUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // *** CHANGED: Using 'username' field instead of 'email' ***
          password: password,
        }),
      });

      console.log("🔍 Response status:", response.status);

      const responseText = await response.text();
      console.log("🔍 Response body:", responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Login failed`);
      }

      const data = JSON.parse(responseText);

      console.log("=== LOGIN RESPONSE DEBUG ===");
      console.log("Full login response:", data);
      console.log("User data:", data.user || data);
      console.log("Token in response:", data.token);

      // Store user data (handle both data.user and direct data formats)
      const userData = data.user || data;
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Store token if it exists in response
      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        console.log("Token stored successfully");
      } else {
        console.log("No token in login response");
      }

      setUser(userData);

      return data;
    } catch (error) {
      console.log("🚨 Login error:", error);
      console.log("🚨 Error message:", error.message);
      setError(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("roles");
      setUser(null);
      setError("");
      console.log("Logout completed - all data cleared");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError("");

    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem("token");

      console.log("=== CHANGE PASSWORD DEBUG ===");
      console.log("Retrieved token:", token ? "Token exists" : "No token");
      console.log("User object:", user);

      const requestBody = {
        currentPassword,
        newPassword,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`; // *** CHANGED: Using Bearer token format ***
        console.log("Added Authorization Bearer header");
      } else {
        console.log("No token found - this might cause 401 error");
      }

      console.log("Making request to change password...");

      // *** CHANGED: Using /user/changePassword endpoint (original mobile endpoint) ***
      const response = await fetch(`${API_BASE_URL}/user/changePassword`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (!response.ok) {
        let errorMessage = "Password change failed";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: "Password changed successfully" };
      }

      console.log("Password change successful:", data);
      return data;
    } catch (error) {
      console.log("=== CHANGE PASSWORD ERROR ===");
      console.log("Error message:", error.message);

      setError(error.message || "Password change failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
