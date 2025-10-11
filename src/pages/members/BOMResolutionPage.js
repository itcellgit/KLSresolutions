import React, { useEffect, useState, useRef } from "react";
import { getBOMResolutions, searchPDFContent } from "../../api/bomResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import FileDownloadLink from "../../components/FileDownloadLink";

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

// Helper function to map agenda sections to predefined categories
const mapToSectionCategory = (agendaSection) => {
  if (!agendaSection) return "OTHER MATTERS";

  const sectionLower = agendaSection.toLowerCase();

  if (sectionLower.includes("main")) return "MAIN AGENDA";
  if (sectionLower.includes("purchase")) return "PURCHASE EXPENSE";
  if (sectionLower.includes("staff")) return "STAFF MATTERS";

  return "OTHER MATTERS";
};

const BOMResolutionPage = () => {
  const [bomResolutions, setBOMResolutions] = useState([]);
  const [managementTenures, setManagementTenures] = useState([]);
  const [selectedTenure, setSelectedTenure] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(false);

  // PDF search related state
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // PDF viewing state
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileError, setFileError] = useState("");

  // Get token from Redux or localStorage
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  // Helper function to get BOM date from the object
  const getBOMDate = (item) => {
    if (item.bom_date) {
      return item.bom_date;
    }
    if (item.date) {
      return item.date;
    }
    if (item.meeting_date) {
      return item.meeting_date;
    }
    return null;
  };

  // Handle PDF viewing for buttons
  const handlePDFView = async (type, filename) => {
    console.log(
      `handlePDFView called with type: ${type}, filename: ${filename}`
    );

    setFileError("");

    if (filename) {
      try {
        const API_URL = "https://resolutions.klsbelagavi.org/api";
        const response = await fetch(
          `${API_URL}/bom_resolutions/file/${filename}`,
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
      setFileError(
        `No ${type.replace("-", " ")} file available for this resolution.`
      );
    }
  };

  // Enhanced button click handler
  const handleTabClick = async (tab) => {
    console.log(
      `Button clicked: ${tab}, current viewingPDF: ${viewingPDF}, current activeTab: ${activeTab}`
    );

    if (!selectedDate || !groupedByDate[selectedDate]) {
      setActiveTab(tab);
      return;
    }

    const currentData = groupedByDate[selectedDate][0];
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
      default:
        setActiveTab(tab);
        setViewingPDF(null);
        setPdfUrl("");
        return;
    }

    // Always set the active tab to show which button is selected
    setActiveTab(tab);

    // Always try to show the PDF if filename exists
    if (filename) {
      await handlePDFView(tab, filename);
    } else {
      // No file available for this tab, just clear PDF viewer and show error
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(
        `No ${tab.replace("-", " ")} file available for this meeting.`
      );
    }
  };

  // Detect iOS/iPad for better PDF handling
  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const fetchTenures = async () => {
    try {
      const data = await getAllManagementTenures(token);
      setManagementTenures(data);

      // Set the current tenure as default based on today's date
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
          // If no current tenure found, fallback to the latest tenure
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getBOMResolutions(token);
        const resolutions =
          response?.data || response?.resolutions || response || [];
        setBOMResolutions(resolutions);
        setApiError(false);
      } catch (err) {
        console.error("Error fetching BOM resolutions:", err);
        setApiError(true);
        setBOMResolutions([]);
        if (err.response && err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          localStorage.removeItem("token");
        } else {
          setError("Failed to fetch BOM resolutions. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
      fetchTenures();
    } else {
      setIsLoading(false);
      setApiError(true);
      setBOMResolutions([]);
      setManagementTenures([]);
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
  }, [pdfSearchTerm, token]); // Add token as dependency

  // Filter BOM resolutions based on selected filters
  const filteredData = bomResolutions.filter((resolution) => {
    let matchesTenure = true;
    if (selectedTenure) {
      if (resolution.tenure_id) {
        matchesTenure = String(resolution.tenure_id) === String(selectedTenure);
      } else {
        matchesTenure = false;
      }
    }
    return matchesTenure;
  });

  // Group by date first - use search results if PDF search is active
  const dataToGroup = pdfSearchTerm.trim() ? searchResults : filteredData;
  const groupedByDate = dataToGroup.reduce((acc, item) => {
    const dateKey = getBOMDate(item) || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  // Group by month and year
  const groupedByMonthYear = {};
  Object.keys(groupedByDate).forEach((dateKey) => {
    if (dateKey === "N/A") return;

    const date = new Date(dateKey);
    if (isNaN(date.getTime())) return;

    const monthYearKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!groupedByMonthYear[monthYearKey]) {
      groupedByMonthYear[monthYearKey] = {};
    }

    groupedByMonthYear[monthYearKey][dateKey] = groupedByDate[dateKey];
  });

  // Sort months in descending order
  const sortedMonthYearKeys = Object.keys(groupedByMonthYear).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const handleBackClick = () => {
    navigate("/member/dashboard");
  };

  const handleDateClick = (dateKey) => {
    console.log(`Date clicked: ${dateKey}, clearing PDF states`);

    // Clear PDF viewer and button states when switching dates
    setViewingPDF(null);
    setPdfUrl("");
    setActiveTab(null);
    setFileError("");

    // Set the selected date
    setSelectedDate(dateKey);
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

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="w-full">
      <Header />

      <div className="min-h-screen p-4 bg-gray-50 md:p-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center px-4 py-2 text-indigo-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:text-indigo-800"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Back
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                Board of Management Resolutions
              </h1>
            </div>
            <div className="w-32"></div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          {!isLoading && managementTenures.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div>
                  <label
                    htmlFor="tenure"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Tenure
                  </label>
                  <select
                    id="tenure"
                    name="tenure"
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
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
              <div className="text-center">
                <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                <p className="font-medium text-gray-600">
                  Loading BOM Resolutions...
                </p>
              </div>
            </div>
          )}

          {!isLoading && (
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
                  placeholder="Search across all resolution content (agenda, resolution text, compliance)..."
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
                    "Searching across resolution content..."
                  ) : searchResults.length > 0 ? (
                    <>
                      Found{" "}
                      <span className="font-bold">{searchResults.length}</span>{" "}
                      resolutions with matching content
                    </>
                  ) : pdfSearchTerm.trim() ? (
                    <span className="text-red-600">
                      No matches found for "{pdfSearchTerm}"
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {!isLoading && (
            <div className="space-y-8">
              {sortedMonthYearKeys.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl">
                  {/* Table Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700">
                    <h2 className="text-xl font-bold text-white">
                      {pdfSearchTerm.trim()
                        ? `Search Results (${searchResults.length} meetings found)`
                        : "Meeting Schedule"}
                    </h2>
                  </div>

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
                          const datesInMonth = groupedByMonthYear[monthYearKey];
                          const sortedDateKeys = Object.keys(datesInMonth).sort(
                            (a, b) => new Date(a) - new Date(b)
                          );

                          // Check if any date in this month is selected
                          const hasSelectedDate =
                            sortedDateKeys.includes(selectedDate);

                          return (
                            <React.Fragment key={monthYearKey}>
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
                                      {/* Header */}
                                      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                                        <div className="flex items-center justify-between">
                                          <h3 className="text-xl font-bold text-white">
                                            Meeting Details -{" "}
                                            {formatDate(selectedDate)}
                                          </h3>
                                          <button
                                            onClick={() => {
                                              setSelectedDate(null);
                                              setFileError("");
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

                                      {/* Dashboard-style Big Box Buttons */}
                                      <div className="p-6 space-y-6">
                                        {/* Button Grid - Always Visible */}
                                        <div className="space-y-6">
                                          <div className="grid grid-cols-3 gap-4">
                                            {/* Agenda Button */}
                                            <button
                                              onClick={() => {
                                                console.log(
                                                  "Agenda button clicked"
                                                );
                                                handleTabClick("agenda");
                                              }}
                                              className={`relative group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                                activeTab === "agenda" ||
                                                viewingPDF === "agenda"
                                                  ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                                  : ""
                                              }`}
                                              style={{ minHeight: 110 }}
                                            >
                                              {(() => {
                                                const currentResolution =
                                                  dataToGroup.find(
                                                    (item) =>
                                                      getBOMDate(item) ===
                                                      selectedDate
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
                                                <span
                                                  className="mb-2 text-2xl animate-bounce-slow"
                                                  aria-label="Agenda"
                                                >
                                                  📋
                                                </span>
                                                <h2 className="mb-1 font-serif text-base font-bold text-center text-blue-900 transition-colors group-hover:text-white">
                                                  Agenda
                                                </h2>
                                              </div>
                                            </button>

                                            {/* Resolution Button */}
                                            <button
                                              onClick={() => {
                                                console.log(
                                                  "Resolution button clicked"
                                                );
                                                handleTabClick("resolution");
                                              }}
                                              className={`relative group block bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                                                activeTab === "resolution" ||
                                                viewingPDF === "resolution"
                                                  ? "scale-105 shadow-2xl ring-4 ring-purple-300"
                                                  : ""
                                              }`}
                                              style={{ minHeight: 110 }}
                                            >
                                              {(() => {
                                                const currentResolution =
                                                  dataToGroup.find(
                                                    (item) =>
                                                      getBOMDate(item) ===
                                                      selectedDate
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
                                                <span
                                                  className="mb-2 text-2xl animate-bounce-slow"
                                                  aria-label="Resolution"
                                                >
                                                  ⚖️
                                                </span>
                                                <h2 className="mb-1 font-serif text-base font-bold text-center text-purple-900 transition-colors group-hover:text-white">
                                                  Resolution
                                                </h2>
                                              </div>
                                            </button>

                                            {/* Compliance Button */}
                                            <button
                                              onClick={() => {
                                                console.log(
                                                  "Compliance button clicked"
                                                );
                                                handleTabClick("compliance");
                                              }}
                                              className={`relative group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                                activeTab === "compliance" ||
                                                viewingPDF === "compliance"
                                                  ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                                  : ""
                                              }`}
                                              style={{ minHeight: 110 }}
                                            >
                                              {(() => {
                                                const currentResolution =
                                                  dataToGroup.find(
                                                    (item) =>
                                                      getBOMDate(item) ===
                                                      selectedDate
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
                                                <span
                                                  className="mb-2 text-2xl animate-bounce-slow"
                                                  aria-label="Compliance"
                                                >
                                                  ✅
                                                </span>
                                                <h2 className="mb-1 font-serif text-base font-bold text-center text-green-900 transition-colors group-hover:text-white">
                                                  Compliance
                                                </h2>
                                              </div>
                                            </button>
                                          </div>
                                        </div>

                                        {/* PDF Viewer - Shows Below Buttons When Active */}
                                        {viewingPDF && pdfUrl && (
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-lg font-semibold text-gray-800">
                                                Viewing:{" "}
                                                {viewingPDF
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  viewingPDF.slice(1)}
                                              </h4>
                                              <button
                                                onClick={() => {
                                                  console.log(
                                                    "Closing PDF viewer, keeping buttons visible"
                                                  );
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
                                                  PDF viewing in Safari requires
                                                  opening in a new tab
                                                </p>
                                                <div className="space-y-3">
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

                                        {/* Error Message - Shows when there's a file error and activeTab is set */}
                                        {activeTab &&
                                          fileError &&
                                          !viewingPDF && (
                                            <div className="p-6 mt-4 border border-red-200 rounded-lg bg-red-50">
                                              <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                  <svg
                                                    className="w-5 h-5 text-red-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
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
                      : "No Resolutions Found For Selected Tenure"}
                  </h3>
                </div>
              )}
            </div>
          )}

          {!isLoading && (
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

export default BOMResolutionPage;
