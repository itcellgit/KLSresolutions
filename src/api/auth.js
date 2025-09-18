import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "https://resolutions.klsbelagavi.org";

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/user/validateUser`, {
    username,
    password,
  });
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
