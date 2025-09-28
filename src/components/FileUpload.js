import React, { useState, useRef } from "react";

const FileUpload = ({
  label,
  name,
  accept = ".pdf",
  onChange,
  value,
  existingFile,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const allowedTypes = accept.split(",").map((type) => type.trim());
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      return `File type must be one of: ${accept}`;
    }

    // Removed size validation - no file size limit

    return null;
  };

  const handleFileSelect = (file) => {
    setError("");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          onChange(file);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setError("");
    setUploadProgress(0);
    setIsUploading(false);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentFileName = value?.name || existingFile || "";

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          isDragOver
            ? "border-indigo-500 bg-indigo-50"
            : error
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentFileName ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <svg
                className="w-8 h-8 mr-2 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                File selected
              </span>
            </div>
            <div className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded">
              {currentFileName}
            </div>
            {isUploading && (
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 transition-all duration-300 bg-indigo-600 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <svg
                className="w-10 h-10 mr-2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Click to upload
              </button>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: {accept}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center mt-2 text-sm text-red-600">
          <svg
            className="flex-shrink-0 w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
