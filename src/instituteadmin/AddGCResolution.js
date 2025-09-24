import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";
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
    agenda_section: "",
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
  // State for date filter
  const [selectedDate, setSelectedDate] = useState("");
  // State for accordion sections - only one section can be open at a time
  const [openSections, setOpenSections] = useState({
    "MAIN AGENDA": false,
    "PURCHASE EXPENSES": false,
    "STAFF MATTERS": false,
    "OTHER MATTERS": false,
  });
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
        agenda_section: "",
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
      agenda_section: resolution.agenda_section || "",
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
      agenda_section: "",
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

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate("");
  };

  // Toggle accordion section - only one section can be open at a time
  const toggleSection = (section) => {
    setOpenSections((prev) => {
      const newSections = {};
      // Close all sections first
      Object.keys(prev).forEach((key) => {
        newSections[key] = false;
      });
      // Open the clicked section only if it was previously closed
      newSections[section] = !prev[section];
      return newSections;
    });
  };

  // Get latest date from resolutions
  const getLatestDate = () => {
    if (resolutions.length === 0) return "";
    const dates = resolutions.map((r) => r.gc_date).sort();
    return dates[dates.length - 1];
  };

  // Set latest date as default when resolutions are loaded
  useEffect(() => {
    if (resolutions.length > 0 && !selectedDate) {
      const latestDate = getLatestDate();
      setSelectedDate(latestDate);

      // Open first section with data by default
      const sectionsWithData = sectionOrder.filter((section) =>
        resolutions.some(
          (r) => r.agenda_section === section && r.gc_date === latestDate
        )
      );

      if (sectionsWithData.length > 0) {
        setOpenSections((prev) => {
          const newSections = {};
          // Close all sections first
          Object.keys(prev).forEach((key) => {
            newSections[key] = false;
          });
          // Open only the first section with data
          newSections[sectionsWithData[0]] = true;
          return newSections;
        });
      }
    }
  }, [resolutions]);

  // Filter resolutions based on search term and selected date
  const filteredResolutions = resolutions.filter((resolution) => {
    // Apply date filter if a date is selected
    if (selectedDate && resolution.gc_date !== selectedDate) {
      return false;
    }

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

  // Define section order
  const sectionOrder = [
    "MAIN AGENDA",
    "PURCHASE EXPENSES",
    "STAFF MATTERS",
    "OTHER MATTERS",
  ];

  // Group resolutions by agenda section in the defined order
  const groupedResolutions = sectionOrder.reduce((acc, section) => {
    const sectionResolutions = filteredResolutions.filter(
      (resolution) => resolution.agenda_section === section
    );
    if (sectionResolutions.length > 0) {
      acc[section] = sectionResolutions;
    }
    return acc;
  }, {});

  // Add uncategorized resolutions if any
  const uncategorizedResolutions = filteredResolutions.filter(
    (resolution) =>
      !resolution.agenda_section ||
      !sectionOrder.includes(resolution.agenda_section)
  );
  if (uncategorizedResolutions.length > 0) {
    groupedResolutions["Uncategorized"] = uncategorizedResolutions;
  }

  // Pagination logic (removed for accordion view)
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = filteredResolutions.slice(
  //   indexOfFirstItem,
  //   indexOfLastItem
  // );
  // const totalPages = Math.ceil(filteredResolutions.length / itemsPerPage);

  // Handle page change
  // const paginate = (pageNumber) => setCurrentPage(pageNumber);
  // const nextPage = () =>
  //   setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  // const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Reset to first page when search term or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

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
    <>
      <Header />
      <DashboardLayout>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          {/* Enhanced Breadcrumb Navigation */}
          <div className="w-full px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mx-auto max-w-7xl">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={goToDashboard}
                  className="flex items-center px-3 py-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
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
                  Dashboard
                </button>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium text-indigo-600">
                  GC Resolutions
                </span>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full bg-gray-50">
            <div className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {/* Enhanced Header Section */}
              <div className="mb-10">
                <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                      <svg
                        className="w-8 h-8 text-white"
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
                    <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text">
                      Governing Council Resolutions
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg leading-relaxed text-gray-600">
                      Comprehensive management system for tracking, organizing,
                      and maintaining all Governing Council resolutions with
                      detailed compliance monitoring
                    </p>
                  </div>
                </div>
              </div>
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
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
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Total Resolutions
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {resolutions.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
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
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        With Compliance
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {
                          resolutions.filter(
                            (r) => r.compliance && r.compliance.trim() !== ""
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Total Sections
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {Object.keys(groupedResolutions).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Enhanced Action Bar */}
              <div className="p-6 mb-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
                  {/* Search and Filter Section */}
                  <div className="flex flex-col items-start w-full gap-4 sm:flex-row lg:w-auto">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="Search by agenda, resolution, compliance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-12 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute w-5 h-5 text-gray-400 left-4 top-4"
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

                    {/* Date Filter */}
                    <div className="flex items-center w-full gap-2 sm:w-auto">
                      <div className="relative w-full sm:w-48">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={handleDateFilterChange}
                          className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute w-5 h-5 text-gray-400 left-3 top-4"
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
                      {selectedDate && (
                        <button
                          onClick={clearDateFilter}
                          className="p-3 text-gray-500 transition-colors duration-200 bg-gray-100 rounded-lg hover:text-gray-700 hover:bg-gray-200"
                          title="Clear date filter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
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
                      )}
                    </div>

                    {/* Latest Date Info */}
                    {selectedDate === getLatestDate() &&
                      resolutions.length > 0 && (
                        <div className="flex items-center px-3 py-2 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Latest GC as on ({formatDate(selectedDate)})
                        </div>
                      )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col w-full gap-3 sm:flex-row lg:w-auto">
                    <button
                      onClick={openAddModal}
                      className="flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-300 transform shadow-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mr-3"
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
                </div>
              </div>
              {/* Enhanced Resolutions Table */}
              <div className="mb-10 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
                {resolutionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading resolutions...</p>
                  </div>
                ) : resolutionsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
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
                ) : Object.keys(groupedResolutions).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
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
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      No resolutions found
                    </h3>
                    <p className="max-w-md mb-6 text-center text-gray-600">
                      {searchTerm || selectedDate
                        ? `No resolutions match your search criteria. Try adjusting your search terms or date filter.`
                        : "Start by adding your first GC resolution to begin tracking and managing council decisions."}
                    </p>
                    {!searchTerm && !selectedDate && (
                      <button
                        onClick={openAddModal}
                        className="flex items-center px-6 py-3 text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add First Resolution
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedResolutions).map(
                      ([section, sectionResolutions]) => (
                        <div
                          key={section}
                          className="border border-gray-200 rounded-lg bg-white shadow-sm"
                        >
                          {/* Accordion Header */}
                          <button
                            onClick={() => toggleSection(section)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <h2 className="text-xl font-bold text-gray-900">
                                {section}
                              </h2>
                              <span className="px-3 py-1 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full">
                                {sectionResolutions.length}{" "}
                                {sectionResolutions.length === 1
                                  ? "Resolution"
                                  : "Resolutions"}
                              </span>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                                openSections[section] ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Accordion Content */}
                          {openSections[section] && (
                            <div className="border-t border-gray-200">
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        S.NO
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        GC-NO
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        Agenda
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        Resolution
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        Compliance
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        Details
                                      </th>
                                      <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                      >
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {sectionResolutions.map(
                                      (resolution, index) => (
                                        <tr key={resolution.id}>
                                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                            {index + 1}
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
                                                {getInstituteName(
                                                  resolution.institute_id
                                                )}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                Dated -{" "}
                                                {formatDate(resolution.gc_date)}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-500 break-words">
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() =>
                                                  openEditModal(resolution)
                                                }
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
                                                onClick={() =>
                                                  handleDelete(resolution.id)
                                                }
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
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {Object.keys(groupedResolutions).length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Total:{" "}
                      <span className="font-medium text-gray-900">
                        {filteredResolutions.length}
                      </span>{" "}
                      resolutions
                      {selectedDate && (
                        <span> for {formatDate(selectedDate)}</span>
                      )}
                    </span>
                    <span>
                      Sections:{" "}
                      <span className="font-medium text-gray-900">
                        {Object.keys(groupedResolutions).length}
                      </span>
                    </span>
                  </div>
                </div>
              )}
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
                    <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                      <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 mr-4 bg-white rounded-full bg-opacity-20">
                              <svg
                                className="w-6 h-6 text-white"
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
                              <h3
                                className="text-xl font-bold leading-6 text-white"
                                id="modal-title"
                              >
                                {editingId
                                  ? "Edit Resolution"
                                  : "Add New Resolution"}
                              </h3>
                              <p className="mt-1 text-sm text-indigo-100">
                                {editingId
                                  ? "Update the resolution details below"
                                  : "Fill in the details to create a new GC resolution"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="p-2 text-white transition-all duration-200 rounded-full hover:text-gray-200 focus:outline-none hover:bg-white hover:bg-opacity-20"
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
                      <div className="px-8 py-6 bg-white">
                        {formError && (
                          <div className="flex items-start p-4 mb-6 text-red-800 border border-red-200 bg-red-50 rounded-xl">
                            <svg
                              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
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
                            <div>
                              <h4 className="font-medium">Error occurred</h4>
                              <p className="mt-1 text-sm">{formError}</p>
                            </div>
                          </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <label
                                htmlFor="agenda_section"
                                className="block mb-3 text-sm font-semibold text-gray-700"
                              >
                                Agenda Section *
                              </label>
                              <select
                                id="agenda_section"
                                name="agenda_section"
                                value={formData.agenda_section}
                                onChange={handleInputChange}
                                className="block w-full py-3 pl-4 pr-10 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              >
                                <option value="">Select agenda section</option>
                                <option value="MAIN AGENDA">MAIN AGENDA</option>
                                <option value="PURCHASE EXPENSES">
                                  PURCHASE EXPENSES
                                </option>
                                <option value="STAFF MATTERS">
                                  STAFF MATTERS
                                </option>
                                <option value="OTHER MATTERS">
                                  OTHER MATTERS
                                </option>
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="gc_date"
                                className="block mb-3 text-sm font-semibold text-gray-700"
                              >
                                GC Date *
                              </label>
                              <input
                                type="date"
                                id="gc_date"
                                name="gc_date"
                                value={formData.gc_date}
                                onChange={handleInputChange}
                                className="block w-full py-3 pl-4 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="agenda"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Agenda *
                            </label>
                            <textarea
                              id="agenda"
                              name="agenda"
                              value={formData.agenda}
                              onChange={handleInputChange}
                              rows={4}
                              className="block w-full py-3 pl-4 pr-4 transition-all duration-200 border border-gray-300 shadow-sm resize-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter detailed agenda information..."
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Provide comprehensive agenda details for the
                              resolution
                            </p>
                          </div>
                          <div>
                            <label
                              htmlFor="resolution"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Resolution *
                            </label>
                            <textarea
                              id="resolution"
                              name="resolution"
                              value={formData.resolution}
                              onChange={handleInputChange}
                              rows={5}
                              className="block w-full py-3 pl-4 pr-4 transition-all duration-200 border border-gray-300 shadow-sm resize-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter the complete resolution text and decisions made..."
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Document the complete resolution with all
                              decisions and actions
                            </p>
                          </div>
                          <div>
                            <label
                              htmlFor="compliance"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Compliance Status
                              <span className="ml-1 font-normal text-gray-400">
                                (Optional)
                              </span>
                            </label>
                            <textarea
                              id="compliance"
                              name="compliance"
                              value={formData.compliance}
                              onChange={handleInputChange}
                              rows={4}
                              className="block w-full py-3 pl-4 pr-4 transition-all duration-200 border border-gray-300 shadow-sm resize-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter compliance status, implementation details, or follow-up actions taken..."
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Document any compliance actions taken or
                              implementation status
                            </p>
                          </div>

                          <div className="flex flex-col justify-end pt-6 space-y-3 border-t border-gray-200 sm:flex-row sm:space-y-0 sm:space-x-4">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-sm rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-white transition-all duration-200 border border-transparent shadow-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-3 animate-spin"
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
                                  {editingId ? "Updating..." : "Saving..."}
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  {editingId
                                    ? "Update Resolution"
                                    : "Create Resolution"}
                                </span>
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
      </DashboardLayout>
    </>
  );
};

export default AddGCResolution;
