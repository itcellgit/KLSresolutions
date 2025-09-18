// export default AddAGM;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAGMs } from "../api/agm";
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
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
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
          className="flex items-center text-gray-600 hover:text-blue-700 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-1"
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
          <span className="font-medium text-primary">Home</span>
        </button>
      </div>

      <main className="flex-1 w-full flex flex-col items-center justify-start">
        <div className="max-w-6xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
              AGM Management
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Annual General Meetings Information
            </p>
          </div>
          <div className="relative w-full sm:w-64 mb-6">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={handleSearchChange}
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
          {/* AGMs Table */}
          <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-28">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-72">
                      Agenda
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-52">
                      Resolution
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
                      <td colSpan="4" className="px-6 py-12 text-center">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <h3 className="mb-1 text-lg font-medium text-gray-900">
                            {searchTerm
                              ? "No matching AGMs found"
                              : "No AGMs found"}
                          </h3>
                          <p className="text-gray-500">
                            {searchTerm
                              ? "Try adjusting your search criteria."
                              : "There are no AGMs available at this time."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((agm, idx) => (
                      <tr key={agm.id}>
                        <td className="w-16 px-6 py-4 text-sm font-medium text-center text-gray-900">
                          {indexOfFirstItem + idx + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap w-28">
                          {agm.agm_date
                            ? new Date(agm.agm_date).toLocaleDateString()
                            : ""}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 w-72 break-words">
                          {agm.agenda || ""}
                        </td>
                        <td className="px-6 py-4 text-sm text-justify text-gray-500 w-52 break-words">
                          {agm.notes || ""}
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
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredAGMs.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredAGMs.length}</span>{" "}
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    })}
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
  );
};
export default AddAGM;
