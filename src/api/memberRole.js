
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const assignRole = async (data, token) => {
  const response = await axios.post(`${API_URL}/members/assignRole`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getMemberRoles = async (member_id, token) => {
  const response = await axios.get(`${API_URL}/members/${member_id}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
