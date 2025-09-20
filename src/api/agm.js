import axios from "axios";
const API_URL =
  process.env.REACT_APP_API_URL || "https://resolutions.klsbelagavi.org";

export const getAGMs = async (token) => {
  const response = await axios.get(`${API_URL}/agm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
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
