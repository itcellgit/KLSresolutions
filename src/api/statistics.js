import axios from "axios";

const API_URL = "http://10.22.0.152:3000/api";

export const fetchStatistics = async () => {
  const response = await axios.get(`${API_URL}/statistics`);
  console.log("Fetched statistics:", response.data);
  return response.data;
};
