
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'https://resolutions.klsbelagavi.org/api';

export const getGCResolutions = async (token) => {
  const response = await axios.get(`${API_URL}/gc_resolutions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createGCResolution = async (data, token) => {
  const response = await axios.post(`${API_URL}/gc_resolutions`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
