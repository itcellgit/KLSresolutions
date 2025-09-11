import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://10.22.0.152:3000";

export const getMembers = async (token) => {
  const response = await axios.get(`${API_URL}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getMemberById = async (id, token) => {
  const response = await axios.get(`${API_URL}/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createMember = async (data, token) => {
  const response = await axios.post(`${API_URL}/members`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateMember = async (id, data, token) => {
  console.log("API - updateMember called with id:", id, "and data:", data);
  const response = await axios.put(`${API_URL}/members/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("API - updateMember response:", response.data);
  return response.data;
};

export const deleteMember = async (id, token) => {
  const response = await axios.delete(`${API_URL}/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignRole = async (data, token) => {
  const response = await axios.post(`${API_URL}/members/assignRole`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
