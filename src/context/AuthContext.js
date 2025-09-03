import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;

      // Verify token and fetch user
      axios
        .get("http://localhost:5000/api/auth/user")
        .then((res) => {
          setUser(res.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["x-auth-token"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login with email + password
  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["x-auth-token"] = res.data.token;
      setUser(res.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error(err.response?.data?.msg || "Login failed");
      return false;
    }
  };

  // Register with email + password
  const register = async (email, password) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        email,
        password,
      });
      return true;
    } catch (err) {
      console.error(err.response?.data?.msg || "Registration failed");
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["x-auth-token"];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    // <AuthContext.Provider
    //   value={{
    //     user,
    //     isAuthenticated,
    //     loading,
    //     login,
    //     register,
    //     logout,
    //   }}
    // >

    <AuthContext.Provider
      value={{
        currentUser: user, // 👈 add this alias
        user, // optional, keep both if you want
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
