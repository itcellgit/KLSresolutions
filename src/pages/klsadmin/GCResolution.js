import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getInstitutes } from "../../api/institutes";
import { getGCResolutions } from "../../api/gcResolutions";

const GCResolutionPage = () => {
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
  // State for selected institute filter
  const [selectedInstitute, setSelectedInstitute] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get token from Redux store
  const token = useSelector((state) => state.auth.token);

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

  // Filter resolutions based on search term and selected institute
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
      resolution.gc_date.includes(searchTerm);

    // Apply institute filter - ensure type consistency by converting both to strings
    const matchesInstitute = selectedInstitute
      ? String(resolution.institute_id) === String(selectedInstitute)
      : true;

    return matchesSearch && matchesInstitute;
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

  // Reset to first page when search term or institute filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedInstitute]);

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find(
      (i) => String(i.id) === String(instituteId)
    );
    return institute ? institute.name : "Unknown";
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

        {/* Action Bar with Search and Institute Filter */}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resolutionsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
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
                    <td colSpan="6" className="px-6 py-12 text-center">
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
                    <td colSpan="6" className="px-6 py-12 text-center">
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
                          {selectedInstitute
                            ? "Try selecting a different institute or clearing the filter."
                            : "Try adjusting your search criteria."}
                        </p>
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
                  <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
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
      </div>
    </div>
  );
};

export default GCResolutionPage;
