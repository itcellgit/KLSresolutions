import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://31.97.239.8:3000/api';

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/user/validateUser`, { username, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('roles');
};

export const storeAuth = (data) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('roles', JSON.stringify(data.roles));
};

export const getToken = () => localStorage.getItem('token');
export const getUser = () => JSON.parse(localStorage.getItem('user'));
export const getRoles = () => JSON.parse(localStorage.getItem('roles'));
