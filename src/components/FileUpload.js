import React, { useState, useRef } from "react";

const FileUpload = ({
  label,
  name,
  value,
  onChange,
  accept = ".pdf,.doc,.docx,.txt",
  maxSize = 10 * 1024 * 1024, // 10MB default
  required = false,
  existingFile = null,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(
        maxSize / (1024 * 1024)
      )}MB`;
    }

    // Check file type
    const allowedTypes = accept.split(",").map((type) => type.trim());
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return `File type must be one of: ${allowedTypes.join(", ")}`;
    }

    return null;
  };

  const handleFileSelect = (file) => {
    setUploadError("");

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);

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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadProgress(0);
    setUploadError("");
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getCurrentFileName = () => {
    if (value && value.name) {
      return value.name;
    }
    if (existingFile) {
      return existingFile.split("/").pop() || existingFile;
    }
    return null;
  };

  const hasFile = value || existingFile;
  const fileName = getCurrentFileName();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!hasFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
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
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">Supported formats: {accept}</p>
            <p className="text-sm text-gray-500">
              Maximum size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-blue-500 mr-3"
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
              <div>
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                {value && value.size && (
                  <p className="text-xs text-gray-500">
                    {(value.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {existingFile && !value && (
                <a
                  href={`/api/files/download/${existingFile}`}
                  download
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Download
                </a>
              )}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Replace
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {uploadError}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        name={name}
      />
    </div>
  );
};

export default FileUpload;
