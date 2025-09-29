// ../../api/memberRole.js
import axios from "axios";

// Base API URL
const API_URL = "https://resolutions.klsbelagavi.org/api"; //"http://10.22.0.152:3000/api";

export const assignRole = async (data, token) => {
  // Convert string values to proper types before sending
  const processedData = {
    ...data,
    member_id: parseInt(data.member_id),
    role_id: parseInt(data.role_id),
    institute_id: data.institute_id ? parseInt(data.institute_id) : null,
    tenure_id: data.tenure_id ? parseInt(data.tenure_id) : null,
  };

  //alert(JSON.stringify(processedData));
  try {
    const response = await axios.post(`${API_URL}/memberrole`, processedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    // axios error response data is in error.response.data
    //console.error("API Error:", error.response?.data);

    // Show detailed validation errors if available
    const errorData = error.response?.data;
    if (errorData?.details) {
      alert(
        "Validation errors:\n" + JSON.stringify(errorData.details, null, 2)
      );
    } else {
      alert("Full error response: " + JSON.stringify(errorData, null, 2));
    }

    const message =
      errorData?.error ||
      errorData?.message ||
      error.message ||
      "Failed to assign role";
    throw new Error(message);
  }
};

// Updated function to fetch all member roles
export const getAllMemberRoles = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/memberrole`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API response error:", error.response?.data);
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch member roles";
    throw new Error(message);
  }
};

// Function to update a member role
export const updateMemberRole = async (id, data, token) => {
  // Convert string values to proper types before sending
  const processedData = {
    ...data,
    member_id: data.member_id ? parseInt(data.member_id) : undefined,
    role_id: data.role_id ? parseInt(data.role_id) : undefined,
    institute_id: data.institute_id ? parseInt(data.institute_id) : null,
    tenure_id: data.tenure_id ? parseInt(data.tenure_id) : null,
  };

  try {
    const response = await axios.put(
      `${API_URL}/memberrole/${id}`,
      processedData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to update member role";
    throw new Error(message);
  }
};

// Function to delete a member role
export const deleteMemberRole = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/memberrole/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete member role";
    throw new Error(message);
  }
};

// Keep the original function for fetching roles for a specific member
export const getMemberRoles = async (member_id, token) => {
  try {
    const response = await axios.get(`${API_URL}/members/${member_id}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch member roles";
    throw new Error(message);
  }
};
