// import { API_BASE_URL } from '../config';
// import axios from "axios";

// export const getGCResolutions = async (token, tenure_id = null) => {
//   try {
//     if (!token) {
//       console.error("No token provided to getGCResolutions");
//       return null;
//     }

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     };

//     // Build query parameters
//     const params = {};
//     if (tenure_id) {
//       params.tenure_id = tenure_id;
//     }

//     const response = await axios.get(`${API_BASE_URL}/gc_resolutions`, {
//       headers,
//       params,
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Failed to fetch GC Resolutions:", error);
//     if (error.response) {
//       console.error("Error response data:", error.response.data);
//       console.error("Error response status:", error.response.status);
//       console.error("Error response headers:", error.response.headers);
//     } else if (error.request) {
//       console.error("Error request:", error.request);
//     } else {
//       console.error("Error message:", error.message);
//     }
//     return null;
//   }
// };

// export const createGCResolution = async (data, token) => {
//   try {
//     if (!token) {
//       console.error("No token provided to createGCResolution");
//       return null;
//     }

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       // Don't set Content-Type for FormData - let browser set it with boundary
//     };

//     console.log("Sending data to API:", data); // Log the data being sent

//     const response = await axios.post(`${API_BASE_URL}/gc_resolutions`, data, {
//       headers,
//       timeout: 300000, // 5 minutes timeout for large file uploads
//       maxContentLength: 52428800, // 50MB
//       maxBodyLength: 52428800, // 50MB
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Failed to create GC Resolution:", error);

//     // Enhanced error logging
//     if (error.response) {
//       console.error("Error response data:", error.response.data);
//       console.error("Error response status:", error.response.status);
//       console.error("Error response headers:", error.response.headers);
//     } else if (error.request) {
//       console.error("Error request:", error.request);
//     } else {
//       console.error("Error message:", error.message);
//     }

//     // Return error details for better debugging
//     if (error.response?.status === 413) {
//       throw new Error(
//         "File too large. Please ensure your files are under 50MB each."
//       );
//     }

//     throw new Error(
//       error.response?.data?.message ||
//         error.response?.data?.error ||
//         `HTTP ${error.response?.status}: ${error.message}`
//     );
//   }
// };

// export const updateGCResolution = async (id, data, token) => {
//   try {
//     if (!token) {
//       console.error("No token provided to updateGCResolution");
//       return null;
//     }

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       // Don't set Content-Type for FormData - let browser set it with boundary
//     };

//     const response = await axios.put(`${API_BASE_URL}/gc_resolutions/${id}`, data, {
//       headers,
//       timeout: 300000, // 5 minutes timeout for large file uploads
//       maxContentLength: 52428800, // 50MB
//       maxBodyLength: 52428800, // 50MB
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Failed to update GC Resolution:", error);
//     return null;
//   }
// };

// export const deleteGCResolution = async (id, token) => {
//   try {
//     if (!token) {
//       console.error("No token provided to deleteGCResolution");
//       return null;
//     }

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     };

//     const response = await axios.delete(`${API_BASE_URL}/gc_resolutions/${id}`, {
//       headers,
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Failed to delete GC Resolution:", error);
//     return null;
//   }
// };

import { API_BASE_URL } from "../config";
import axios from "axios";

// BASIC CRUD FUNCTIONS
export const getGCResolutions = async (token) => {
  try {
    if (!token) {
      throw new Error("No token provided to getGCResolutions");
    }

    const response = await axios.get(`${API_BASE_URL}/gc_resolutions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching GC resolutions:", error);
    throw error;
  }
};

export const createGCResolution = async (formData, token) => {
  try {
    if (!token) {
      throw new Error("No token provided to createGCResolution");
    }

    console.log("Creating GC resolution...");

    const response = await axios.post(
      `${API_BASE_URL}/gc_resolutions`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        timeout: 300000, // 5 minutes timeout for large file uploads
        maxContentLength: 52428800, // 50MB
        maxBodyLength: 52428800, // 50MB
      }
    );

    console.log("GC resolution created successfully");
    return response.data;
  } catch (error) {
    console.error("Error creating GC resolution:", error);

    // Enhanced error handling
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

export const updateGCResolution = async (id, formData, token) => {
  try {
    if (!token) {
      throw new Error("No token provided to updateGCResolution");
    }

    console.log(`Updating GC resolution ${id}...`);

    const response = await axios.put(
      `${API_BASE_URL}/gc_resolutions/${id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        timeout: 300000, // 5 minutes timeout for large file uploads
        maxContentLength: 52428800, // 50MB
        maxBodyLength: 52428800, // 50MB
      }
    );

    console.log("GC resolution updated successfully");
    return response.data;
  } catch (error) {
    console.error("Error updating GC resolution:", error);
    throw error;
  }
};

export const deleteGCResolution = async (id, token) => {
  try {
    if (!token) {
      throw new Error("No token provided to deleteGCResolution");
    }

    console.log(`Deleting GC resolution ${id}...`);

    const response = await axios.delete(
      `${API_BASE_URL}/gc_resolutions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("GC resolution deleted successfully");
    return response.data;
  } catch (error) {
    console.error("Error deleting GC resolution:", error);
    throw error;
  }
};

export const searchPDFContent = async (searchTerm, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/gc_resolutions/search-pdf`,
      { searchTerm },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error searching PDF content:", error);
    throw error;
  }
};

// MEMBER-BASED API FUNCTIONS
export const getGCResolutionsByMemberAndTenure = async (
  memberId,
  tenureId,
  token
) => {
  try {
    console.log(
      `Fetching GC resolutions for member ${memberId} and tenure ${tenureId}`
    );

    const response = await axios.get(
      `${API_BASE_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log(
      `Successfully fetched ${data.data.summary.total_resolutions} GC resolutions for ${data.data.summary.total_institutes} institutes`
    );

    return data.data;
  } catch (error) {
    console.error("Error fetching GC resolutions by member and tenure:", error);
    throw error;
  }
};

export const getGCResolutionsByMemberTenureAndInstitute = async (
  memberId,
  tenureId,
  instituteId,
  token
) => {
  try {
    console.log(
      `Fetching GC resolutions for member ${memberId}, tenure ${tenureId}, institute ${instituteId}`
    );

    const response = await axios.get(
      `${API_BASE_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institute/${instituteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log(
      `Successfully fetched ${data.data.statistics.total_resolutions} GC resolutions for specific institute`
    );

    return data.data;
  } catch (error) {
    console.error(
      "Error fetching GC resolutions by member, tenure, and institute:",
      error
    );
    throw error;
  }
};

export const getMemberAccessibleInstitutes = async (
  memberId,
  tenureId,
  token
) => {
  try {
    console.log(
      `Fetching accessible institutes for member ${memberId} and tenure ${tenureId}`
    );

    const response = await axios.get(
      `${API_BASE_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institutes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log(
      `Successfully fetched ${data.data.total_institutes} accessible institutes`
    );

    return data.data;
  } catch (error) {
    console.error("Error fetching member accessible institutes:", error);
    throw error;
  }
};

export const searchMemberGCResolutions = async (
  memberId,
  tenureId,
  searchTerm,
  token
) => {
  try {
    console.log(
      `Searching GC resolutions for member ${memberId}, tenure ${tenureId}, term: ${searchTerm}`
    );

    const response = await axios.post(
      `${API_BASE_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/search`,
      { searchTerm },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log(`Found ${data.data.results?.length || 0} search results`);

    return data.data;
  } catch (error) {
    console.error("Error searching member GC resolutions:", error);
    throw error;
  }
};

// UTILITY FUNCTIONS
export const checkMemberInstituteAccess = async (
  memberId,
  tenureId,
  instituteId,
  token
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institute/${instituteId}/access-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { hasAccess: true, data: response.data.data };
  } catch (error) {
    console.error("Error checking member institute access:", error);
    return { hasAccess: false, error: error.message };
  }
};

export const getGCResolutionFile = async (
  filename,
  memberId,
  tenureId,
  token
) => {
  try {
    console.log(
      `Fetching GC resolution file: ${filename} for member ${memberId}`
    );

    const response = await axios.get(
      `${API_BASE_URL}/gc_resolutions/file/${filename}?memberId=${memberId}&tenureId=${tenureId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important for file downloads
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching GC resolution file:", error);
    throw error;
  }
};

export const downloadGCResolutionFile = async (
  filename,
  memberId,
  tenureId,
  token
) => {
  try {
    const blob = await getGCResolutionFile(filename, memberId, tenureId, token);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error downloading GC resolution file:", error);
    throw error;
  }
};

// LEGACY COMPATIBILITY FUNCTIONS
export const getMemberRoles = async (memberId, token) => {
  console.warn(
    "getMemberRoles is deprecated. Use getGCResolutionsByMemberAndTenure or getMemberAccessibleInstitutes instead."
  );

  try {
    const response = await axios.get(
      `${API_BASE_URL}/member_roles/${memberId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching member roles:", error);
    throw error;
  }
};

// Default export for backward compatibility
export default {
  // Basic CRUD functions
  getGCResolutions,
  createGCResolution,
  updateGCResolution,
  deleteGCResolution,
  searchPDFContent,

  // Member-based functions
  getGCResolutionsByMemberAndTenure,
  getGCResolutionsByMemberTenureAndInstitute,
  getMemberAccessibleInstitutes,
  searchMemberGCResolutions,

  // Utility functions
  checkMemberInstituteAccess,
  getGCResolutionFile,
  downloadGCResolutionFile,

  // Legacy functions
  getMemberRoles,
};
