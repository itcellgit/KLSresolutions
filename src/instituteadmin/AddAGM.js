import React, { useEffect, useState, useRef } from "react";
import { getAGMs, searchPDFContent } from "../api/agm";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_URL = "https://resolutions.klsbelagavi.org/api";

const AddAGM = () => {
  const [agmResolutions, setAGMResolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF search / view state
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // 'agenda' | 'notes'
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileError, setFileError] = useState("");

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();
  const expandedContentRef = useRef(null);

  const isIOS = () => {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
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

  // Fetch AGMs
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getAGMs(token);
        setAGMResolutions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Error fetching AGM resolutions:", err);
        if (err?.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
          localStorage.removeItem("token");
        } else {
          setError("Failed to fetch AGM resolutions.");
        }
        setAGMResolutions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Debounced PDF search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!pdfSearchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      const doSearch = async () => {
        setIsSearching(true);
        try {
          const results = await searchPDFContent(pdfSearchTerm, token);
          const normalized =
            results?.results || results?.items || results || [];
          setSearchResults(Array.isArray(normalized) ? normalized : []);
        } catch (err) {
          console.error("PDF search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      };
      doSearch();
    }, 500);
    return () => clearTimeout(timeout);
  }, [pdfSearchTerm, token]);

  // Helper to get agm date key
  const getAGMDate = (item) =>
    item.agm_date || item.date || item.meeting_date || "N/A";

  // Choose dataset: either search results (if searching) or fetched AGMs
  const dataToGroup = pdfSearchTerm.trim() ? searchResults : agmResolutions;

  // Group by date
  const groupedByDate = dataToGroup.reduce((acc, item) => {
    const dateKey = getAGMDate(item) || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedByDate)
    .filter((k) => k !== "N/A")
    .sort((a, b) => new Date(b) - new Date(a));

  // Stats
  const totalMeetings = agmResolutions.length;
  const withNotes = agmResolutions.filter(
    (r) => r.notes || r.notes_file
  ).length;
  const recentMeetings = agmResolutions.filter((r) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const d = new Date(getAGMDate(r));
    return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  }).length;

  // Handle PDF fetching & viewing (robust candidate URLs)
  const handlePDFView = async (type, filename) => {
    setFileError("");

    if (!filename) {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(`No ${type} file available for this meeting.`);
      return;
    }

    if (typeof filename === "object") {
      filename =
        filename.filename ||
        filename.file ||
        filename.path ||
        filename.url ||
        null;
    }

    if (typeof filename === "string" && /^https?:\/\//i.test(filename)) {
      try {
        if (pdfUrl && pdfUrl.startsWith("blob:"))
          window.URL.revokeObjectURL(pdfUrl);
      } catch (e) {}
      setPdfUrl(filename);
      setViewingPDF(type);
      setFileError("");
      return;
    }

    const encoded = encodeURIComponent(String(filename));
    const candidates = [
      `${API_URL}/agm/file/${encoded}`,
      `${API_URL}/uploads/${encoded}`,
      `${API_URL}/files/${encoded}`,
      `${API_URL}/agm/file/${filename}`,
    ];

    let lastError = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) {
          lastError = `HTTP ${res.status} from ${url}`;
          if (res.status === 404) continue;
          setViewingPDF(null);
          setPdfUrl("");
          setFileError(`Failed to load ${type} file. (${res.status})`);
          return;
        }
        const blob = await res.blob();
        try {
          if (pdfUrl && pdfUrl.startsWith("blob:"))
            window.URL.revokeObjectURL(pdfUrl);
        } catch (e) {}
        const objectUrl = window.URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setViewingPDF(type);
        setFileError("");
        return;
      } catch (err) {
        console.error("Error fetching PDF from", url, err);
        lastError = err;
      }
    }

    console.error("All attempts to fetch PDF failed:", lastError);
    setViewingPDF(null);
    setPdfUrl("");
    setFileError(`File not found on server. Please contact the administrator.`);
  };

  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    setFileError("");

    if (!selectedDate || !groupedByDate[selectedDate]) {
      setFileError("No meeting selected.");
      return;
    }

    const currentData = groupedByDate[selectedDate][0];

    const filename =
      (tab === "agenda"
        ? currentData?.agenda_file ||
          currentData?.agenda_filename ||
          currentData?.agenda
        : currentData?.notes_file ||
          currentData?.notes_filename ||
          currentData?.notes) || null;

    if (filename) {
      await handlePDFView(tab, filename);
    } else {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(`No ${tab} file available for this meeting.`);
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:"))
        window.URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // simple auto-refresh (optional)
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleBackClick = () => navigate("/instituteadmin/dashboard");

  // Debug helper
  const debugFileData = (agm) => {
    console.log("AGM data:", agm);
    console.log("agenda_file:", agm.agenda_file);
    console.log("agenda:", agm.agenda);
    console.log("notes_file:", agm.notes_file);
    console.log("notes:", agm.notes);
    return agm;
  };

  return (
    <div className="w-full">
      <Header />
      <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
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
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>

              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
                  Annual General Meeting Resolutions
                </h1>
              </div>

              <div className="w-32" />
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
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
                Search Across All AGM Resolution PDFs
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
                  placeholder="Search across all resolution content (agenda, notes)..."
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
                  ) : (
                    <>
                      Found{" "}
                      <span className="font-bold">{searchResults.length}</span>{" "}
                      matching meeting{searchResults.length !== 1 ? "s" : ""}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
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
                    Total AGM Meetings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalMeetings}
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
                    With Notes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {withNotes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meetings list */}
          <div className="mb-10">
            {sortedDateKeys.length === 0 ? (
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
                    No meetings found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or come back later
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDateKeys.map((dateKey) => {
                  const items = groupedByDate[dateKey] || [];
                  const isExpanded = selectedDate === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className="overflow-hidden bg-white shadow-lg rounded-xl"
                    >
                      <div
                        onClick={() =>
                          setSelectedDate(isExpanded ? null : dateKey)
                        }
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
                              {formatDate(dateKey)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {items.length} item{items.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {pdfSearchTerm.trim() &&
                            items.some((it) => it.matchedField) && (
                              <div className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                                CONTENTS MATCH
                              </div>
                            )}
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

                      {isExpanded && (
                        <div
                          ref={expandedContentRef}
                          className="p-6 border-t bg-gray-50"
                        >
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={() => setSelectedDate(null)}
                              className="p-2 text-gray-400 hover:text-gray-600"
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
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={() => handleTabClick("agenda")}
                                className={`relative group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                  activeTab === "agenda" ||
                                  viewingPDF === "agenda"
                                    ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                    : ""
                                }`}
                                style={{ minHeight: 110 }}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  <span className="mb-2 text-2xl">📋</span>
                                  <h2 className="mb-1 font-serif text-base font-bold text-center text-blue-900 group-hover:text-white">
                                    Agenda
                                  </h2>
                                </div>
                              </button>

                              <button
                                onClick={() => handleTabClick("notes")}
                                className={`relative group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                  activeTab === "notes" ||
                                  viewingPDF === "notes"
                                    ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                    : ""
                                }`}
                                style={{ minHeight: 110 }}
                              >
                                <div className="flex flex-col items-center justify-center h-full">
                                  <span className="mb-2 text-2xl">📝</span>
                                  <h2 className="mb-1 font-serif text-base font-bold text-center text-green-900 group-hover:text-white">
                                    Notes
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
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                                  >
                                    ✕ Close PDF
                                  </button>
                                </div>

                                {isIOS() ? (
                                  <div className="p-6 text-center bg-blue-50 rounded-xl">
                                    <p className="mb-4 text-gray-700">
                                      PDF viewing in Safari requires opening in
                                      a new tab
                                    </p>
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
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

                            {/* File error */}
                            {fileError && !viewingPDF && (
                              <div className="p-6 mt-4 border border-red-200 rounded-lg bg-red-50">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <svg
                                      className="w-5 h-5 text-red-400"
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
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-sm text-center text-gray-500">
            <p>Karnatak Law Society © {new Date().getFullYear()}</p>
            <p className="mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-64 mt-8 bg-white shadow-md rounded-xl">
              <div className="text-center">
                <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin" />
                <p className="font-medium text-gray-600">
                  Loading AGM Resolutions...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 mt-6 mb-6 text-red-700 rounded-lg shadow-sm bg-red-50">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAGM;
