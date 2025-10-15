import { API_BASE_URL } from '../config';
import axios from "axios";



export const getMembers = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Members API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
};

export const getMemberById = async (id, token) => {
  const response = await axios.get(`${API_BASE_URL}/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createMember = async (data, token) => {
  const response = await axios.post(`${API_BASE_URL}/members`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateMember = async (id, data, token) => {
  console.log("API - updateMember called with id:", id, "and data:", data);
  const response = await axios.put(`${API_BASE_URL}/members/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("API - updateMember response:", response.data);
  return response.data;
};

export const deleteMember = async (id, token) => {
  const response = await axios.delete(`${API_BASE_URL}/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const assignRole = async (data, token) => {
  const response = await axios.post(`${API_BASE_URL}/members/assignRole`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
