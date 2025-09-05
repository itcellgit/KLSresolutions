
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://31.97.239.8:3000/api';

export const getBOMResolutions = async (token) => {
  const response = await axios.get(`${API_URL}/bom_resolutions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createBOMResolution = async (data, token) => {
  const response = await axios.post(`${API_URL}/bom_resolutions`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
