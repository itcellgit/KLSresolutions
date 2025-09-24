// export default AddAGM;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAGMs } from "../api/agm";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";
import { useSelector } from "react-redux";
const AddAGM = () => {
  const navigate = useNavigate();
  const [agms, setAGMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  /* const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  }; */
  const goToDashboard = () => {
    navigate("/instituteadmin/dashboard");
  };
  // Fetch AGMs from backend
  const fetchAGMs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAGMs(token);
      setAGMs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAGMs();
  }, []);
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  // Filter AGMs based on search term
  const filteredAGMs = agms.filter((agm) => {
    return (
      agm.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agm.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agm.agm_date &&
        new Date(agm.agm_date).toLocaleDateString().includes(searchTerm))
    );
  });
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAGMs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAGMs.length / itemsPerPage);
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
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
                  AGM Management
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h1 className="mb-4 text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
                      AGM Management System
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed">
                      Comprehensive management and tracking system for Annual
                      General Meetings with detailed agenda and resolution
                      monitoring
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Total AGMs
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {agms.length}
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
                        With Resolutions
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {
                          agms.filter(
                            (agm) => agm.notes && agm.notes.trim() !== ""
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
                        Recent Meetings
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {
                          agms.filter((agm) => {
                            const agmDate = new Date(agm.agm_date);
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return agmDate >= thirtyDaysAgo;
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
                        placeholder="Search by agenda, resolution, or date..."
                        value={searchTerm}
                        onChange={handleSearchChange}
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
                        {filteredAGMs.length} result
                        {filteredAGMs.length !== 1 ? "s" : ""} found
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
              {/* Enhanced AGMs Table */}
              <div className="mb-10 overflow-hidden bg-white shadow-2xl rounded-2xl border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          S.No
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-28 border-b-2 border-gray-200">
                          Meeting Date
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-72 border-b-2 border-gray-200">
                          Agenda Details
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-52 border-b-2 border-gray-200">
                          Meeting Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                              <h3 className="mb-1 text-lg font-medium text-gray-900">
                                Loading AGMs...
                              </h3>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <h3 className="mb-1 text-lg font-medium text-gray-900">
                                Error loading AGMs
                              </h3>
                              <p className="text-gray-500">{error}</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredAGMs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-16 text-center">
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
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                {searchTerm
                                  ? "No matching AGMs found"
                                  : "No AGMs found"}
                              </h3>
                              <p className="mb-6 text-gray-600 text-center max-w-md">
                                {searchTerm
                                  ? `No AGMs match your search "${searchTerm}". Try adjusting your search terms.`
                                  : "Start by scheduling your first Annual General Meeting to begin tracking meeting records."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((agm, idx) => (
                          <tr
                            key={agm.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="w-16 px-6 py-5 text-sm font-semibold text-center text-indigo-600">
                              {indexOfFirstItem + idx + 1}
                            </td>
                            <td className="px-6 py-5 text-sm text-center text-gray-900 whitespace-nowrap w-28 font-medium">
                              {agm.agm_date
                                ? new Date(agm.agm_date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "Not Set"}
                            </td>
                            <td className="px-6 py-5 text-sm text-justify text-gray-700 w-72 break-words leading-relaxed">
                              {agm.agenda || (
                                <span className="text-gray-400 italic">
                                  No agenda specified
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm text-justify text-gray-700 w-52 break-words leading-relaxed">
                              {agm.notes || (
                                <span className="text-gray-400 italic">
                                  No notes available
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
              {/* Pagination */}
              {filteredAGMs.length > itemsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-xl shadow-md">
                  <div className="flex justify-between flex-1 sm:hidden">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {indexOfFirstItem + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredAGMs.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredAGMs.length}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {/* Page numbers */}
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </DashboardLayout>
    </>
  );
};
export default AddAGM;
