import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getInstitutes } from "../../api/institutes";
import { getGCResolutions, searchPDFContent } from "../../api/gcResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import FileDownloadLink from "../../components/FileDownloadLink";

// Helper function to strip HTML tags from a string
const stripHtmlTags = (str) => {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
};

const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
  );
};

const getCurrentTenure = () => {
  const today = new Date();
  const year = today.getFullYear();
  for (let start = 2021; start <= year; start++) {
    const end = start + 2;
    if (year >= start && year <= end) {
      return `${start}-${end}`;
    }
  }
  return "";
};

const getDocumentType = (item) => {
  // Check which field matched in the search result
  // FIXED: Changed from matched_field to matchedField (camelCase)
  if (item.matchedField) {
    return item.matchedField;
  }

  // Check which field has content or filename
  if (item.agenda_content || item.agenda) return "agenda";
  if (item.resolution_content || item.resolution) return "resolution";
  if (item.compliance_content || item.compliance) return "compliance";
  if (item.meeting_notes_content || item.meeting_notes) return "meeting-notes";

  return null;
};

const hasMatchForDocumentType = (
  dateKey,
  docType,
  searchResults,
  pdfSearchTerm
) => {
  if (!pdfSearchTerm.trim() || !searchResults.length) return false;

  const matchingItems = searchResults.filter(
    (item) => item.gc_date === dateKey
  );
  return matchingItems.some((item) => {
    const matchedType = getDocumentType(item);
    return matchedType === docType;
  });
};

const GCResolutionPage = () => {
  // State for search
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for dropdown data
  const [institutes, setInstitutes] = useState([]);
  const [tenures, setTenures] = useState([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  // State for resolutions
  const [resolutions, setResolutions] = useState([]);

  // State for selected filters
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");

  // State for expanded meeting details
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileError, setFileError] = useState("");

  // State for institute tabs when showing all institutes
  const [activeInstituteTab, setActiveInstituteTab] = useState("");

  // Get token from Redux store
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch resolutions
        const gcData = await getGCResolutions(token);
        const resolutionsData = gcData?.resolutions || gcData || [];
        setResolutions(resolutionsData);

        // Fetch all institutes (not filtered)
        const institutesData = await getInstitutes(token);
        setInstitutes(institutesData);

        // Set default to show all institutes
        setSelectedInstitute("");

        setApiError(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(true);
        setResolutions([]);
        setInstitutes([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTenures = async () => {
      try {
        const data = await getAllManagementTenures(token);
        setTenures(data);

        // Set the current tenure as default
        if (data && data.length > 0) {
          const today = new Date();
          const currentTenure = data.find((tenure) => {
            const startDate = new Date(tenure.start_date);
            const endDate = new Date(tenure.end_date);
            return today >= startDate && today <= endDate;
          });

          if (currentTenure) {
            setSelectedTenure(String(currentTenure.id));
          } else {
            const latestTenure = data.reduce((latest, current) => {
              return new Date(current.start_date) > new Date(latest.start_date)
                ? current
                : latest;
            });
            setSelectedTenure(String(latestTenure.id));
          }
        }
      } catch (err) {
        console.error("Error fetching tenures:", err);
      }
    };

    if (token) {
      fetchData();
      fetchTenures();
    } else {
      setLoading(false);
      setApiError(true);
    }
  }, [token]);

  // PDF Search functionality
  const performPdfSearch = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log("Searching PDF content for:", searchText);
      console.log("Token available:", !!token);

      // FIXED: Pass token to searchPDFContent
      const results = await searchPDFContent(searchText, token);
      console.log("PDF search results:", results);
      setSearchResults(results.results || []);
    } catch (error) {
      console.error("Error performing PDF search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pdfSearchTerm && token) {
        console.log("Starting search with term:", pdfSearchTerm);
        console.log("Token available:", !!token);
        performPdfSearch(pdfSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [pdfSearchTerm, token]); // Ensure token is in dependency array

  // Filter resolutions
  const filteredData = resolutions.filter((item) => {
    const matchesInstitute = selectedInstitute
      ? String(item.institute_id) === String(selectedInstitute)
      : true;

    let matchesTenure = true;
    if (selectedTenure) {
      if (item.tenure_id) {
        matchesTenure = String(item.tenure_id) === String(selectedTenure);
      } else {
        matchesTenure = false;
      }
    }

    return matchesInstitute && matchesTenure;
  });

  // Use search results if searching, otherwise use filtered data
  const dataToGroup = pdfSearchTerm.trim() ? searchResults : filteredData;

  // Get available institutes from filtered data
  const availableInstitutes = [
    ...new Set(dataToGroup.map((item) => item.institute_id)),
  ]
    .map((id) => institutes.find((inst) => inst.id === id))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Group data by institute first, then by date
  const groupDataByInstitute = () => {
    const instituteGroups = {};

    dataToGroup.forEach((item) => {
      const instituteId = item.institute_id;
      if (!instituteGroups[instituteId]) {
        instituteGroups[instituteId] = {};
      }

      const dateKey = item.gc_date || "N/A";
      if (dateKey === "N/A") return;

      const date = new Date(dateKey);
      if (isNaN(date.getTime())) return;

      const monthYearKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!instituteGroups[instituteId][monthYearKey]) {
        instituteGroups[instituteId][monthYearKey] = {};
      }

      if (!instituteGroups[instituteId][monthYearKey][dateKey]) {
        instituteGroups[instituteId][monthYearKey][dateKey] = [];
      }

      instituteGroups[instituteId][monthYearKey][dateKey].push(item);
    });

    return instituteGroups;
  };

  const groupedData = groupDataByInstitute();

  // Handle PDF viewing
  const handlePDFView = async (type, filename) => {
    setFileError("");

    if (filename) {
      try {
        const API_URL = "https://resolutions.klsbelagavi.org/api";
        const response = await fetch(
          `${API_URL}/gc_resolutions/file/${filename}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
          setViewingPDF(type);
          setFileError("");
        } else {
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
      setFileError(
        `No ${type.replace("-", " ")} file available for this meeting.`
      );
    }
  };

  // Handle tab clicks
  const handleTabClick = async (tab, dateKey) => {
    if (!dateKey) {
      setActiveTab(tab);
      return;
    }

    // Find the data for the selected date
    let currentData = null;
    Object.values(groupedData).forEach((instituteData) => {
      Object.values(instituteData).forEach((monthData) => {
        if (monthData[dateKey]) {
          currentData = monthData[dateKey][0];
        }
      });
    });

    if (!currentData) {
      setActiveTab(tab);
      return;
    }

    let filename = null;

    switch (tab) {
      case "agenda":
        filename = currentData?.agenda;
        break;
      case "resolution":
        filename = currentData?.resolution;
        break;
      case "compliance":
        filename = currentData?.compliance;
        break;
      case "meeting-notes":
        filename = currentData?.meeting_notes;
        break;
      default:
        setActiveTab(tab);
        setViewingPDF(null);
        setPdfUrl("");
        return;
    }

    setActiveTab(tab);

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

  // Handle date clicks
  const handleDateClick = (dateKey) => {
    setViewingPDF(null);
    setPdfUrl("");
    setActiveTab(null);
    setFileError("");
    setSelectedDate(dateKey);
  };

  // Helper functions
  const getInstituteName = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.name : "N/A";
  };

  const getInstituteCode = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.code : "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (monthYearKey) => {
    const [year, month] = monthYearKey.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  // Detect iOS for better PDF handling
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Get institutes to display based on selection
  const getInstitutesToDisplay = () => {
    if (selectedInstitute) {
      // Single institute selected
      return [selectedInstitute];
    } else {
      // All institutes - filter by activeInstituteTab if set
      if (activeInstituteTab) {
        return [activeInstituteTab];
      } else {
        return Object.keys(groupedData);
      }
    }
  };

  const institutesToDisplay = getInstitutesToDisplay();

  // Render Institute Section Component
  const renderInstituteSection = (instituteId) => {
    const instituteData = groupedData[instituteId];
    if (!instituteData) return null;

    const sortedMonthYearKeys = Object.keys(instituteData).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    if (sortedMonthYearKeys.length === 0) return null;

    return (
      <div
        key={instituteId}
        className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl"
      >
        {/* Institute Header - Only show when displaying all institutes */}
        {selectedInstitute === "" && (
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700">
            <h2 className="text-xl font-bold text-white">
              {getInstituteCode(parseInt(instituteId))} -{" "}
              {getInstituteName(parseInt(instituteId))}
            </h2>
          </div>
        )}

        {/* Single institute header */}
        {selectedInstitute && (
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700">
            <h2 className="text-xl font-bold text-white">
              Meeting Schedule - {getInstituteName(parseInt(instituteId))}
            </h2>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-left text-gray-900 border-r">
                  Month
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-left text-gray-900">
                  Meeting Dates
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMonthYearKeys.map((monthYearKey) => {
                const datesInMonth = instituteData[monthYearKey];
                const sortedDateKeys = Object.keys(datesInMonth).sort(
                  (a, b) => new Date(a) - new Date(b)
                );

                const hasSelectedDate = sortedDateKeys.includes(selectedDate);

                return (
                  <React.Fragment key={`${instituteId}-${monthYearKey}`}>
                    {/* Month Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r bg-gray-50">
                        {formatMonthYear(monthYearKey)}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex flex-wrap justify-start gap-2">
                          {sortedDateKeys.map((dateKey) => (
                            <button
                              key={dateKey}
                              onClick={() => handleDateClick(dateKey)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedDate === dateKey
                                  ? "bg-indigo-600 text-white shadow-lg"
                                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                              }`}
                            >
                              {formatDate(dateKey)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Content Row */}
                    {hasSelectedDate && selectedDate && (
                      <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                        <td colSpan="2" className="px-0 py-0">
                          <div className="border-l-4 border-indigo-500">
                            {/* Meeting Details Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">
                                  Meeting Details - {formatDate(selectedDate)}
                                </h3>
                                <button
                                  onClick={() => {
                                    setSelectedDate(null);
                                    setFileError("");
                                    setActiveTab(null);
                                    setViewingPDF(null);
                                    setPdfUrl("");
                                  }}
                                  className="text-white transition-colors hover:text-indigo-200"
                                >
                                  <svg
                                    className="w-6 h-6"
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
                            </div>

                            {/* Dashboard-style Buttons */}
                            <div className="p-6 space-y-6">
                              <div className="grid grid-cols-4 gap-4">
                                {/* Agenda Button */}
                                <button
                                  onClick={() =>
                                    handleTabClick("agenda", selectedDate)
                                  }
                                  className={`relative group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                    activeTab === "agenda" ||
                                    viewingPDF === "agenda"
                                      ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                      : ""
                                  }`}
                                  style={{ minHeight: 110 }}
                                >
                                  {/* FIXED: Use direct check like in first code block */}
                                  {(() => {
                                    const currentResolution = dataToGroup.find(
                                      (item) => item.gc_date === selectedDate
                                    );
                                    return (
                                      pdfSearchTerm.trim() &&
                                      currentResolution?.matchedField ===
                                        "agenda" && (
                                        <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                          MATCH
                                        </div>
                                      )
                                    );
                                  })()}
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <span className="mb-2 text-2xl animate-bounce-slow">
                                      📋
                                    </span>
                                    <h2 className="mb-1 font-serif text-base font-bold text-center text-blue-900 transition-colors group-hover:text-white">
                                      Agenda
                                    </h2>
                                  </div>
                                </button>

                                {/* Meeting Notes Button */}
                                <button
                                  onClick={() =>
                                    handleTabClick(
                                      "meeting-notes",
                                      selectedDate
                                    )
                                  }
                                  className={`relative group block bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                                    activeTab === "meeting-notes" ||
                                    viewingPDF === "meeting-notes"
                                      ? "scale-105 shadow-2xl ring-4 ring-yellow-300"
                                      : ""
                                  }`}
                                  style={{ minHeight: 110 }}
                                >
                                  {/* FIXED: Use direct check like in first code block */}
                                  {(() => {
                                    const currentResolution = dataToGroup.find(
                                      (item) => item.gc_date === selectedDate
                                    );
                                    return (
                                      pdfSearchTerm.trim() &&
                                      currentResolution?.matchedField ===
                                        "meeting-notes" && (
                                        <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                          MATCH
                                        </div>
                                      )
                                    );
                                  })()}
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <span className="mb-2 text-2xl animate-bounce-slow">
                                      📝
                                    </span>
                                    <h2 className="mb-1 font-serif text-base font-bold text-center text-yellow-900 transition-colors group-hover:text-white">
                                      Meeting Notes
                                    </h2>
                                  </div>
                                </button>

                                {/* Resolution Button */}
                                <button
                                  onClick={() =>
                                    handleTabClick("resolution", selectedDate)
                                  }
                                  className={`relative group block bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                                    activeTab === "resolution" ||
                                    viewingPDF === "resolution"
                                      ? "scale-105 shadow-2xl ring-4 ring-purple-300"
                                      : ""
                                  }`}
                                  style={{ minHeight: 110 }}
                                >
                                  {/* FIXED: Use direct check like in first code block */}
                                  {(() => {
                                    const currentResolution = dataToGroup.find(
                                      (item) => item.gc_date === selectedDate
                                    );
                                    return (
                                      pdfSearchTerm.trim() &&
                                      currentResolution?.matchedField ===
                                        "resolution" && (
                                        <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                          MATCH
                                        </div>
                                      )
                                    );
                                  })()}
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <span className="mb-2 text-2xl animate-bounce-slow">
                                      ⚖️
                                    </span>
                                    <h2 className="mb-1 font-serif text-base font-bold text-center text-purple-900 transition-colors group-hover:text-white">
                                      Resolution
                                    </h2>
                                  </div>
                                </button>

                                {/* Compliance Button */}
                                <button
                                  onClick={() =>
                                    handleTabClick("compliance", selectedDate)
                                  }
                                  className={`relative group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                    activeTab === "compliance" ||
                                    viewingPDF === "compliance"
                                      ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                      : ""
                                  }`}
                                  style={{ minHeight: 110 }}
                                >
                                  {/* FIXED: Use direct check like in first code block */}
                                  {(() => {
                                    const currentResolution = dataToGroup.find(
                                      (item) => item.gc_date === selectedDate
                                    );
                                    return (
                                      pdfSearchTerm.trim() &&
                                      currentResolution?.matchedField ===
                                        "compliance" && (
                                        <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                          MATCH
                                        </div>
                                      )
                                    );
                                  })()}
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <span className="mb-2 text-2xl animate-bounce-slow">
                                      ✅
                                    </span>
                                    <h2 className="mb-1 font-serif text-base font-bold text-center text-green-900 transition-colors group-hover:text-white">
                                      Compliance
                                    </h2>
                                  </div>
                                </button>
                              </div>

                              {/* PDF Viewer */}
                              {viewingPDF && pdfUrl && (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-gray-800">
                                      Viewing:{" "}
                                      {viewingPDF.charAt(0).toUpperCase() +
                                        viewingPDF.slice(1)}
                                    </h4>
                                    <button
                                      onClick={() => {
                                        setViewingPDF(null);
                                        setPdfUrl("");
                                        setFileError("");
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                                    >
                                      ✕ Close PDF
                                    </button>
                                  </div>

                                  {isIOS() ? (
                                    <div className="p-6 text-center bg-blue-50 rounded-xl">
                                      <div className="mb-4">
                                        <svg
                                          className="w-12 h-12 mx-auto text-blue-500"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 2H4v8h12V6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                      <p className="mb-4 text-gray-700">
                                        PDF viewing in Safari requires opening
                                        in a new tab
                                      </p>
                                      <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                      >
                                        <svg
                                          className="w-5 h-5 mr-2"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z" />
                                        </svg>
                                        Open PDF in New Tab
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-full overflow-hidden border border-gray-300 rounded-lg h-96">
                                      <iframe
                                        src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                                        className="w-full h-full"
                                        title={`${viewingPDF} PDF`}
                                        style={{
                                          border: "none",
                                          minHeight: "600px",
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Error Message */}
                              {activeTab && fileError && !viewingPDF && (
                                <div className="p-6 mt-4 border border-red-200 rounded-lg bg-red-50">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      <svg
                                        className="w-5 h-5 text-red-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <h3 className="text-sm font-medium text-red-800">
                                        File Not Available
                                      </h3>
                                      <p className="mt-1 text-sm text-red-700">
                                        {fileError}
                                      </p>
                                    </div>
                                    <div className="pl-3 ml-auto">
                                      <button
                                        onClick={() => {
                                          setFileError("");
                                          setActiveTab(null);
                                        }}
                                        className="text-red-400 hover:text-red-600"
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
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="min-h-screen p-4 bg-gray-50 md:p-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                Governing Council Resolutions
              </h1>
            </div>
            <div className="w-32"></div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          {/* Institute and Tenure Filters */}
          {!loading && institutes.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Institute Dropdown */}
                <div className="flex-1 min-w-64">
                  <label
                    htmlFor="institute"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Select Institute
                  </label>
                  <select
                    id="institute"
                    name="institute"
                    value={selectedInstitute}
                    onChange={(e) => {
                      setSelectedInstitute(e.target.value);
                      setActiveInstituteTab("");
                      setSelectedDate(null);
                      setActiveTab(null);
                      setViewingPDF(null);
                      setPdfUrl("");
                      setFileError("");
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">All Institutes</option>
                    {institutes.map((inst) => (
                      <option key={inst.id} value={String(inst.id)}>
                        {inst.code} - {inst.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenure Dropdown */}
                <div className="flex-1 min-w-48">
                  <label
                    htmlFor="tenure"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Select Tenure
                  </label>
                  <select
                    id="tenure"
                    name="tenure"
                    value={selectedTenure}
                    onChange={(e) => {
                      setSelectedTenure(e.target.value);
                      setSelectedDate(null);
                      setActiveTab(null);
                      setViewingPDF(null);
                      setPdfUrl("");
                      setFileError("");
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">All Tenures</option>
                    {tenures.map((tenure) => (
                      <option key={tenure.id} value={String(tenure.id)}>
                        {tenure.tenure}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
              <div className="text-center">
                <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                <p className="font-medium text-gray-600">
                  Loading GC Resolutions...
                </p>
              </div>
            </div>
          )}

          {/* PDF Search */}
          {!loading && (
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
                Search Across All Resolution PDFs
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
                  placeholder="Search across all resolution content..."
                  className="block w-full py-3 pl-10 pr-12 transition bg-white border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={pdfSearchTerm}
                  onChange={(e) => setPdfSearchTerm(e.target.value)}
                />
                {pdfSearchTerm && !isSearching && (
                  <button
                    onClick={() => setPdfSearchTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
                    "Searching across resolution content..."
                  ) : (
                    <>
                      Found{" "}
                      <span className="font-bold">{searchResults.length}</span>{" "}
                      resolutions with matching content
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Institute Tabs when showing all institutes */}
          {!loading &&
            selectedInstitute === "" &&
            availableInstitutes.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => {
                      setActiveInstituteTab("");
                      setSelectedDate(null);
                      setActiveTab(null);
                      setViewingPDF(null);
                      setPdfUrl("");
                      setFileError("");
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeInstituteTab === ""
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All Institutes ({availableInstitutes.length})
                  </button>
                  {availableInstitutes.map((institute) => (
                    <button
                      key={institute.id}
                      onClick={() => {
                        setActiveInstituteTab(institute.id.toString());
                        setSelectedDate(null);
                        setActiveTab(null);
                        setViewingPDF(null);
                        setPdfUrl("");
                        setFileError("");
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeInstituteTab === institute.id.toString()
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {institute.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Main Content */}
          {!loading && (
            <div className="space-y-8">
              {institutesToDisplay.length > 0 ? (
                <div className="space-y-6">
                  {institutesToDisplay.map((instituteId) =>
                    renderInstituteSection(instituteId)
                  )}
                </div>
              ) : (
                <div className="px-6 py-16 text-center bg-white border border-gray-200 shadow-lg rounded-xl">
                  <svg
                    className="w-16 h-16 mx-auto text-indigo-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-xl font-medium text-gray-700">
                    {apiError
                      ? "Data unavailable"
                      : pdfSearchTerm.trim()
                      ? `No meetings found matching "${pdfSearchTerm}"`
                      : "No Resolutions Found For Selected Criteria"}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!loading && (
            <div className="mt-8 text-sm text-center text-gray-500">
              <p>Karnatak Law Society © {new Date().getFullYear()}</p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GCResolutionPage;
