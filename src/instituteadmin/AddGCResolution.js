import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getGCResolutions,
  createGCResolution,
  updateGCResolution,
  deleteGCResolution,
} from "../api/gcResolutions";
import { getInstitutes } from "../api/institutes";

const AddGCResolution = () => {
  const goToDashboard = () => {
    navigate("/instituteadmin/dashboard");
  };
  const navigate = useNavigate();
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for dropdown data (will be populated from backend)
  const [institutes, setInstitutes] = useState([]);
  // State for loading
  const [loading, setLoading] = useState(true);
  // State for errors
  const [error, setError] = useState(null);
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for loading resolutions
  const [resolutionsLoading, setResolutionsLoading] = useState(true);
  const [resolutionsError, setResolutionsError] = useState(null);
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for form data
  const [formData, setFormData] = useState({
    agenda: "",
    resolution: "",
    compliance: "",
    gc_date: "",
    institute_id: "",
  });
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Get token from Redux store
  const token = useSelector((state) => state.auth.token);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Fetch institutes and resolutions when component mounts
  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        setLoading(true);
        const data = await getInstitutes(token);
        setInstitutes(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching institutes:", err);
        setError("Failed to load institutes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    const fetchResolutions = async () => {
      try {
        setResolutionsLoading(true);
        const response = await getGCResolutions(token);
        if (response && response.resolutions) {
          setResolutions(response.resolutions);
        } else {
          setResolutions([]);
        }
        setResolutionsError(null);
      } catch (err) {
        console.error("Error fetching resolutions:", err);
        setResolutionsError(
          "Failed to load resolutions. Please try again later."
        );
        setResolutions([]);
      } finally {
        setResolutionsLoading(false);
      }
    };
    if (token) {
      fetchInstitutes();
      fetchResolutions();
    }
  }, [token]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        // Update existing resolution
        await updateGCResolution(editingId, formData, token);
        console.log("Resolution updated successfully");
      } else {
        // Add new resolution
        await createGCResolution(formData, token);
        //console.log("Resolution added successfully");
      }
      // Reset form and close modal
      setFormData({
        agenda: "",
        resolution: "",
        compliance: "",
        gc_date: "",
        institute_id: "",
      });
      setIsModalOpen(false);
      setEditingId(null);
      // Refresh resolutions list
      const response = await getGCResolutions(token);
      if (response && response.resolutions) {
        setResolutions(response.resolutions);
      }
    } catch (err) {
      console.error("Error saving resolution:", err);
      setFormError("Failed to save resolution. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to open modal for editing
  const openEditModal = (resolution) => {
    setFormData({
      agenda: resolution.agenda,
      resolution: resolution.resolution,
      compliance: resolution.compliance || "",
      gc_date: resolution.gc_date,
      institute_id: resolution.institute_id,
    });
    setEditingId(resolution.id);
    setIsModalOpen(true);
  };

  // Function to reset form when opening modal for new resolution
  const openAddModal = () => {
    setFormData({
      agenda: "",
      resolution: "",
      compliance: "",
      gc_date: "",
      institute_id: "",
    });
    setEditingId(null);
    setIsModalOpen(true);
    setFormError(null);
  };

  // Function to handle delete
  const handleDelete = async (id) => {
    // Show confirmation alert
    if (
      window.confirm(
        "Are you sure you want to delete this resolution? This action cannot be undone."
      )
    ) {
      try {
        // Call delete API
        await deleteGCResolution(id, token);
        console.log("Resolution deleted successfully");
        // Refresh resolutions list
        const response = await getGCResolutions(token);
        if (response && response.resolutions) {
          setResolutions(response.resolutions);
        }
      } catch (err) {
        console.error("Error deleting resolution:", err);
        setFormError("Failed to delete resolution. Please try again.");
      }
    }
  };

  // Filter resolutions based on search term
  const filteredResolutions = resolutions.filter((resolution) => {
    const institute = institutes.find((i) => i.id === resolution.institute_id);
    return (
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      institute?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.gc_date.includes(searchTerm)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredResolutions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredResolutions.length / itemsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find((i) => i.id === instituteId);
    return institute ? institute.name : "Unknown";
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
      {/* Header with Logout */}
      <nav className="bg-white shadow-lg py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={process.env.PUBLIC_URL + "/image.png"}
            alt="KLS Logo"
            className="w-16 h-16 rounded-full shadow-lg"
          />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide">
            Karnataka Law Society
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 focus:outline-none"
        >
          Logout
        </button>
      </nav>
      <div className="flex justify-start mt-5 mr-3">
        <button
          onClick={goToDashboard}
          className="flex items-center text-gray-600 hover:text-blue-700 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="font-medium text-blue-600">Home</span>
        </button>
      </div>
      <main className="flex-1 w-full flex flex-col items-center justify-start">
        <div className="max-w-6xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
              Governing Council Resolutions
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Manage and track all Governing Council resolutions
            </p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-2">
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
                    Total Resolutions
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
          </div>
          {/* Action Bar */}
          <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search resolutions..."
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
              onClick={openAddModal}
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
              Add New Resolution
            </button>
          </div>
          {/* Resolutions Table */}
          <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      S.NO
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      GC-NO
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Agenda
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Resolution
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Compliance
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resolutionsLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
                          <p className="mt-4 text-gray-600">
                            Loading resolutions...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : resolutionsError ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-16 h-16 mb-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <h3 className="mb-1 text-lg font-medium text-gray-900">
                            Error loading resolutions
                          </h3>
                          <p className="text-gray-600">{resolutionsError}</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
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
                    currentItems.map((resolution, index) => (
                      <tr key={resolution.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                          {resolution.gc_no}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                          {resolution.agenda}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                          {resolution.resolution}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words w-72">
                          {resolution.compliance}
                        </td>
                        <td className="w-16 px-6 py-4 text-sm text-gray-500 break-words">
                          <div className="flex flex-col">
                            <span>
                              {getInstituteName(resolution.institute_id)}
                            </span>
                            <span className="text-xs text-gray-400">
                              Dated - {formatDate(resolution.gc_date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(resolution)}
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {filteredResolutions.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredResolutions.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredResolutions.length}
                    </span>{" "}
                    results
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && page - array[index - 1] > 1 && (
                            <span className="px-2 py-1 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => paginate(page)}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === page
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Next
                  </button>
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
                <div
                  className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                  aria-hidden="true"
                  onClick={() => setIsModalOpen(false)}
                ></div>
                <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-lg font-medium leading-6 text-white"
                        id="modal-title"
                      >
                        {editingId ? "Edit Resolution" : "Add New Resolution"}
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
                    {formError && (
                      <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg">
                        {formError}
                      </div>
                    )}
                    <form onSubmit={handleSubmit}>
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
                      {/* <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2"> */}
                      {/* <div>
                          <label
                            htmlFor="institute_id"
                            className="block mb-2 text-sm font-medium text-gray-700"
                          >
                            Institute
                          </label>
                          {loading ? (
                            <select
                              disabled
                              className="block w-full py-3 pl-4 pr-10 bg-gray-100 border border-gray-300 rounded-lg sm:text-sm"
                            >
                              <option>Loading institutes...</option>
                            </select>
                          ) : error ? (
                            <select
                              disabled
                              className="block w-full py-3 pl-4 pr-10 border border-red-300 rounded-lg bg-red-50 sm:text-sm"
                            >
                              <option>Error loading institutes</option>
                            </select>
                          ) : (
                            <select
                              id="institute_id"
                              name="institute_id"
                              value={formData.institute_id}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="">Select an institute</option>
                              {institutes.map((institute) => (
                                <option key={institute.id} value={institute.id}>
                                  {institute.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div> */}
                      <div className="mb-4">
                        <label
                          htmlFor="gc_date"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          GC Date
                        </label>
                        <input
                          type="date"
                          id="gc_date"
                          name="gc_date"
                          value={formData.gc_date}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
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
                          disabled={isSubmitting}
                          className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Saving...
                            </span>
                          ) : editingId ? (
                            "Update Resolution"
                          ) : (
                            "Add Resolution"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddGCResolution;
