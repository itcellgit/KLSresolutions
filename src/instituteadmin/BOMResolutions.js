import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getGCResolutions } from "../api/gcResolutions";
import { getBOMResolutions } from "../api/bomResolutions";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";
const BOMResolution = () => {
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
    <>
      <Header />
      <DashboardLayout>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          {/* Enhanced Breadcrumb Navigation */}
          <div className="w-full px-4 py-4 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={goToDashboard}
                  className="flex items-center px-3 py-2 text-gray-600 transition-all duration-200 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
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
                  Dashboard
                </button>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium text-indigo-600">
                  BOM Resolutions
                </span>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full bg-gray-50">
            <div className="w-full max-w-7xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
              {/* Enhanced Header Section */}
              <div className="mb-10">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h1 className="mb-4 text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
                      Board of Management Resolutions
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
                      Comprehensive management system for tracking and
                      monitoring Board of Management resolutions with detailed
                      compliance and governance oversight
                    </p>
                  </div>
                </div>
              </div>
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 text-white"
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
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Total BOM Resolutions
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {resolutions.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 text-white"
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
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        With Compliance
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {
                          resolutions.filter(
                            (r) => r.compliance && r.compliance.trim() !== ""
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Recent Resolutions
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
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
              {/* Enhanced Search Bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="Search by agenda, resolution, compliance, or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 absolute left-4 top-4"
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

                    {/* Search Results Info */}
                    {searchTerm && (
                      <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                          />
                        </svg>
                        {filteredResolutions.length} result
                        {filteredResolutions.length !== 1 ? "s" : ""} found
                        <button
                          onClick={() => setSearchTerm("")}
                          className="ml-2 text-indigo-500 hover:text-indigo-700"
                        >
                          <svg
                            className="w-4 h-4"
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
                    )}
                  </div>
                </div>
              </div>
              {/* Enhanced Resolutions Table */}
              <div className="mb-10 overflow-hidden bg-white shadow-2xl rounded-2xl border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          S.No
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-32">
                          BOM Number
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-40">
                          Agenda Section
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-64">
                          Agenda Details
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-64">
                          Resolution
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-48">
                          Compliance Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-56">
                          Related GC Resolution
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-32">
                          Meeting Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResolutions.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-12 h-12 text-gray-400"
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
                              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                No BOM resolutions found
                              </h3>
                              <p className="mb-6 text-gray-600 text-center max-w-md">
                                {searchTerm
                                  ? `No resolutions match your search "${searchTerm}". Try adjusting your search terms.`
                                  : "No Board of Management resolutions are available at this time."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredResolutions.map((resolution, index) => (
                          <tr
                            key={resolution.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="w-16 px-6 py-5 text-sm font-semibold text-center text-indigo-600">
                              {index + 1}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-900 w-32 font-medium">
                              {resolution.bom_no || (
                                <span className="text-gray-400 italic">
                                  Not Set
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-700 w-40 break-words">
                              {resolution.agenda_section || (
                                <span className="text-gray-400 italic">
                                  Not Specified
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-justify text-gray-700 w-64 break-words leading-relaxed">
                              {resolution.agenda || (
                                <span className="text-gray-400 italic">
                                  No agenda details
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-justify text-gray-700 w-64 break-words leading-relaxed">
                              {resolution.resolution || (
                                <span className="text-gray-400 italic">
                                  No resolution text
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-700 w-48 break-words">
                              {resolution.compliance &&
                              resolution.compliance.trim() !== "" ? (
                                <div
                                  className="max-w-xs truncate"
                                  title={resolution.compliance}
                                >
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Compliant
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-700 w-56 break-words">
                              {resolution.gc_resolution ? (
                                <div className="max-w-xs">
                                  <span
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                    title={resolution.gc_resolution.agenda}
                                  >
                                    <div className="font-medium">
                                      {resolution.gc_resolution.gc_no}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {formatDate(
                                        resolution.gc_resolution.gc_date
                                      )}
                                    </div>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">
                                  Not Linked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-900 w-32 whitespace-nowrap font-medium">
                              {resolution.bom_date ? (
                                new Date(
                                  resolution.bom_date
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              ) : (
                                <span className="text-gray-400 italic">
                                  Not Set
                                </span>
                              )}
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
      </DashboardLayout>
    </>
  );
};

export default BOMResolution;
