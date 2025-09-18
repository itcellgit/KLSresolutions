import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getGCResolutions } from "../api/gcResolutions";
import { getBOMResolutions } from "../api/bomResolutions";

const BOMResolutionsView = () => {
  const navigate = useNavigate();
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for GC resolutions (for displaying GC resolution details in the table)
  const [gcResolutions, setGcResolutions] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  const goToDashboard = () => {
    navigate("/instituteadmin/dashboard");
  };

  // Get token inside component to ensure it's current
  const token = useSelector((state) => state.auth.token);

  // Fetch GC resolutions for dropdown with error handling
  useEffect(() => {
    const fetchGCResolutions = async () => {
      try {
        //  const token = getToken();

        if (!token) {
          //console.error("No authentication token found");
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
  }, []); // Empty dependency array means this runs once on mount

  // Fetch BOM resolutions with error handling
  useEffect(() => {
    const fetchBOMResolutions = async () => {
      try {
        //  const token = getToken();
        if (!token) {
          //console.error("No authentication token found");
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
  }, []); // Empty dependency array means this runs once on mount

  // Filter resolutions based on search term
  const filteredResolutions = resolutions.filter((resolution) => {
    // First check if gc_resolution exists directly on the resolution object
    const gcResolution =
      resolution.gc_resolution ||
      gcResolutions.find((gc) => gc.id === resolution.gc_resolution_id);
    return (
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      resolution.bom_date.includes(searchTerm) ||
      resolution.gc_resolution_id.toString().includes(searchTerm) ||
      (gcResolution &&
        gcResolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      {/* Header with Logout */}
      <nav className="bg-white shadow-lg py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={process.env.PUBLIC_URL + "/image.png"}
            alt="KLS Logo"
            className="w-16 h-16 rounded-full shadow-lg"
          />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide">
            Karnataka Law Society
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 focus:outline-none"
        >
          Logout
        </button>
      </nav>
      <div className="flex justify-start mt-5 mr-3">
        <button
          onClick={goToDashboard}
          className="flex items-center text-gray-600 transition-colors duration-200 hover:text-blue-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="font-medium text-blue-600">Home</span>
        </button>
      </div>
      <main className="flex flex-col items-center justify-start flex-1 w-full">
        <div className="w-full max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
              Board of Management Resolutions
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              View all Board of Management resolutions
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
          {/* Search Bar */}
          <div className="relative w-full mb-6 sm:w-64">
            <input
              type="text"
              placeholder="Search assignments..."
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
          {/* Resolutions Table */}
          <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words">
                      SL.NO
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words w-72">
                      BOM No
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words w-72">
                      Agenda
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words w-72">
                      Resolution
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words w-72">
                      Compliance
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase break-words w-72">
                      GC Resolution
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-36">
                      BOM Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResolutions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
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
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredResolutions.map((resolution, index) => (
                      <tr key={resolution.id}>
                        <td className="w-16 px-6 py-4 text-sm font-medium text-center text-gray-900 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 w-36 whitespace-nowrap">
                          {resolution.bom_no}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                          <div className="truncate" title={resolution.agenda}>
                            {resolution.agenda}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                          <div
                            className="truncate"
                            title={resolution.resolution}
                          >
                            {resolution.resolution}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                          <div
                            className="truncate"
                            title={resolution.compliance}
                          >
                            {resolution.compliance}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 break-words w-72">
                          {resolution.gc_resolution ? (
                            <span
                              className="text-indigo-600"
                              title={resolution.gc_resolution.agenda}
                            >
                              {resolution.gc_resolution.gc_no}-
                              {resolution.gc_resolution.agenda}-Dated{" "}
                              {formatDate(resolution.gc_resolution.gc_date)}
                            </span>
                          ) : (
                            "Unknown"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 w-36 whitespace-nowrap">
                          {formatDate(resolution.bom_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BOMResolutionsView;
