import axios from "axios";

const API_URL = "https://resolutions.klsbelagavi.org/api";

export const getAllManagementTenures = async (token) => {
  try {
    console.log("=== ManagementTenures API Debug ===");
    console.log("Fetching management tenures with token:", !!token);
    console.log("API URL:", `${API_URL}/management_tenures`);

    const response = await fetch(`${API_URL}/management_tenures`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Management tenures response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Management tenures API error response:", errorText);
      console.error("Full error details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Management tenures raw data received:", data);
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));

    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.tenures && Array.isArray(data.tenures)) {
      return data.tenures;
    } else if (
      data.managementTenures &&
      Array.isArray(data.managementTenures)
    ) {
      return data.managementTenures;
    } else {
      console.error("Unexpected data structure:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching management tenures:", error);
    throw error;
  }
};

export const createManagementTenure = async (tenureData, token) => {
  try {
    const response = await fetch(`${API_URL}/management_tenures`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tenureData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating management tenure:", error);
    throw error;
  }
};

export const updateManagementTenure = async (id, tenureData, token) => {
  try {
    const response = await fetch(`${API_URL}/management_tenures/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tenureData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating management tenure:", error);
    throw error;
  }
};

export const deleteManagementTenure = async (id, token) => {
  try {
    const response = await fetch(`${API_URL}/management_tenures/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting management tenure:", error);
    throw error;
  }
};
