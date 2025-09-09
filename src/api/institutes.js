
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'https://resolutions.klsbelagavi.org/api';

export const getInstitutes = async (token) => {
  const response = await axios.get(`${API_URL}/institute`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getInstituteById = async (id, token) => {
  const response = await axios.get(`${API_URL}/institute/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createInstitute = async (data, token) => {
  const response = await axios.post(`${API_URL}/institute`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateInstitute = async (id, data, token) => {
  const response = await axios.put(`${API_URL}/institute/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteInstitute = async (id, token) => {
  const response = await axios.delete(`${API_URL}/institute/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
