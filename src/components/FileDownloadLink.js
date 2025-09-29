import React from "react";

const API_URL = "https://resolutions.klsbelagavi.org/api"; //"http://10.22.0.152:3000/api";

const FileDownloadLink = ({ filename, label, token }) => {
  const handleViewFile = async () => {
    try {
      if (!filename) {
        alert("No file available");
        return;
      }

      console.log("Attempting to open file:", filename);
      console.log("File URL:", `${API_URL}/gc_resolutions/file/${filename}`);
      console.log("Token length:", token ? token.length : 0);
      console.log(
        "Token preview:",
        token ? token.substring(0, 50) + "..." : "No token"
      );

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(
        `${API_URL}/gc_resolutions/file/${filename}`,
        {
          headers,
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Open file in new tab instead of downloading
        window.open(url, "_blank");

        // Clean up the URL after a delay to allow the browser to load it
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("File view failed:", response.status, errorText);
        alert(
          `File not found or error opening file. Status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error opening file:", error);
      alert("Error opening file: " + error.message);
    }
  };

  if (!filename) {
    return <span className="italic text-gray-400">No file uploaded</span>;
  }

  return (
    <button
      onClick={handleViewFile}
      className="text-left text-blue-600 underline hover:text-blue-800"
      title={`View ${label} file`}
    >
      📄 {label} File
    </button>
  );
};

export default FileDownloadLink;
