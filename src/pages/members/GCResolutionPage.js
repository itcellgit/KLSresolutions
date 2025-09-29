import React, { useEffect, useState, useRef } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { getInstitutes } from "../../api/institutes";
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

const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [formData, setFormData] = useState({ tenure: getCurrentTenure() });
  const [tenures, setTenures] = useState([]);
  const [selectedTenure, setSelectedTenure] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle PDF viewing for buttons
  const handlePDFView = async (type, filename) => {
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

          // Open PDF in new tab for all user agents
          window.open(url, "_blank");

          // Clean up the URL after a short delay
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);

          // Don't set viewing state, just show normal tab content
          setViewingPDF(null);
          setPdfUrl("");
          setActiveTab(type);
        } else {
          console.error("Failed to fetch PDF:", response.status);
          // Fallback to normal tab content
          setViewingPDF(null);
          setPdfUrl("");
          setActiveTab(type);
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        // Fallback to normal tab content
        setViewingPDF(null);
        setPdfUrl("");
        setActiveTab(type);
      }
    } else {
      // No PDF, show normal tab content
      setViewingPDF(null);
      setPdfUrl("");
      setActiveTab(type);
    }
  };

  // Enhanced button click handler
  const handleTabClick = async (tab) => {
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
      case "meeting-notes":
        filename = currentData?.meeting_notes;
        break;
      default:
        setActiveTab(tab);
        setViewingPDF(null);
        setPdfUrl("");
        return;
    }

    await handlePDFView(tab, filename);
  };

  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("agenda");
  const [viewingPDF, setViewingPDF] = useState(null); // Track which PDF is being viewed
  const [pdfUrl, setPdfUrl] = useState(""); // Track the PDF URL for viewing

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchTenures = async () => {
    try {
      const data = await getAllManagementTenures(token);
      setTenures(data);

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
        const gcData = await getGCResolutions(token);
        const resolutions = gcData?.resolutions || gcData || [];
        setGCResolutions(resolutions);
        setApiError(false);

        const institutesData = await getInstitutes(token);
        setInstitutes(institutesData);

        const allowedInstituteIds = [
          ...new Set(resolutions.map((item) => item.institute_id)),
        ];
        const filtered = institutesData.filter((inst) =>
          allowedInstituteIds.includes(inst.id)
        );
        setFilteredInstitutes(filtered);

        if (filtered.length > 0) {
          setSelectedInstitute(String(filtered[0].id));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(true);
        setGCResolutions([]);
        setInstitutes([]);
        setFilteredInstitutes([]);
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
      setGCResolutions([]);
      setInstitutes([]);
      setFilteredInstitutes([]);
    }
  }, [token]);

  const getInstituteName = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.name : "N/A";
  };

  const filteredData = gcResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const instituteName = getInstituteName(item.institute_id).toLowerCase();
    const matchesSearch =
      String(item.agenda || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.agenda_section || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.resolution || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.compliance || "")
        .toLowerCase()
        .includes(searchLower) ||
      instituteName.includes(searchLower) ||
      String(item.gc_date || "")
        .toLowerCase()
        .includes(searchLower);

    const matchesInstitute =
      String(item.institute_id) === String(selectedInstitute);

    let matchesTenure = true;
    if (selectedTenure) {
      if (item.tenure_id) {
        matchesTenure = String(item.tenure_id) === String(selectedTenure);
      } else {
        matchesTenure = false;
      }
    }

    return matchesSearch && matchesInstitute && matchesTenure;
  });

  // Group by date first
  const groupedByDate = filteredData.reduce((acc, item) => {
    const dateKey = item.gc_date || "N/A";
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
    setSelectedDate(dateKey);
    setActiveTab("agenda"); // Reset to first tab when selecting a new date
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

  const getDateNumber = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.getDate();
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Predefined sections in the desired order
  const predefinedSections = [
    "MAIN AGENDA",
    "PURCHASE EXPENSE",
    "STAFF MATTERS",
    "OTHER MATTERS",
  ];

  // Tab configuration
  const tabs = [
    { id: "agenda", label: "Agenda", icon: "📋" },
    { id: "resolution", label: "Resolution", icon: "⚖️" },
    { id: "compliance", label: "Compliance", icon: "✅" },
    { id: "meeting-notes", label: "Meeting Notes", icon: "📝" },
  ];

  const renderTabContent = () => {
    if (!selectedDate || !groupedByDate[selectedDate]) return null;

    const items = groupedByDate[selectedDate];

    switch (activeTab) {
      case "agenda":
        return (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id || index} className="p-4 rounded-lg bg-gray-50">
                <h4 className="mb-2 font-semibold text-gray-800">
                  Agenda Item {index + 1}
                </h4>
                <div
                  className="prose text-gray-700 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: item.agenda || "No agenda information available",
                  }}
                />
              </div>
            ))}
          </div>
        );

      case "resolution":
        return (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id || index} className="p-4 rounded-lg bg-blue-50">
                <h4 className="mb-2 font-semibold text-gray-800">
                  Resolution {index + 1}
                </h4>
                <div
                  className="prose text-gray-700 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      item.resolution || "No resolution information available",
                  }}
                />
              </div>
            ))}
          </div>
        );

      case "compliance":
        return (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 rounded-lg bg-green-50"
              >
                <h4 className="mb-2 font-semibold text-gray-800">
                  Compliance {index + 1}
                </h4>
                <div
                  className="prose text-gray-700 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      item.compliance || "No compliance information available",
                  }}
                />
              </div>
            ))}
          </div>
        );

      case "meeting-notes":
        return (
          <div className="p-6 rounded-lg bg-yellow-50">
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              Meeting Notes for {formatDate(selectedDate)}
            </h4>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Institute:</span>{" "}
                {getInstituteName(items[0]?.institute_id)}
              </div>
              <div>
                <span className="font-medium">Meeting Notes:</span>{" "}
                {items[0]?.meeting_notes || "N/A"}
              </div>
              {items[0]?.meeting_notes && (
                <div className="mt-4">
                  <FileDownloadLink
                    filename={items[0].meeting_notes}
                    label="Download Meeting Notes PDF"
                    token={token}
                    className="inline-flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                Governing Council Resolutions
              </h1>
              <p className="max-w-2xl mx-auto mt-2 text-gray-600">
                View and search all resolutions passed by the Governing Council
              </p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          {!isLoading && filteredInstitutes.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {filteredInstitutes.map((inst) => (
                    <button
                      key={inst.id}
                      className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                        selectedInstitute === String(inst.id)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-indigo-700 border-gray-300 hover:bg-indigo-50"
                      }`}
                      onClick={() => setSelectedInstitute(String(inst.id))}
                    >
                      {inst.code}
                    </button>
                  ))}
                </div>

                <div className="ml-4">
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

          {isLoading && (
            <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
              <div className="text-center">
                <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                <p className="font-medium text-gray-600">
                  Loading GC Resolutions...
                </p>
              </div>
            </div>
          )}

          {!isLoading && (
            <div className="p-6 mb-8 bg-white border border-gray-200 shadow-md rounded-xl">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-4xl">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    placeholder="Search resolutions by agenda, agenda section, resolution, compliance, institute name..."
                    className="block w-full py-3 pl-10 pr-4 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center px-4 py-3 rounded-lg bg-indigo-50">
                  <span className="text-sm text-indigo-800">
                    Showing{" "}
                    <span className="font-bold">{filteredData.length}</span> of{" "}
                    <span className="font-bold">{gcResolutions.length}</span>{" "}
                    resolutions
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-8">
              {sortedMonthYearKeys.length > 0 ? (
                <div className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl">
                  {/* Table Header */}
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700">
                    <h2 className="text-xl font-bold text-white">
                      Meeting Schedule
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
                          <th className="px-6 py-4 text-sm font-semibold text-center text-gray-900">
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

                          return (
                            <tr key={monthYearKey} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r bg-gray-50">
                                {formatMonthYear(monthYearKey)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-wrap justify-center gap-2">
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
                                      {getDateNumber(dateKey)}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected Date Content */}
                  {selectedDate && (
                    <div className="border-t border-gray-200">
                      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">
                            Meeting Details - {formatDate(selectedDate)}
                          </h3>
                          <button
                            onClick={() => setSelectedDate(null)}
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
                      <div className="p-8">
                        <div className="grid grid-cols-4 gap-4">
                          {/* Agenda Button */}
                          <button
                            onClick={() => handleTabClick("agenda")}
                            className={`group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                              activeTab === "agenda" || viewingPDF === "agenda"
                                ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                : ""
                            }`}
                            style={{ minHeight: 110 }}
                          >
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

                          {/* Meeting Notes Button */}
                          <button
                            onClick={() => handleTabClick("meeting-notes")}
                            className={`group block bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 ${
                              activeTab === "meeting-notes" ||
                              viewingPDF === "meeting-notes"
                                ? "scale-105 shadow-2xl ring-4 ring-yellow-300"
                                : ""
                            }`}
                            style={{ minHeight: 110 }}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span
                                className="mb-2 text-2xl animate-bounce-slow"
                                aria-label="Meeting Notes"
                              >
                                📝
                              </span>
                              <h2 className="mb-1 font-serif text-base font-bold text-center text-yellow-900 transition-colors group-hover:text-white">
                                Meeting Notes
                              </h2>
                            </div>
                          </button>

                          {/* Resolution Button */}
                          <button
                            onClick={() => handleTabClick("resolution")}
                            className={`group block bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                              activeTab === "resolution" ||
                              viewingPDF === "resolution"
                                ? "scale-105 shadow-2xl ring-4 ring-purple-300"
                                : ""
                            }`}
                            style={{ minHeight: 110 }}
                          >
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
                            onClick={() => handleTabClick("compliance")}
                            className={`group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                              activeTab === "compliance" ||
                              viewingPDF === "compliance"
                                ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                : ""
                            }`}
                            style={{ minHeight: 110 }}
                          >
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

                        {/* Content Display */}
                        {activeTab && (
                          <div className="p-6 mt-8 bg-gray-50 rounded-xl">
                            {renderTabContent()}
                          </div>
                        )}
                      </div>
                    </div>
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

export default GCResolutionPage;
