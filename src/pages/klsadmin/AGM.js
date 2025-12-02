import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  getAGMs,
  createAGM,
  updateAGM,
  deleteAGM,
  getAGMFileUrl,
  searchPDFContent,
} from "../../api/agm";

const AGMPage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    agenda: null,
    notes: null,
    agm_date: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for filters
  const [selectedDate, setSelectedDate] = useState("");
  // State for AGMs (will be populated from backend)
  const [agms, setAGMs] = useState([]);
  // PDF search related state
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // PDF viewing state
  const [activeTab, setActiveTab] = useState(null);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileError, setFileError] = useState("");
  // Get token from Redux store
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

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
    console.log(`File selected for ${fieldName}:`, file);
    console.log(`File type:`, typeof file);
    console.log(`Is File instance:`, file instanceof File);

    setFormData((prev) => ({
      ...prev,
      [fieldName]: file || null,
    }));
  };

  // PDF Search functionality
  const performPdfSearch = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log("Searching PDF content for:", searchText);
      const results = await searchPDFContent(searchText, token);
      console.log("Search results:", results);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Error searching PDF content:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle PDF viewing
  const handlePDFView = async (type, filename) => {
    console.log(
      `handlePDFView called with type: ${type}, filename: ${filename}`
    );

    setFileError("");

    if (filename) {
      try {
        const API_URL = "https://resolutions.klsbelagavi.org/api";
        const response = await fetch(`${API_URL}/agm/file/${filename}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
          setViewingPDF(type);
          setFileError("");
          console.log(`Successfully loaded PDF for ${type}`);
        } else {
          console.error("Failed to fetch PDF:", response.status);
          setViewingPDF(null);
          setPdfUrl("");
          setFileError(
            `Failed to load ${type.replace(
              "-",
              " "
            )} file. The file may not exist or there was an error accessing it.`
          );
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        setViewingPDF(null);
        setPdfUrl("");
        setFileError(
          `Error loading ${type.replace(
            "-",
            " "
          )} file. Please check your connection and try again.`
        );
      }
    } else {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(`No ${type.replace("-", " ")} file available for this AGM.`);
    }
  };

  // Handle tab click
  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    setFileError("");

    // Find current AGM based on selectedDate
    const currentAGM = agms.find((item) => item.agm_date === selectedDate);

    if (!currentAGM) {
      setFileError("No AGM selected.");
      return;
    }

    let filename = null;
    if (tab === "agenda") {
      filename = currentAGM.agenda;
    } else if (tab === "notes") {
      filename = currentAGM.notes;
    }

    if (filename) {
      await handlePDFView(tab, filename);
    } else {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(
        `No ${tab.replace("-", " ")} file available for this meeting.`
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== FRONTEND FORM SUBMISSION DEBUG ===");
    console.log("Form data state:", formData);
    console.log("Agenda file:", formData.agenda);
    console.log("Notes file:", formData.notes);

    try {
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes

      // Validate required fields
      if (!formData.agm_date) {
        alert("AGM date is required");
        return;
      }

      // For new entries, validate required files
      if (!editingId) {
        if (!formData.agenda || !(formData.agenda instanceof File)) {
          console.log("Agenda validation failed:", formData.agenda);
          alert("Agenda file is required");
          return;
        }
      }

      // Validate file sizes before submission
      const filesToCheck = [
        { file: formData.agenda, name: "Agenda" },
        { file: formData.notes, name: "Notes" },
      ];

      for (const fileObj of filesToCheck) {
        if (
          fileObj.file &&
          fileObj.file instanceof File &&
          fileObj.file.size > maxSize
        ) {
          alert(
            `${fileObj.name} file size exceeds 50MB limit. Please select a smaller file.`
          );
          return;
        }
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("agm_date", formData.agm_date);

      // Only append files if they exist and are File instances
      if (formData.agenda && formData.agenda instanceof File) {
        submitData.append("agenda", formData.agenda);
        console.log("Appended agenda file:", formData.agenda.name);
      }
      if (formData.notes && formData.notes instanceof File) {
        submitData.append("notes", formData.notes);
        console.log("Appended notes file:", formData.notes.name);
      }

      // Debug: Log FormData contents
      console.log("=== FORMDATA DEBUG ===");
      console.log("FormData entries:");
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: File - ${value.name} (${value.size} bytes, ${value.type})`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      if (editingId) {
        // Edit mode: call update API
        await updateAGM(editingId, submitData, token);
      } else {
        // Add mode: call create API
        console.log("Calling createAGM API...");
        await createAGM(submitData, token);
      }

      setIsModalOpen(false);
      setFormData({
        agenda: null,
        notes: null,
        agm_date: "",
      });
      setEditingId(null);

      // Refresh the AGMs list after creation/update
      const updatedAGMs = await getAGMs(token);
      if (updatedAGMs) {
        setAGMs(updatedAGMs);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert(
        "Failed to save AGM: " + (error.response?.data?.error || error.message)
      );
    }
  };

  // Handle edit button click
  const handleEdit = (agm) => {
    setIsModalOpen(true);
    setEditingId(agm.id);
    setFormData({
      agenda: null, // Files will need to be re-uploaded
      notes: null,
      agm_date: agm.agm_date || "",
    });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    console.log("Delete button clicked for ID:", id);
    if (window.confirm("Are you sure you want to delete this AGM?")) {
      try {
        if (!token) {
          alert("Authentication token not found. Please log in again.");
          return;
        }

        console.log("Deleting AGM with ID:", id);
        const result = await deleteAGM(id, token);

        if (result) {
          // Refresh the AGMs list after deletion
          const updatedAGMs = await getAGMs(token);
          if (updatedAGMs) {
            setAGMs(updatedAGMs);
          }

          alert("AGM deleted successfully");
        } else {
          alert("Failed to delete AGM");
        }
      } catch (error) {
        console.error("Error in handleDelete:", error);
        alert("Failed to delete AGM");
      }
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        agenda: null,
        notes: null,
        agm_date: "",
      });
      setEditingId(null);
    }
  }, [isModalOpen]);

  // Fetch AGMs with error handling
  useEffect(() => {
    const fetchAGMs = async () => {
      try {
        if (!token) {
          console.error("No authentication token found");
          return;
        }
        const data = await getAGMs(token);
        console.log("AGMs data:", data);
        if (Array.isArray(data)) {
          setAGMs(data);
        } else {
          console.error("AGMs data is not an array:", data);
          setAGMs([]);
        }
      } catch (error) {
        console.error("Error fetching AGMs:", error);
        setAGMs([]);
      }
    };
    fetchAGMs();
  }, [token]);

  // Handle PDF search with debouncing
  useEffect(() => {
    if (pdfSearchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        performPdfSearch(pdfSearchTerm);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [pdfSearchTerm]);

  // Filter AGMs based on search term and date
  const filteredAGMs = agms.filter((agm) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      (agm.agenda &&
        agm.agenda.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (agm.notes &&
        agm.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      agm.agm_date.includes(searchTerm);

    // Date filter
    const matchesDate = !selectedDate || agm.agm_date === selectedDate;

    return matchesSearch && matchesDate;
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Group AGMs by date and add search match information
  const groupedAGMs = filteredAGMs.reduce((acc, agm) => {
    const date = agm.agm_date;
    if (!acc[date]) {
      acc[date] = [];
    }

    // Check if this AGM matches search results
    const matchedResult = searchResults.find((r) => r.agm_id === agm.id);
    const agmWithMatch = {
      ...agm,
      matchedField: matchedResult ? matchedResult.file_type : null,
    };

    acc[date].push(agmWithMatch);
    return acc;
  }, {});

  const uniqueDates = Object.keys(groupedAGMs).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Annual General Meeting Management
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and track all Annual General Meetings
          </p>
        </div>

        {/* PDF Search Section */}
        <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="flex items-center mb-3 text-lg font-semibold text-blue-900">
            <svg
              className="w-5 h-5 mr-2"
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
            Search Across All AGM PDFs
          </h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search across all AGM content (agenda, notes)..."
              className="block w-full py-3 pl-10 pr-12 transition bg-white border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={pdfSearchTerm}
              onChange={(e) => setPdfSearchTerm(e.target.value)}
            />
            {pdfSearchTerm && !isSearching && (
              <button
                onClick={() => setPdfSearchTerm("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            )}
          </div>
          {pdfSearchTerm && (
            <div className="mt-2 text-sm text-blue-700">
              {isSearching ? (
                "Searching across AGM content..."
              ) : (
                <>
                  Found{" "}
                  <span className="font-bold">{searchResults.length}</span>{" "}
                  matching AGM{searchResults.length !== 1 ? "s" : ""}
                  {searchResults.length > 0 &&
                    ` containing "${pdfSearchTerm.substring(0, 50)}${
                      pdfSearchTerm.length > 50 ? "..." : ""
                    }"`}
                </>
              )}
            </div>
          )}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total AGMs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agms.length}
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
                <p className="text-sm font-medium text-gray-600">With Notes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {agms.filter((r) => r.notes).length}
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
                <p className="text-sm font-medium text-gray-600">Recent AGMs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    agms.filter((r) => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return new Date(r.agm_date) >= thirtyDaysAgo;
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
              placeholder="Search AGMs..."
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

            {/* Add New Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-full px-6 py-3 font-medium text-white transition-all duration-300 transform rounded-lg shadow-lg bg-blue-500 hover:bg-blue-700 hover:-translate-y-1 hover:scale-105 sm:w-auto"
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
              Add New AGM
            </button>
          </div>
        </div>

        {/* AGMs Table */}
        <div className="mb-10">
          {filteredAGMs.length === 0 ? (
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mb-1 text-lg font-medium text-gray-900">
                  No AGMs found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueDates.map((date) => {
                const agmsForDate = groupedAGMs[date];
                const isExpanded = selectedDate === date;

                return (
                  <div
                    key={date}
                    className="overflow-hidden bg-white shadow-lg rounded-xl"
                  >
                    {/* Date Header - Clickable */}
                    <div
                      onClick={() => setSelectedDate(isExpanded ? null : date)}
                      className="flex items-center justify-between p-6 transition-colors cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                          <h3 className="text-xl font-bold text-gray-900">
                            {formatDate(date)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {agmsForDate.length} AGM
                            {agmsForDate.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Search Match Indicator */}
                        {pdfSearchTerm.trim() &&
                          agmsForDate.some((r) => r.matchedField) && (
                            <div className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                              CONTAINS MATCH
                            </div>
                          )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(agmsForDate[0]);
                            }}
                            className="px-3 py-1 text-sm text-blue-600 transition-colors hover:text-blue-800"
                            title="Edit AGM"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(agmsForDate[0].id);
                            }}
                            className="px-3 py-1 text-sm text-red-600 transition-colors hover:text-red-800"
                            title="Delete AGM"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Expand/Collapse Icon */}
                        <div className="text-blue-500">
                          <svg
                            className={`w-6 h-6 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Dashboard Buttons */}
                    {isExpanded && (
                      <div className="p-6 border-t bg-gray-50">
                        {/* Close Button */}
                        <div className="flex justify-end mb-4">
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
                            title="Close"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Dashboard-style Big Box Buttons */}
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Agenda Button */}
                            <button
                              onClick={() => handleTabClick("agenda")}
                              className={`relative group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-4 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                activeTab === "agenda" ||
                                viewingPDF === "agenda"
                                  ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                  : ""
                              }`}
                              style={{ minHeight: 120 }}
                            >
                              {pdfSearchTerm.trim() &&
                                agmsForDate.some(
                                  (r) => r.matchedField === "agenda"
                                ) && (
                                  <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                    MATCH
                                  </div>
                                )}
                              <div className="flex flex-col items-center justify-center h-full">
                                <span
                                  className="mb-2 text-3xl animate-bounce-slow"
                                  aria-label="Agenda"
                                >
                                  📋
                                </span>
                                <h2 className="mb-1 font-serif text-lg font-bold text-center text-blue-900 transition-colors group-hover:text-white">
                                  Agenda
                                </h2>
                              </div>
                            </button>

                            {/* Notes Button */}
                            <button
                              onClick={() => handleTabClick("notes")}
                              className={`relative group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-4 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                activeTab === "notes" || viewingPDF === "notes"
                                  ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                  : ""
                              }`}
                              style={{ minHeight: 120 }}
                            >
                              {pdfSearchTerm.trim() &&
                                agmsForDate.some(
                                  (r) => r.matchedField === "notes"
                                ) && (
                                  <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                    MATCH
                                  </div>
                                )}
                              <div className="flex flex-col items-center justify-center h-full">
                                <span
                                  className="mb-2 text-3xl animate-bounce-slow"
                                  aria-label="Notes"
                                >
                                  📝
                                </span>
                                <h2 className="mb-1 font-serif text-lg font-bold text-center text-green-900 transition-colors group-hover:text-white">
                                  Notes
                                </h2>
                              </div>
                            </button>
                          </div>

                          {/* PDF Viewer Section */}
                          {viewingPDF && pdfUrl && (
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Viewing:{" "}
                                  {viewingPDF.charAt(0).toUpperCase() +
                                    viewingPDF.slice(1)}
                                </h3>
                                <button
                                  onClick={() => {
                                    setViewingPDF(null);
                                    setPdfUrl("");
                                    setActiveTab(null);
                                  }}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Close PDF
                                </button>
                              </div>
                              <div className="w-full h-96">
                                <iframe
                                  src={pdfUrl}
                                  title={`${viewingPDF} PDF`}
                                  className="w-full h-full border border-gray-300 rounded"
                                  style={{ minHeight: "400px" }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {fileError && (
                            <div className="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
                              {fileError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit AGM Modal */}
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
                <div className="px-6 py-4 bg-blue-500">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-medium leading-6 text-white"
                      id="modal-title"
                    >
                      {editingId ? "Edit AGM" : "Add New AGM"}
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
                    <div className="mb-4">
                      <label
                        htmlFor="agm_date"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        AGM Date
                      </label>
                      <input
                        type="date"
                        id="agm_date"
                        name="agm_date"
                        value={formData.agm_date}
                        onChange={handleInputChange}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
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
                        accept="application/pdf"
                        required={!editingId}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: PDF
                      </p>
                      {/* Debug info */}
                      {formData.agenda && (
                        <p className="mt-1 text-xs text-blue-500">
                          Selected:{" "}
                          {formData.agenda instanceof File
                            ? formData.agenda.name
                            : "Invalid file object"}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="notes"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Notes File (Optional)
                      </label>
                      <input
                        type="file"
                        id="notes"
                        name="notes"
                        onChange={(e) => handleFileUpload(e, "notes")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        accept="application/pdf"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Accepted formats: PDF
                      </p>
                      {/* Debug info */}
                      {formData.notes && (
                        <p className="mt-1 text-xs text-blue-500">
                          Selected:{" "}
                          {formData.notes instanceof File
                            ? formData.notes.name
                            : "Invalid file object"}
                        </p>
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
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        {editingId ? "Update AGM" : "Add AGM"}
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

export default AGMPage;
