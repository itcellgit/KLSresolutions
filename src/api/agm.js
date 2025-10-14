import axios from "axios";
const API_URL = "https://resolutions.klsbelagavi.org/api";
export const getAGMs = async (token) => {
  try {
    if (!token) {
      console.error("No token provided to getAGMs");
      throw new Error("Authentication required"); // Throw to handle in UI
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(`${API_URL}/agm`, { headers });

    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    console.error("Failed to fetch AGMs:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error; // Re-throw for UI handling
  }
};

export const getAGMById = async (id, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(`${API_URL}/agm/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch AGM:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

export const createAGM = async (formData, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData, let axios handle it
    };

    const response = await axios.post(`${API_URL}/agm`, formData, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to create AGM:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

export const updateAGM = async (id, formData, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData, let axios handle it
    };

    const response = await axios.put(`${API_URL}/agm/${id}`, formData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update AGM:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

export const deleteAGM = async (id, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.delete(`${API_URL}/agm/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Failed to delete AGM:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

export const getAGMsByMember = async (memberId, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(`${API_URL}/agm/member/${memberId}`, {
      headers,
    });
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    console.error("Failed to fetch AGMs by member:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

// NEW: Get a signed/temporary URL for secure file access (no auth header needed in iframe)
export const getSignedFileUrl = async (filename, token) => {
  try {
    if (!token) {
      throw new Error("Authentication required");
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.get(
      `${API_URL}/agm/file-access/${encodeURIComponent(filename)}`,
      { headers }
    );

    if (!response.data?.fileUrl) {
      throw new Error("Failed to generate file URL");
    }

    console.log("Signed file URL generated:", response.data.fileUrl);
    return response.data.fileUrl; // e.g., /api/agm/file/filename.pdf?token=abc123
  } catch (error) {
    console.error("Failed to get signed file URL:", error);
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  }
};

// Updated: downloadAGMFile now uses signed URL internally for consistency
export const downloadAGMFile = async (filename, token) => {
  try {
    const signedUrl = await getSignedFileUrl(filename, token);
    // For downloads, create a blob URL or return signedUrl for <a> download
    return signedUrl;
  } catch (error) {
    console.error("Error downloading AGM file:", error);
    throw error;
  }
};

// Keep getAGMFileUrl for legacy/reference, but deprecate for viewing
export const getAGMFileUrl = (filename) => {
  return `${API_URL}/agm/file/${encodeURIComponent(filename)}`;
};

// Add this function to your existing API functions:
export const searchPDFContent = async (searchTerm, token) => {
  try {
    const response = await fetch(`${API_URL}/agm/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ searchTerm }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching PDF content:", error);
    throw error;
  }
};
