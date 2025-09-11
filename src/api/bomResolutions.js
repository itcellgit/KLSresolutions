import axios from "axios";

// Use relative path in development to leverage the proxy
const API_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "http://10.22.0.152:3000";

export const getBOMResolutions = async (token) => {
  const response = await axios.get(`${API_URL}/bom_resolutions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("BOM Resolutions Data:", response.data);
  //alert("Fetched BOM Resolutions");
  //alert(JSON.stringify(response.data));
  return response.data;
};

export const createBOMResolution = async (data, token) => {
  const response = await axios.post(`${API_URL}/bom_resolutions`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Create BOM Resolution Response:", response.data);
  alert("BOM Resolution created successfully");
  return response.data;
};
