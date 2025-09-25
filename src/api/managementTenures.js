import axios from "axios";

const API_URL = "http://10.22.0.152:3000"; //"https://resolutions.klsbelagavi.org/api";

// Get all management tenures
export const getAllManagementTenures = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/management_tenures`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Fetched management tenures:", response.data);
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to fetch management tenures";
    throw new Error(message);
  }
};

// Get management tenure by id
export const getManagementTenureById = async (id, token) => {
  try {
    const response = await axios.get(`${API_URL}/management_tenures/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to fetch management tenure";
    throw new Error(message);
  }
};

// Create new management tenure
export const createManagementTenure = async (data, token) => {
  try {
    const response = await axios.post(`${API_URL}/management_tenures`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to create management tenure";
    throw new Error(message);
  }
};

// Update management tenure
export const updateManagementTenure = async (id, data, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/management_tenures/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to update management tenure";
    throw new Error(message);
  }
};

// Delete management tenure
export const deleteManagementTenure = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/management_tenures/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to delete management tenure";
    throw new Error(message);
  }
};
