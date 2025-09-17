// pages/BOMResolutionsPage.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getGCResolutions } from "../../api/gcResolutions";
import {
  getBOMResolutions,
  createBOMResolution,
  deleteBOMResolution,
  updateBOMResolution, // <-- Import the update API
} from "../../api/bomResolutions";

const BOMResolutionsPage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    agenda: "",
    resolution: "",
    compliance: "",
    bom_date: "",
    gc_resolution_id: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for GC resolutions (for dropdown)
  const [gcResolutions, setGcResolutions] = useState([]);
  const [selectedGCResolution, setSelectedGCResolution] = useState(null);
  const [isGCModalOpen, setIsGCModalOpen] = useState(false);
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Edit mode: call update API
        await updateBOMResolution(editingId, formData, token);
      } else {
        // Add mode: call create API
        await createBOMResolution(formData, token);
      }
      setIsModalOpen(false);
      setFormData({
        agenda: "",
        resolution: "",
        compliance: "",
        bom_date: "",
        gc_resolution_id: "",
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

  // Handle edit button click (placeholder)
  const handleEdit = (resolution) => {
    setIsModalOpen(true);
    setEditingId(resolution.id);
    setFormData({
      agenda: resolution.agenda || "",
      resolution: resolution.resolution || "",
      compliance: resolution.compliance || "",
      bom_date: resolution.bom_date || "",
      gc_resolution_id: resolution.gc_resolution_id || "",
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
        agenda: "",
        resolution: "",
        compliance: "",
        bom_date: "",
        gc_resolution_id: "",
      });
      setEditingId(null);
    }
  }, [isModalOpen]);

  // Fetch GC resolutions for dropdown with error handling
  useEffect(() => {
    const fetchGCResolutions = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getGCResolutions(token);
        console.log("GC Resolutions data:", data); // Debug log
        // Check if data has a resolutions property that is an array
        if (data && data.resolutions && Array.isArray(data.resolutions)) {
          setGcResolutions(data.resolutions);
        } else {
          console.error("GC Resolutions data is not in expected format:", data);
          setGcResolutions([]);
        }
      } catch (error) {
        console.error("Error fetching GC Resolutions:", error);
        setGcResolutions([]);
      }
    };
    fetchGCResolutions();
  }, [token]); // Added token as dependency

  // Fetch BOM resolutions with error handling
  useEffect(() => {
    const fetchBOMResolutions = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getBOMResolutions(token);
        console.log("BOM Resolutions data:", data); // Debug log
        // Ensure data is an array before setting state
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
  }, [token]); // Added token as dependency

  // Filter resolutions based on search term
  const filteredResolutions = resolutions.filter((resolution) => {
    // First check if gc_resolution exists directly on the resolution object
    const gcResolution =
      resolution.gc_resolution ||
      gcResolutions.find((gc) => gc.id === resolution.gc_resolution_id);
    return (
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      resolution.bom_date.includes(searchTerm) ||
      resolution.gc_resolution_id.toString().includes(searchTerm) ||
      (gcResolution &&
        gcResolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper function to get GC resolution details
  const getGCResolutionDetails = (gcId) => {
    console.log("GC Resolution ID:", gcId);
    const gcResolution = gcResolutions.find((gc) => gc.id === gcId);
    return gcResolution
      ? `ID: ${gcResolution.id} - ${gcResolution.agenda.substring(0, 30)}...`
      : "Unknown";
  };

  const handleGCResolutionClick = (gcResolution) => {
    setSelectedGCResolution(gcResolution);
    setIsGCModalOpen(true);
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

        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
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

        {/* Resolutions Table */}
        <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                    SL.NO
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-36">
                    BOM No
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-72">
                    Agenda
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-72">
                    Resolution
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-36">
                    Compliance
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-72">
                    GC Resolution
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-36">
                    BOM Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-36">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResolutions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
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
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResolutions.map((resolution, index) => (
                    <tr key={resolution.id}>
                      <td className="w-16 px-6 py-4 text-sm font-medium text-center text-gray-900 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900 w-36 whitespace-nowrap">
                        {resolution.bom_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                        <div className="truncate" title={resolution.agenda}>
                          {resolution.agenda}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                        <div className="truncate" title={resolution.resolution}>
                          {resolution.resolution}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                        <div className="truncate" title={resolution.compliance}>
                          {resolution.compliance}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                        {resolution.gc_resolution ? (
                          <button
                            type="button"
                            className="text-indigo-600 underline hover:text-indigo-900"
                            onClick={() =>
                              handleGCResolutionClick(resolution.gc_resolution)
                            }
                            title={resolution.gc_resolution.agenda}
                          >
                            {resolution.gc_resolution.gc_no}-
                            {resolution.gc_resolution.agenda}-Dated{" "}
                            {formatDate(resolution.gc_resolution.gc_date)}
                          </button>
                        ) : (
                          "Unknown"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500 w-36 whitespace-nowrap">
                        {formatDate(resolution.bom_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-center w-36 whitespace-nowrap">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                          htmlFor="gc_resolution_id"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          GC Resolution
                        </label>
                        <select
                          id="gc_resolution_id"
                          name="gc_resolution_id"
                          value={formData.gc_resolution_id}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select a GC Resolution</option>
                          {gcResolutions.length > 0 ? (
                            gcResolutions.map((gcResolution) => {
                              // Check if this GC Resolution is already used in BOM resolutions
                              const isUsed = resolutions.some(
                                (bom) =>
                                  bom.gc_resolution_id === gcResolution.id
                              );
                              return (
                                <option
                                  key={gcResolution.id}
                                  value={gcResolution.id}
                                  disabled={isUsed}
                                >
                                  {gcResolution.gc_no} - {gcResolution.agenda} -
                                  Dated {formatDate(gcResolution.gc_date)}
                                  {isUsed ? " (Already Added)" : ""}
                                </option>
                              );
                            })
                          ) : (
                            <option disabled>Loading GC Resolutions...</option>
                          )}
                        </select>
                      </div>
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
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="agenda"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Agenda
                      </label>
                      <textarea
                        id="agenda"
                        name="agenda"
                        value={formData.agenda}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter agenda details"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="resolution"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Resolution
                      </label>
                      <textarea
                        id="resolution"
                        name="resolution"
                        value={formData.resolution}
                        onChange={handleInputChange}
                        rows={4}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter resolution details"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="compliance"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Compliance (Optional)
                      </label>
                      <textarea
                        id="compliance"
                        name="compliance"
                        value={formData.compliance}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter compliance details"
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
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

        {/* GC Resolution Modal */}
        {isGCModalOpen && selectedGCResolution && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="gc-modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                aria-hidden="true"
                onClick={() => setIsGCModalOpen(false)}
              ></div>
              <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-medium leading-6 text-white"
                      id="gc-modal-title"
                    >
                      GC Resolution Details
                    </h3>
                    <button
                      type="button"
                      className="text-white hover:text-gray-200 focus:outline-none"
                      onClick={() => setIsGCModalOpen(false)}
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
                  <div className="mb-4">
                    <span className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>ID:</strong> {selectedGCResolution.id}
                    </span>
                    <span className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>Agenda:</strong> {selectedGCResolution.agenda}
                    </span>
                    <span className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>Resolution:</strong>{" "}
                      {selectedGCResolution.resolution}
                    </span>
                    <span className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>Compliance:</strong>{" "}
                      {selectedGCResolution.compliance}
                    </span>
                    <span className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedGCResolution.gc_date)}
                    </span>
                  </div>
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
