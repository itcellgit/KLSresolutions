import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "https://resolutions.klsbelagavi.org/api";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/user/validateUser`, {
    username,
    password,
  });
  return response.data;
};

export const forgotPassword = async (username) => {
  const response = await axios.post(`${API_URL}/user/forgotPassword`, {
    username,
  });
  return response.data;
};

export const resetPassword = async (username, otp, newPassword) => {
  const response = await axios.post(`${API_URL}/user/resetPassword`, {
    username,
    otp,
    newPassword,
  });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword, token) => {
  const response = await axios.post(
    `${API_URL}/user/changePassword`,
    {
      currentPassword,
      newPassword,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("roles");
  sessionStorage.removeItem("auth");
};

export function storeAuth(data) {
  if (data.user && data.user.usertype_id === 3) {
    localStorage.setItem("auth", JSON.stringify(data));
  } else {
    sessionStorage.setItem("auth", JSON.stringify(data));
  }
}

export const getToken = () => localStorage.getItem("token");
export const getUser = () => JSON.parse(localStorage.getItem("user"));
export const getRoles = () => JSON.parse(localStorage.getItem("roles"));
