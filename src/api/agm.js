import axios from "axios";
const API_URL = "http://10.22.0.152:3000/api"; //"http://10.22.0.152:3000";

export const getAGMs = async (token) => {
  const response = await axios.get(`${API_URL}/agm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("Raw API response:", response);
  console.log("Response data:", response.data);
  // Handle both array and object responses
  return Array.isArray(response.data)
    ? response.data
    : response.data.data || [];
};

// In getAGMs function

export const getAGMById = async (id, token) => {
  const response = await axios.get(`${API_URL}/agm/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createAGM = async (data, token) => {
  const response = await axios.post(`${API_URL}/agm`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateAGM = async (id, data, token) => {
  const response = await axios.put(`${API_URL}/agm/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteAGM = async (id, token) => {
  const response = await axios.delete(`${API_URL}/agm/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getAGMsByMember = async (token) => {
  const response = await axios.get(`${API_URL}/agm/by-member/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
