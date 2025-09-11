import React, { useEffect, useState } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { useSelector } from "react-redux";

const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Sample data for display when API returns empty or fails
  const sampleData = [
    {
      id: 1,
      agenda: "Budget Approval",
      resolution: "Approved the annual budget for the fiscal year 2024-2025",
      compliance: "Finance Department",
      institute_id: "KLS GIT",
      gc_date: "2024-06-01",
    },
    {
      id: 2,
      agenda: "Faculty Recruitment",
      resolution:
        "Plan to recruit 20 new faculty members across various departments",
      compliance: "HR Department",
      institute_id: "KLS GIT",
      gc_date: "2024-06-02",
    },
    {
      id: 3,
      agenda: "Infrastructure Upgrade",
      resolution: "Modernization of classrooms and labs with latest technology",
      compliance: "Facilities Department",
      institute_id: "KLS GOGTE",
      gc_date: "2024-06-03",
    },
  ];

  useEffect(() => {
    const fetchGCResolutions = async () => {
      setIsLoading(true);
      try {
        const data = await getGCResolutions(token);
        console.log("Fetched GC Resolutions:", data);
        if (data === null || data.resolutions === null) {
          setApiError(true);
          setGCResolutions(sampleData);
        } else {
          setApiError(false);
          setGCResolutions(data.resolutions || data);
        }
      } catch (err) {
        console.error("Error fetching GC Resolutions:", err);
        setApiError(true);
        setGCResolutions(sampleData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGCResolutions();
  }, [token]);

  // Filter data based on search term
  const filteredData = gcResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(item.agenda || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.resolution || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.compliance || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.institute_id || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.gc_date || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-20 p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Governing Council Resolutions
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          View and search all resolutions passed by the Governing Council
        </p>
      </div>

      <div className="max-w-screen-2xl mx-auto">
        {/* Error message */}
        {apiError && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Unable to fetch latest data from
                  server. Displaying sample data for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 font-medium">
                Loading GC Resolutions...
              </p>
            </div>
          </div>
        )}

        {/* Search Bar and Stats */}
        {!isLoading && (
          <div className="mb-8 bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-3xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                  placeholder="Search resolutions by agenda, resolution, compliance..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-3 rounded-lg">
                <span className="text-sm text-blue-800">
                  Showing{" "}
                  <span className="font-bold">{filteredData.length}</span> of{" "}
                  <span className="font-bold">{gcResolutions.length}</span>{" "}
                  resolutions
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-400 to-blue-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-16">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-48">
                      Agenda
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider flex-1">
                      Resolution
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-48">
                      Compliance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-40">
                      Institute ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-40">
                      GC Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((res, index) => (
                      <tr
                        key={res.id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {res.agenda || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {res.resolution || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {res.compliance || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {res.institute_id || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {res.gc_date || "N/A"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-16 text-center bg-blue-50"
                      >
                        <svg
                          className="mx-auto h-16 w-16 text-blue-300"
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
                          No resolutions found
                        </h3>
                        <p className="mt-2 text-gray-500 max-w-md mx-auto">
                          {searchTerm
                            ? "No resolutions match your search criteria. Try a different search term."
                            : "There are no GC resolutions available at the moment."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isLoading && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>
              Governing Council Resolutions System © {new Date().getFullYear()}
            </p>
            <p className="mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GCResolutionPage;
