// pages/BOMResolutionsPage.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import FileLink from "../../components/FileLink";
import { getGCResolutions } from "../../api/gcResolutions";
import {
  getBOMResolutions,
  createBOMResolution,
  deleteBOMResolution,
  updateBOMResolution, // <-- Import the update API
} from "../../api/bomResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";

const BOMResolutionsPage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    bom_date: "",
    gc_resolution_id: "",
    agenda_section: "",
    tenure_id: "",
    agendaFile: null,
    meetingNotesFile: null,
    resolutionFile: null,
    complianceFile: null,
  });
  // State for file selections
  const [selectedFiles, setSelectedFiles] = useState({
    agenda: null,
    meetingNotes: null,
    resolution: null,
    compliance: null,
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
  // State for GC resolutions (for dropdown)
  const [gcResolutions, setGcResolutions] = useState([]);
  const [selectedGCResolution, setSelectedGCResolution] = useState(null);
  const [isGCModalOpen, setIsGCModalOpen] = useState(false);
  // State for management tenures (for dropdown)
  const [managementTenures, setManagementTenures] = useState([]);
  // State for accordion sections - only one section can be open at a time
  const [openSections, setOpenSections] = useState({
    "MAIN AGENDA": false,
    "PURCHASE EXPENSES": false,
    "STAFF MATTERS": false,
    "OTHER MATTERS": false,
  });
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

  // Handle rich text editor changes
  const handleRichTextChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file selection
  const handleFileChange = (fileType) => (e) => {
    const file = e.target.files[0];
    setSelectedFiles((prev) => ({ ...prev, [fileType]: file }));

    // Update formData with file based on type
    const fileKey = `${fileType}File`;
    setFormData((prev) => ({ ...prev, [fileKey]: file }));
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
        bom_date: "",
        gc_resolution_id: "",
        agenda_section: "",
        tenure_id: "",
        agendaFile: null,
        meetingNotesFile: null,
        resolutionFile: null,
        complianceFile: null,
      });
      setSelectedFiles({
        agenda: null,
        meetingNotes: null,
        resolution: null,
        compliance: null,
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
      bom_date: resolution.bom_date || "",
      gc_resolution_id: resolution.gc_resolution_id || "",
      agenda_section: resolution.agenda_section || "",
      tenure_id: resolution.tenure_id || "",
      agendaFile: null,
      meetingNotesFile: null,
      resolutionFile: null,
      complianceFile: null,
    });
    setSelectedFiles({
      agenda: null,
      meetingNotes: null,
      resolution: null,
      compliance: null,
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
        bom_date: "",
        gc_resolution_id: "",
        agenda_section: "",
        tenure_id: "",
        agendaFile: null,
        meetingNotesFile: null,
        resolutionFile: null,
        complianceFile: null,
      });
      setSelectedFiles({
        agenda: null,
        meetingNotes: null,
        resolution: null,
        compliance: null,
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

  // Fetch management tenures for dropdown
  useEffect(() => {
    const fetchManagementTenures = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getAllManagementTenures(token);
        console.log("Management Tenures data:", data); // Debug log
        // Check if data has a tenures property that is an array
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
  }, [token]); // Added token as dependency

  // Filter resolutions based on search term, date, and tenure
  const filteredResolutions = resolutions.filter((resolution) => {
    // First check if gc_resolution exists directly on the resolution object
    const gcResolution =
      resolution.gc_resolution ||
      gcResolutions.find((gc) => gc.id === resolution.gc_resolution_id);

    // Search term filter
    const matchesSearch =
      !searchTerm ||
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (resolution.meeting_notes &&
        resolution.meeting_notes
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      resolution.bom_date.includes(searchTerm) ||
      resolution.gc_resolution_id.toString().includes(searchTerm) ||
      (resolution.agenda_section &&
        resolution.agenda_section
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (gcResolution &&
        gcResolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filter
    const matchesDate = !selectedDate || resolution.bom_date === selectedDate;

    // Tenure filter
    const matchesTenure =
      !selectedTenure ||
      (resolution.tenure_id && String(resolution.tenure_id) === selectedTenure);

    return matchesSearch && matchesDate && matchesTenure;
  });

  // Group resolutions by agenda section
  const groupedResolutions = filteredResolutions.reduce((acc, resolution) => {
    const section = resolution.agenda_section || "OTHER MATTERS";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(resolution);
    return acc;
  }, {});

  // Handle accordion toggle
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [section]: !prev[section],
    }));
  };

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

        {/* Filter Section */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search BOM resolutions by agenda, resolution, compliance, meeting notes..."
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

        {/* Resolutions Accordion */}
        <div className="mb-10 space-y-6">
          {Object.keys(groupedResolutions).length === 0 ? (
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
            Object.entries(groupedResolutions).map(
              ([section, sectionResolutions]) => (
                <div
                  key={section}
                  className="overflow-hidden bg-white shadow-lg rounded-xl"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleSection(section)}
                    className="flex items-center justify-between w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div className="flex items-center">
                      <h3 className="text-xl font-bold text-gray-900">
                        {section}
                      </h3>
                      <span className="px-3 py-1 ml-3 text-sm text-indigo-800 bg-indigo-100 rounded-full">
                        {sectionResolutions.length}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        openSections[section] ? "rotate-180" : ""
                      }`}
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
                  </button>

                  {/* Accordion Content */}
                  {openSections[section] && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              S.NO
                            </th>
                            <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              BOM No
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
                              Meeting Notes
                            </th>
                            <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              GC Resolution
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
                          {sectionResolutions.map((resolution, index) => (
                            <tr key={resolution.id}>
                              <td className="w-4 px-6 py-4 text-sm font-medium text-center text-gray-900">
                                {index + 1}
                              </td>

                              <td className="w-6 px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                                {resolution.bom_no}
                              </td>

                              <td className="w-24 px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                                {resolution.agenda_section || "N/A"}
                              </td>

                              <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-120">
                                {resolution.agenda ? (
                                  <a
                                    href={`https://resolutions.klsbelagavi.org/api/${resolution.agenda}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 underline"
                                  >
                                    View Agenda
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No File</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-120">
                                {resolution.resolution ? (
                                  <a
                                    href={`https://resolutions.klsbelagavi.org/api/${resolution.resolution}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 underline"
                                  >
                                    View Resolution
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No File</span>
                                )}
                              </td>

                              <td className="w-12 px-6 py-4 text-sm text-justify text-gray-500 break-words">
                                {resolution.compliance ? (
                                  <a
                                    href={`https://resolutions.klsbelagavi.org/api/${resolution.compliance}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 underline"
                                  >
                                    View Compliance
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No File</span>
                                )}
                              </td>

                              <td className="w-12 px-6 py-4 text-sm text-justify text-gray-500 break-words">
                                {resolution.meeting_notes ? (
                                  <a
                                    href={`https://resolutions.klsbelagavi.org/api/${resolution.meeting_notes}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 underline"
                                  >
                                    View Meeting Notes
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No File</span>
                                )}
                              </td>

                              <td className="w-24 px-6 py-4 text-sm text-justify text-gray-500 break-words">
                                {resolution.gc_resolution ? (
                                  <button
                                    type="button"
                                    className="text-indigo-600 underline hover:text-indigo-900"
                                    onClick={() =>
                                      handleGCResolutionClick(
                                        resolution.gc_resolution
                                      )
                                    }
                                    title={resolution.gc_resolution.agenda}
                                  >
                                    {resolution.gc_resolution.agenda} - Dated{" "}
                                    {formatDate(
                                      resolution.gc_resolution.gc_date
                                    )}
                                  </button>
                                ) : (
                                  "Unknown"
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
                  )}
                </div>
              )
            )
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
                          htmlFor="agenda_section"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Agenda Section
                        </label>
                        <select
                          id="agenda_section"
                          name="agenda_section"
                          value={formData.agenda_section}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Agenda Section</option>
                          <option value="MAIN AGENDA">MAIN AGENDA</option>
                          <option value="PURCHASE EXPENSES">
                            PURCHASE EXPENSES
                          </option>
                          <option value="STAFF MATTERS">STAFF MATTERS</option>
                          <option value="OTHER MATTERS">OTHER MATTERS</option>
                        </select>
                      </div>
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
                                  {gcResolution.agenda} - Dated{" "}
                                  {formatDate(gcResolution.gc_date)}
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
                    {/* Agenda File Upload */}
                    <div className="mb-4">
                      <label
                        htmlFor="agenda"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Agenda
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="agendaFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-4 text-gray-500"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 16"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              agenda file
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="agendaFile"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange("agenda")}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                          />
                        </label>
                      </div>
                      {selectedFiles.agenda && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Selected file: {selectedFiles.agenda.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Meeting Notes File Upload */}
                    <div className="mb-4">
                      <label
                        htmlFor="meeting_notes"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Meeting Notes (Optional)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="meetingNotesFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-4 text-gray-500"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 16"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              meeting notes file
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="meetingNotesFile"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange("meetingNotes")}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                          />
                        </label>
                      </div>
                      {selectedFiles.meetingNotes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Selected file: {selectedFiles.meetingNotes.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Resolution File Upload */}
                    <div className="mb-4">
                      <label
                        htmlFor="resolution"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Resolution
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="resolutionFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-4 text-gray-500"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 16"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              resolution file
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="resolutionFile"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange("resolution")}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                          />
                        </label>
                      </div>
                      {selectedFiles.resolution && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Selected file: {selectedFiles.resolution.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Compliance File Upload */}
                    <div className="mb-4">
                      <label
                        htmlFor="compliance"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Compliance (Optional)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="complianceFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-4 text-gray-500"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 16"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              compliance file
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="complianceFile"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange("compliance")}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                          />
                        </label>
                      </div>
                      {selectedFiles.compliance && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            Selected file: {selectedFiles.compliance.name}
                          </p>
                        </div>
                      )}
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
                    <div className="block mb-4 text-sm font-medium text-gray-700">
                      <strong>ID:</strong> {selectedGCResolution.id}
                    </div>
                    <div className="block mb-4 text-sm font-medium text-gray-700">
                      <strong>Agenda:</strong>
                      <div className="mt-2 text-gray-600">
                        <FileLink
                          filename={selectedGCResolution.agenda}
                          label="Download Agenda"
                        />
                      </div>
                    </div>
                    <div className="block mb-4 text-sm font-medium text-gray-700">
                      <strong>Resolution:</strong>
                      <div className="mt-2 text-gray-600">
                        <FileLink
                          filename={selectedGCResolution.resolution}
                          label="Download Resolution"
                        />
                      </div>
                    </div>
                    <div className="block mb-4 text-sm font-medium text-gray-700">
                      <strong>Compliance:</strong>
                      <div className="mt-2 text-gray-600">
                        <FileLink
                          filename={selectedGCResolution.compliance}
                          label="Download Compliance"
                        />
                      </div>
                    </div>
                    <div className="block mb-2 text-sm font-medium text-gray-700">
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedGCResolution.gc_date)}
                    </div>
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
