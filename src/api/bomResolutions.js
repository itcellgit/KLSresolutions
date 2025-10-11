import axios from "axios";

const API_URL = "https://resolutions.klsbelagavi.org/api"; //"http://10.22.0.152:3000/api";

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
      // Remove Content-Type for FormData - let browser set multipart/form-data
    };
    const response = await axios.post(`${API_URL}/bom_resolutions`, data, {
      headers,
    });
    console.log("Create BOM Resolution Response:", response.data);
    alert("BOM Resolution created successfully");
    return response.data;
  } catch (error) {
    console.error("Failed to create BOM Resolution:", error.message);
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
      // Remove Content-Type for FormData - let browser set multipart/form-data
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

// In your bomResolutions.js API file
export const searchPDFContent = async (searchText, token) => {
  if (!token) {
    console.log("No token provided to searchPDFContent");
    throw new Error("Authentication token is required");
  }

  try {
    console.log("Making BOM PDF search request:", searchText);

    // Try with 'query' parameter if 'searchText' doesn't work
    const response = await fetch(
      `${API_URL}/bom_resolutions/search-pdf?query=${encodeURIComponent(
        searchText
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BOM Search API error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("BOM Search API response:", data);
    return data;
  } catch (error) {
    console.error("Search BOM PDF content error:", error);
    throw error;
  }
};
