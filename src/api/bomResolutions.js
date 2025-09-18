import axios from "axios";
// Use relative path in development to leverage the proxy
const API_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.REACT_APP_API_URL || "https://resolutions.klsbelagavi.org ";

export const getBOMResolutions = async (token) => {
  try {
    if (!token) {
      console.error("No token provided to getBOMResolutions");
      return null;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await axios.get(`${API_URL}/bom_resolutions`, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch BOM Resolutions:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    return null;
  }
};

export const createBOMResolution = async (data, token) => {
  try {
    if (!token) {
      console.error("No token provided to createBOMResolution");
      return null;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const response = await axios.post(`${API_URL}/bom_resolutions`, data, {
      headers,
    });
    console.log("Create BOM Resolution Response:", response.data);
    alert("BOM Resolution created successfully");
    return response.data;
  } catch (error) {
    console.error("Failed to create BOM Resolution:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    return null;
  }
};

export const deleteBOMResolution = async (id, token) => {
  try {
    if (!token) {
      console.error("No token provided to deleteBOMResolution");
      return null;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    console.log(`Deleting BOM Resolution with ID: ${id}`);
    const response = await axios.delete(`${API_URL}/bom_resolutions/${id}`, {
      headers,
    });
    console.log("Delete BOM Resolution Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to delete BOM Resolution:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    return null;
  }
};

export const updateBOMResolution = async (id, data, token) => {
  try {
    if (!token) {
      console.error("No token provided to updateBOMResolution");
      return null;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    console.log(`Updating BOM Resolution with ID: ${id}`, data);
    const response = await axios.put(`${API_URL}/bom_resolutions/${id}`, data, {
      headers,
    });
    console.log("Update BOM Resolution Response:", response.data);
    alert("BOM Resolution updated successfully");
    return response.data;
  } catch (error) {
    console.error("Failed to update BOM Resolution:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    return null;
  }
};
