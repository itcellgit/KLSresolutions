import axios from "axios";

const API_URL = "https://resolutions.klsbelagavi.org/api";

// EXISTING BASIC CRUD FUNCTIONS

export const getGCResolutions = async (token) => {
  try {
    const response = await fetch(`${API_URL}/gc_resolutions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching GC resolutions:", error);
    throw error;
  }
};

export const createGCResolution = async (formData, token) => {
  try {
    console.log("Creating GC resolution...");

    const response = await fetch(`${API_URL}/gc_resolutions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData, // FormData object with files
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("GC resolution created successfully");
    return data;
  } catch (error) {
    console.error("Error creating GC resolution:", error);
    throw error;
  }
};

export const updateGCResolution = async (id, formData, token) => {
  try {
    console.log(`Updating GC resolution ${id}...`);

    const response = await fetch(`${API_URL}/gc_resolutions/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData, // FormData object with files
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("GC resolution updated successfully");
    return data;
  } catch (error) {
    console.error("Error updating GC resolution:", error);
    throw error;
  }
};

export const deleteGCResolution = async (id, token) => {
  try {
    console.log(`Deleting GC resolution ${id}...`);

    const response = await fetch(`${API_URL}/gc_resolutions/${id}`, {
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
    console.log("GC resolution deleted successfully");
    return data;
  } catch (error) {
    console.error("Error deleting GC resolution:", error);
    throw error;
  }
};

export const searchPDFContent = async (searchTerm, token) => {
  try {
    const response = await fetch(`${API_URL}/gc_resolutions/search-pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchTerm }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching PDF content:", error);
    throw error;
  }
};

// MEMBER-BASED API FUNCTIONS

/**
 * Fetch GC resolutions for a specific member and tenure
 * Only returns resolutions for institutes where the member had roles during that tenure
 */
export const getGCResolutionsByMemberAndTenure = async (
  memberId,
  tenureId,
  token
) => {
  try {
    console.log(
      `Fetching GC resolutions for member ${memberId} and tenure ${tenureId}`
    );

    const response = await fetch(
      `${API_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Successfully fetched ${data.data.summary.total_resolutions} GC resolutions for ${data.data.summary.total_institutes} institutes`
    );

    return data.data;
  } catch (error) {
    console.error("Error fetching GC resolutions by member and tenure:", error);
    throw error;
  }
};

/**
 * Fetch GC resolutions for a specific member, tenure, and institute
 * Includes authorization check to ensure member had access during that tenure
 */
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

    const response = await fetch(
      `${API_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institute/${instituteId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
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

/**
 * Get member's accessible institutes for a specific tenure
 * Returns all institutes where the member had roles during that tenure
 */
export const getMemberAccessibleInstitutes = async (
  memberId,
  tenureId,
  token
) => {
  try {
    console.log(
      `Fetching accessible institutes for member ${memberId} and tenure ${tenureId}`
    );

    const response = await fetch(
      `${API_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institutes`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(
      `Successfully fetched ${data.data.total_institutes} accessible institutes`
    );

    return data.data;
  } catch (error) {
    console.error("Error fetching member accessible institutes:", error);
    throw error;
  }
};

/**
 * Search GC resolutions with member authorization
 * Only searches within resolutions the member has access to for the specified tenure
 */
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

    const response = await fetch(
      `${API_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`Found ${data.data.results?.length || 0} search results`);

    return data.data;
  } catch (error) {
    console.error("Error searching member GC resolutions:", error);
    throw error;
  }
};

// UTILITY FUNCTIONS

/**
 * Check if member has access to specific institute for a tenure
 */
export const checkMemberInstituteAccess = async (
  memberId,
  tenureId,
  instituteId,
  token
) => {
  try {
    const response = await fetch(
      `${API_URL}/gc_resolutions/member/${memberId}/tenure/${tenureId}/institute/${instituteId}/access-check`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { hasAccess: false, message: "No access" };
    }

    const data = await response.json();
    return { hasAccess: true, data: data.data };
  } catch (error) {
    console.error("Error checking member institute access:", error);
    return { hasAccess: false, error: error.message };
  }
};

/**
 * Get GC resolution file (PDF) with member authorization
 */
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

    const response = await fetch(
      `${API_URL}/gc_resolutions/file/${filename}?memberId=${memberId}&tenureId=${tenureId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Return the blob for PDF viewing
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error fetching GC resolution file:", error);
    throw error;
  }
};

/**
 * Download GC resolution file with member authorization
 */
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

/**
 * @deprecated Use getGCResolutionsByMemberAndTenure instead
 */
export const getMemberRoles = async (memberId, token) => {
  console.warn(
    "getMemberRoles is deprecated. Use getGCResolutionsByMemberAndTenure or getMemberAccessibleInstitutes instead."
  );

  try {
    const response = await fetch(`${API_URL}/member_roles/${memberId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
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
