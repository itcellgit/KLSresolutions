import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://10.22.0.152:3000";

// export const assignRole = async (data, token) => {
//   const response = await axios.post(`${API_URL}/members/assignRole`, data, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return response.data;
// };

// In ../../api/memberRole.js
export const assignRole = async (data, token) => {
  const response = await fetch("/memberRoles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to assign role");
  }

  return response.json();
};

export const getMemberRoles = async (member_id, token) => {
  const response = await axios.get(`${API_URL}/members/${member_id}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
