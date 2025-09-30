// pages/BOMResolutionsPage.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import HtmlContent from "../../components/HtmlContent";
import {
  getBOMResolutions,
  createBOMResolution,
  deleteBOMResolution,
  updateBOMResolution,
} from "../../api/bomResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";

const BOMResolutionsPage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    agenda: null,
    resolution: null,
    compliance: null,
    bom_date: "",
    tenure_id: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for filters
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for management tenures (for dropdown)
  const [managementTenures, setManagementTenures] = useState([]);
  // Get token from Redux store
  const token = useSelector((state) => state.auth.token);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file upload
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes

      // Validate file sizes before submission
      const filesToCheck = [
        { file: formData.agenda, name: "Agenda" },
        { file: formData.resolution, name: "Resolution" },
        { file: formData.compliance, name: "Compliance" },
      ];

      for (const fileObj of filesToCheck) {
        if (fileObj.file && fileObj.file.size > maxSize) {
          alert(
            `${fileObj.name} file size exceeds 50MB limit. Please select a smaller file.`
          );
          return;
        }
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("bom_date", formData.bom_date);
      submitData.append("tenure_id", formData.tenure_id);

      if (formData.agenda) {
        submitData.append("agenda", formData.agenda);
      }
      if (formData.resolution) {
        submitData.append("resolution", formData.resolution);
      }
      if (formData.compliance) {
        submitData.append("compliance", formData.compliance);
      }

      if (editingId) {
        // Edit mode: call update API
        await updateBOMResolution(editingId, submitData, token);
      } else {
        // Add mode: call create API
        await createBOMResolution(submitData, token);
      }
      setIsModalOpen(false);
      setFormData({
        agenda: null,
        resolution: null,
        compliance: null,
        bom_date: "",
        tenure_id: "",
      });
      setEditingId(null);

      // Refresh the resolutions list after creation/update
      const updatedResolutions = await getBOMResolutions(token);
      if (updatedResolutions) {
        setResolutions(updatedResolutions);
      }
    } catch (error) {
      alert("Failed to save BOM Resolution");
      console.error(error);
    }
  };

  // Handle edit button click
  const handleEdit = (resolution) => {
    setIsModalOpen(true);
    setEditingId(resolution.id);
    setFormData({
      agenda: null, // Files will need to be re-uploaded
      resolution: null,
      compliance: null,
      bom_date: resolution.bom_date || "",
      tenure_id: resolution.tenure_id || "",
    });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    console.log("Delete button clicked for ID:", id);
    if (window.confirm("Are you sure you want to delete this resolution?")) {
      try {
        if (!token) {
          alert("Authentication token not found. Please log in again.");
          return;
        }

        console.log("Deleting resolution with ID:", id);
        const result = await deleteBOMResolution(id, token);

        if (result) {
          // Refresh the resolutions list after deletion
          const updatedResolutions = await getBOMResolutions(token);
          if (updatedResolutions) {
            setResolutions(updatedResolutions);
          }

          alert("BOM Resolution deleted successfully");
        } else {
          alert("Failed to delete BOM Resolution");
        }
      } catch (error) {
        console.error("Error in handleDelete:", error);
        alert("Failed to delete BOM Resolution");
      }
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        agenda: null,
        resolution: null,
        compliance: null,
        bom_date: "",
        tenure_id: "",
      });
      setEditingId(null);
    }
  }, [isModalOpen]);

  // Fetch BOM resolutions with error handling
  useEffect(() => {
    const fetchBOMResolutions = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getBOMResolutions(token);
        console.log("BOM Resolutions data:", data);
        if (Array.isArray(data)) {
          setResolutions(data);
        } else {
          console.error("BOM Resolutions data is not an array:", data);
          setResolutions([]);
        }
      } catch (error) {
        console.error("Error fetching BOM Resolutions:", error);
        setResolutions([]);
      }
    };
    fetchBOMResolutions();
  }, [token]);

  // Fetch management tenures for dropdown
  useEffect(() => {
    const fetchManagementTenures = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getAllManagementTenures(token);
        console.log("Management Tenures data:", data);
        if (data && data.tenures && Array.isArray(data.tenures)) {
          setManagementTenures(data.tenures);
        } else if (Array.isArray(data)) {
          setManagementTenures(data);
        } else {
          console.error(
            "Management Tenures data is not in expected format:",
            data
          );
          setManagementTenures([]);
        }
      } catch (error) {
        console.error("Error fetching Management Tenures:", error);
        setManagementTenures([]);
      }
    };
    fetchManagementTenures();
  }, [token]);

  // Filter resolutions based on search term, date, and tenure
  const filteredResolutions = resolutions.filter((resolution) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      (resolution.agenda &&
        resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (resolution.resolution &&
        resolution.resolution
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      resolution.bom_date.includes(searchTerm);

    // Date filter
    const matchesDate = !selectedDate || resolution.bom_date === selectedDate;

    // Tenure filter
    const matchesTenure =
      !selectedTenure ||
      (resolution.tenure_id && String(resolution.tenure_id) === selectedTenure);

    return matchesSearch && matchesDate && matchesTenure;
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Board of Management Resolutions
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and track all Board of Management resolutions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-3">
          <div className="p-6 bg-white border-l-4 border-indigo-500 shadow-md rounded-xl">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-indigo-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total BOM Resolutions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {resolutions.length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white border-l-4 border-green-500 shadow-md rounded-xl">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-green-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-green-600"
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
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  With Compliance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {resolutions.filter((r) => r.compliance).length}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white border-l-4 border-yellow-500 shadow-md rounded-xl">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-yellow-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent BOM Resolutions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    resolutions.filter((r) => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return new Date(r.bom_date) >= thirtyDaysAgo;
                    }).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search BOM resolutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-end w-full gap-4 sm:w-auto">
            {/* Date Filter */}
            <div className="relative w-full sm:w-48">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Select date"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute w-5 h-5 text-gray-400 left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Tenure Filter Dropdown */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedTenure}
                onChange={(e) => setSelectedTenure(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Tenures</option>
                {managementTenures.map((tenure) => (
                  <option key={tenure.id} value={String(tenure.id)}>
                    {tenure.tenure}
                  </option>
                ))}
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Add New Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-full px-6 py-3 font-medium text-white transition-all duration-300 transform rounded-lg shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 hover:scale-105 sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add New BOM Resolution
            </button>
          </div>
        </div>

        {/* Resolutions Table */}
        <div className="mb-10">
          {filteredResolutions.length === 0 ? (
            <div className="p-12 bg-white shadow-lg rounded-xl">
              <div className="flex flex-col items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 mb-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mb-1 text-lg font-medium text-gray-900">
                  No resolutions found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden bg-white shadow-lg rounded-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        S.NO
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Agenda
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Resolution
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Compliance
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        BOM Date
                      </th>
                      <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResolutions.map((resolution, index) => (
                      <tr key={resolution.id}>
                        <td className="w-4 px-6 py-4 text-sm font-medium text-center text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-120">
                          {resolution.agenda_file ? (
                            <a
                              href={resolution.agenda_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 underline hover:text-indigo-800"
                            >
                              View Agenda File
                            </a>
                          ) : (
                            <HtmlContent
                              content={resolution.agenda}
                              maxLength={200}
                            />
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-120">
                          {resolution.resolution_file ? (
                            <a
                              href={resolution.resolution_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 underline hover:text-indigo-800"
                            >
                              View Resolution File
                            </a>
                          ) : (
                            <HtmlContent
                              content={resolution.resolution}
                              maxLength={250}
                            />
                          )}
                        </td>

                        <td className="w-12 px-6 py-4 text-sm text-justify text-gray-500 break-words">
                          {resolution.compliance_file ? (
                            <a
                              href={resolution.compliance_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 underline hover:text-indigo-800"
                            >
                              View Compliance File
                            </a>
                          ) : (
                            <HtmlContent
                              content={resolution.compliance}
                              maxLength={200}
                            />
                          )}
                        </td>

                        <td className="w-6 px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                          {formatDate(resolution.bom_date)}
                        </td>

                        <td className="w-6 px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(resolution)}
                            className="mr-3 text-indigo-600 hover:text-indigo-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(resolution.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Resolution Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                aria-hidden="true"
                onClick={() => setIsModalOpen(false)}
              ></div>
              {/* Modal container */}
              <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-medium leading-6 text-white"
                      id="modal-title"
                    >
                      {editingId ? "Edit Resolution" : "Add New BOM Resolution"}
                    </h3>
                    <button
                      type="button"
                      className="text-white hover:text-gray-200 focus:outline-none"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <svg
                        className="w-6 h-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-6 py-5 bg-white">
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="bom_date"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          BOM Date
                        </label>
                        <input
                          type="date"
                          id="bom_date"
                          name="bom_date"
                          value={formData.bom_date}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="tenure_id"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Management Tenure
                        </label>
                        <select
                          id="tenure_id"
                          name="tenure_id"
                          value={formData.tenure_id}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Management Tenure</option>
                          {managementTenures.length > 0 ? (
                            managementTenures.map((tenure) => (
                              <option key={tenure.id} value={tenure.id}>
                                {tenure.tenure}
                              </option>
                            ))
                          ) : (
                            <option disabled>
                              Loading Management Tenures...
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* File Upload Fields */}
                    <div className="mb-4">
                      <label
                        htmlFor="agenda"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Agenda File *
                      </label>
                      <input
                        type="file"
                        id="agenda"
                        name="agenda"
                        onChange={(e) => handleFileUpload(e, "agenda")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        accept=".pdf,.doc,.docx,.txt"
                        required={!editingId}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: PDF (Max size: 50MB)
                      </p>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="resolution"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Resolution File *
                      </label>
                      <input
                        type="file"
                        id="resolution"
                        name="resolution"
                        onChange={(e) => handleFileUpload(e, "resolution")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        accept=".pdf,.doc,.docx,.txt"
                        required={!editingId}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: PDF (Max size: 50MB)
                      </p>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="compliance"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Compliance File (Optional)
                      </label>
                      <input
                        type="file"
                        id="compliance"
                        name="compliance"
                        onChange={(e) => handleFileUpload(e, "compliance")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: PDF (Max size: 50MB)
                      </p>
                    </div>

                    <div className="flex justify-end pt-6 mt-6 space-x-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {editingId ? "Update Resolution" : "Add Resolution"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMResolutionsPage;
