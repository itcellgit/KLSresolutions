import React, { useEffect, useState } from "react";
import { getBOMResolutions } from "../../api/bomResolutions";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const BOMResolutionPage = () => {
  const [bomResolutions, setBOMResolutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get token from Redux or localStorage
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Add navigate hook
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBOMResolutions = async () => {
      // Check if token exists
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await getBOMResolutions(token);
        // Log the response to understand its structure
        console.log("API Response:", response);
        // Extract the data array from the response
        const data = response.data || response.resolutions || response;
        // Check if data is an array
        if (Array.isArray(data)) {
          setBOMResolutions(data);
        } else {
          console.error("Unexpected data format:", data);
          setError("Received data in unexpected format");
          setBOMResolutions([]);
        }
      } catch (err) {
        console.error("Error fetching BOM resolutions:", err);
        // Handle specific 401 error
        if (err.response && err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Clear invalid token
          localStorage.removeItem("token");
        } else {
          setError("Failed to fetch BOM resolutions. Please try again later.");
        }
        setBOMResolutions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBOMResolutions();
  }, [token]);

  // Function to handle back button click
  const handleBackClick = () => {
    navigate("/member/dashboard");
  };

  // Filter data based on search term
  const filteredData = bomResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.agenda && item.agenda.toLowerCase().includes(searchLower)) ||
      (item.resolution &&
        item.resolution.toLowerCase().includes(searchLower)) ||
      (item.compliance &&
        item.compliance.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.agenda &&
        item.gc_resolution.agenda.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.resolution &&
        item.gc_resolution.resolution.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.gc_date &&
        item.gc_resolution.gc_date.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button and centered title */}
        <div className="flex items-center mb-6 md:mb-8">
          {/* Back button */}
          <button
            onClick={handleBackClick}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4 flex-shrink-0"
          >
            <svg
              className="w-5 h-5 mr-1"
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

          {/* Centered title container */}
          <div className="flex-grow text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              BOM Resolutions
            </h2>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              View and manage Board of Management resolutions
            </p>
          </div>

          {/* Spacer to balance the back button */}
          <div className="w-16 flex-shrink-0"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
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

        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 shadow-sm"
              placeholder="Search resolutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600">
                <tr>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase w-16"
                  >
                    S.No
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    BOM Agenda
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    BOM Resolution
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    BOM Compliance
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    GC Agenda
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    GC Resolution
                  </th>
                  <th
                    scope="col"
                    className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold tracking-wider text-left text-white uppercase"
                  >
                    BOM Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-sm text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                        <span>Loading BOM resolutions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="hover:bg-blue-50 transition-colors duration-150"
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.agenda || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.resolution || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.compliance || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.gc_resolution?.agenda || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.gc_resolution?.resolution || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.bom_resolutions?.bom_date
                            ? new Date(
                                item.bom_resolutions.bom_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-sm text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-300 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <p className="text-lg font-medium text-gray-700">
                          {error
                            ? "Unable to load data due to authentication error."
                            : searchTerm
                            ? "No resolutions found matching your search criteria."
                            : "No BOM resolutions available."}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search results info */}
        {searchTerm && !loading && (
          <div className="mt-6 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              Showing <span className="font-medium">{filteredData.length}</span>{" "}
              of <span className="font-medium">{bomResolutions.length}</span>{" "}
              resolutions
            </div>
            <button
              onClick={() => setSearchTerm("")}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMResolutionPage;
