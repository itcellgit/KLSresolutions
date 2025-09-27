import React from "react";

const FileLink = ({ filename, label = "Download", className = "" }) => {
  if (!filename) {
    return <span className="text-gray-400 italic">No file uploaded</span>;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/download/${filename}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <button
        onClick={handleDownload}
        className="text-blue-600 hover:text-blue-800 text-sm underline"
      >
        {label}
      </button>
      <span className="text-xs text-gray-500">({filename})</span>
    </div>
  );
};

export default FileLink;
