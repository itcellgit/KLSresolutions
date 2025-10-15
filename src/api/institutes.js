import { API_BASE_URL } from '../config';
import axios from "axios";



export const getInstitutes = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/institute`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getInstituteById = async (id, token) => {
  const response = await axios.get(`${API_BASE_URL}/institute/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createInstitute = async (data, token) => {
  const response = await axios.post(`${API_BASE_URL}/institute`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateInstitute = async (id, data, token) => {
  const response = await axios.put(`${API_BASE_URL}/institute/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteInstitute = async (id, token) => {
  const response = await axios.delete(`${API_BASE_URL}/institute/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
