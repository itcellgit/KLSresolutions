import axios from "axios";

const API_URL = "https://resolutions.klsbelagavi.org/api"; //"http://10.22.0.152:3000/api";

export const getGCResolutions = async (token, tenure_id = null) => {
  try {
    if (!token) {
      console.error("No token provided to getGCResolutions");
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Build query parameters
    const params = {};
    if (tenure_id) {
      params.tenure_id = tenure_id;
    }

    const response = await axios.get(`${API_URL}/gc_resolutions`, {
      headers,
      params,
    });

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
      // Don't set Content-Type for FormData - let browser set it with boundary
    };

    console.log("Sending data to API:", data); // Log the data being sent

    const response = await axios.post(`${API_URL}/gc_resolutions`, data, {
      headers,
      timeout: 300000, // 5 minutes timeout for large file uploads
      maxContentLength: 52428800, // 50MB
      maxBodyLength: 52428800, // 50MB
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create GC Resolution:", error);

    // Enhanced error logging
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    // Return error details for better debugging
    if (error.response?.status === 413) {
      throw new Error(
        "File too large. Please ensure your files are under 50MB each."
      );
    }

    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        `HTTP ${error.response?.status}: ${error.message}`
    );
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
      // Don't set Content-Type for FormData - let browser set it with boundary
    };

    const response = await axios.put(`${API_URL}/gc_resolutions/${id}`, data, {
      headers,
      timeout: 300000, // 5 minutes timeout for large file uploads
      maxContentLength: 52428800, // 50MB
      maxBodyLength: 52428800, // 50MB
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
