import { API_BASE_URL } from '../config';
import axios from "axios";



export const fetchStatistics = async () => {
  const response = await axios.get(`${API_BASE_URL}/statistics`);
  console.log("Fetched statistics:", response.data);
  return response.data;
};
