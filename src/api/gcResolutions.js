import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://10.22.0.152:3000";

export const getGCResolutions = async (token) => {
  try {
    if (!token) {
      console.error("No token provided to getGCResolutions");
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(`${API_URL}/gc_resolutions`, { headers });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch GC Resolutions:", error);
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

export const createGCResolution = async (data, token) => {
  try {
    if (!token) {
      console.error("No token provided to createGCResolution");
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(`${API_URL}/gc_resolutions`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create GC Resolution:", error);
    return null;
  }
};

export const updateGCResolution = async (id, data, token) => {
  try {
    if (!token) {
      console.error("No token provided to updateGCResolution");
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.put(`${API_URL}/gc_resolutions/${id}`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update GC Resolution:", error);
    return null;
  }
};

export const deleteGCResolution = async (id, token) => {
  try {
    if (!token) {
      console.error("No token provided to deleteGCResolution");
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.delete(`${API_URL}/gc_resolutions/${id}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to delete GC Resolution:", error);
    return null;
  }
};
