// ../../api/memberRole.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://10.22.0.152:3000";

export const assignRole = async (data, token) => {
  try {
    const response = await axios.post(`${API_URL}/member_roles`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    // axios error response data is in error.response.data
    const message =
      error.response?.data?.message || error.message || "Failed to assign role";
    throw new Error(message);
  }
};

// Updated function to fetch all member roles
export const getAllMemberRoles = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/member_roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch member roles";
    throw new Error(message);
  }
};

// Function to update a member role
export const updateMemberRole = async (id, data, token) => {
  try {
    const response = await axios.put(`${API_URL}/member_roles/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to update member role";
    throw new Error(message);
  }
};

// Function to delete a member role
export const deleteMemberRole = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/member_roles/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete member role";
    throw new Error(message);
  }
};

// Keep the original function for fetching roles for a specific member
export const getMemberRoles = async (member_id, token) => {
  try {
    const response = await axios.get(`${API_URL}/members/${member_id}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch member roles";
    throw new Error(message);
  }
};
