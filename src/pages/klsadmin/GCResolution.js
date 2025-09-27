import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getInstitutes } from "../../api/institutes";
import { getGCResolutions } from "../../api/gcResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";

// Helper function to strip HTML tags from a string
const stripHtmlTags = (str) => {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
};

const GCResolutionPage = () => {
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for dropdown data (will be populated from backend)
  const [institutes, setInstitutes] = useState([]);
  const [tenures, setTenures] = useState([]);
  // State for loading
  const [loading, setLoading] = useState(true);
  // State for errors
  const [error, setError] = useState(null);
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for loading resolutions
  const [resolutionsLoading, setResolutionsLoading] = useState(true);
  const [resolutionsError, setResolutionsError] = useState(null);
  // State for selected filters
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // State for accordion sections - only one section can be open at a time
  const [openSections, setOpenSections] = useState({
    "MAIN AGENDA": false,
    "PURCHASE EXPENSES": false,
    "STAFF MATTERS": false,
    "OTHER MATTERS": false,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get token from Redux store
  const token = useSelector((state) => state.auth.token);

  // Fetch institutes, tenures and resolutions when component mounts
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

    const fetchTenures = async () => {
      try {
        const data = await getAllManagementTenures(token);
        setTenures(data);

        // Set the latest tenure as default
        if (data && data.length > 0) {
          const latestTenure = data.reduce((latest, current) => {
            return new Date(current.start_date) > new Date(latest.start_date)
              ? current
              : latest;
          });
          setSelectedTenure(String(latestTenure.id));
        }
      } catch (err) {
        console.error("Error fetching tenures:", err);
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
      fetchTenures();
      fetchResolutions();
    }
  }, [token]);

  // Filter resolutions based on search term, selected institute, selected tenure, and selected date
  const filteredResolutions = resolutions.filter((resolution) => {
    const institute = institutes.find((i) => i.id === resolution.institute_id);

    // Apply search filter
    const matchesSearch =
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      institute?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.gc_date.includes(searchTerm) ||
      (resolution.agenda_section &&
        resolution.agenda_section
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    // Apply institute filter
    const matchesInstitute = selectedInstitute
      ? String(resolution.institute_id) === String(selectedInstitute)
      : true;

    // Apply tenure filter
    const matchesTenure = selectedTenure
      ? String(resolution.tenure_id) === String(selectedTenure)
      : true;

    // Apply date filter
    const matchesDate = selectedDate
      ? resolution.gc_date &&
        new Date(resolution.gc_date).toISOString().split("T")[0] ===
          selectedDate
      : true;

    return matchesSearch && matchesInstitute && matchesTenure && matchesDate;
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedInstitute, selectedTenure, selectedDate]);

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find(
      (i) => String(i.id) === String(instituteId)
    );
    return institute ? institute.name : "Unknown";
  };

  // Helper function to get tenure name by id
  const getTenureName = (tenureId) => {
    const tenure = tenures.find((t) => String(t.id) === String(tenureId));
    return tenure ? `${tenure.start_date} - ${tenure.end_date}` : "Unknown";
  };

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
                  {filteredResolutions.length}
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
                  {filteredResolutions.filter((r) => r.compliance).length}
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

          {/* Filters Row */}
          <div className="flex flex-wrap items-end gap-4 w-full sm:w-auto">
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
                {tenures.map((tenure) => (
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

            {/* Institute Filter Dropdown */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedInstitute}
                onChange={(e) => setSelectedInstitute(e.target.value)}
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Institutes</option>
                {institutes.map((institute) => (
                  <option key={institute.id} value={String(institute.id)}>
                    {institute.name}
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

            {/* Clear Filters Button */}
            <div className="w-full sm:w-auto">
              {(selectedDate ||
                selectedInstitute ||
                selectedTenure ||
                searchTerm) && (
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setSelectedInstitute("");
                    setSelectedTenure("");
                    setSearchTerm("");
                  }}
                  className="w-full sm:w-auto h-10 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="mb-10 space-y-4">
          {Object.entries(groupedResolutions).map(
            ([section, sectionResolutions]) => (
              <div
                key={section}
                className="bg-white shadow-lg rounded-xl overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center">
                    <h3 className="text-xl font-bold text-gray-900">
                      {section}
                    </h3>
                    <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
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
                            Agenda
                          </th>
                          <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Resolution
                          </th>
                          <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Compliance
                          </th>
                          <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sectionResolutions.map((resolution, index) => (
                          <tr key={resolution.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-md">
                              {resolution.agenda}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-md">
                              {stripHtmlTags(resolution.resolution)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words max-w-xs">
                              {resolution.compliance || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex flex-col space-y-1">
                                <span className="font-medium">
                                  {getInstituteName(resolution.institute_id)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Date: {formatDate(resolution.gc_date)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Tenure: {getTenureName(resolution.tenure_id)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          )}

          {/* No Data State */}
          {Object.keys(groupedResolutions).length === 0 && (
            <div className="bg-white shadow-lg rounded-xl p-12 text-center">
              {resolutionsLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading resolutions...</p>
                </div>
              ) : resolutionsError ? (
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
              ) : (
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
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedInstitute ||
                    selectedTenure ||
                    selectedDate ||
                    searchTerm
                      ? "Try adjusting your filter criteria."
                      : "Try adjusting your search criteria."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GCResolutionPage;
