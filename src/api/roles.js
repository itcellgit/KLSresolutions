
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'https://resolutions.klsbelagavi.org/api/roles';

export const getRoles = async (token) => {
  const response = await axios.get(`${API_URL}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createRole = async (data, token) => {
  const response = await axios.post(`${API_URL}/roles`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRole = async (id, data, token) => {
  const response = await axios.put(`${API_URL}/roles/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteRole = async (id, token) => {
  const response = await axios.delete(`${API_URL}/roles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
