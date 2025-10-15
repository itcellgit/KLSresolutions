import { API_BASE_URL } from '../config';
import axios from "axios";

import { API_BASE_URL } from '../config';
import axios from "axios";


export const getRoles = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createRole = async (data, token) => {
  const response = await axios.post(`${API_BASE_URL}/roles`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRole = async (id, data, token) => {
  const response = await axios.put(`${API_BASE_URL}/roles/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteRole = async (id, token) => {
  const response = await axios.delete(`${API_BASE_URL}/roles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
