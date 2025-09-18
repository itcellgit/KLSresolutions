// pages/DashboardPage.js
import React, { useState, useEffect } from "react";
import { fetchStatistics } from "../api/statistics";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    totalInstitutes: 0,
    totalMembers: 0,
    totalGCResolutions: 0,
    totalBOMResolutions: 0,
    recentResolutions: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(
    dashboardData.recentResolutions.length / itemsPerPage
  );
  const paginatedResolutions = dashboardData.recentResolutions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const getStats = async () => {
      try {
        const stats = await fetchStatistics();
        setDashboardData((prev) => ({
          ...prev,
          ...stats,
        }));
      } catch (err) {
        // Optionally handle error
      }
    };
    getStats();
  }, []);

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            DASHBOARD
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Overview of KLS RESOLUTIONS system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Institutes Card */}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Institutes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalInstitutes}
                </p>
              </div>
            </div>
          </div>

          {/* Total Members Card */}
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalMembers}
                </p>
              </div>
            </div>
          </div>

          {/* GC Resolutions Card */}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  GC Resolutions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalGCResolutions}
                </p>
              </div>
            </div>
          </div>

          {/* BOM Resolutions Card */}
          <div className="p-6 bg-white border-l-4 border-red-500 shadow-md rounded-xl">
            <div className="flex items-center">
              <div className="p-3 mr-4 bg-red-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-red-600"
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
                  BOM Resolutions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalBOMResolutions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <div className="p-6 bg-white shadow-xl rounded-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/klsadmin/institutes"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-indigo-50 hover:bg-indigo-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-indigo-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Manage Institutes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit, or remove institutes
                </p>
              </Link>

              <Link
                to="/klsadmin/members"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-green-50 hover:bg-green-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-green-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Manage Members</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add, edit, or remove members
                </p>
              </Link>

              <Link
                to="/klsadmin/gcresolution"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-yellow-50 hover:bg-yellow-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-yellow-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-yellow-600"
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
                <h3 className="font-medium text-gray-900">GC Resolutions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage Governing Council resolutions
                </p>
              </Link>

              <Link
                to="/klsadmin/bomresolutions"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-red-50 hover:bg-red-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-red-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-red-600"
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
                <h3 className="font-medium text-gray-900">BOM Resolutions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage Board of Management resolutions
                </p>
              </Link>
              <Link
                to="/klsadmin/agm"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-blue-50 hover:bg-blue-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-blue-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.67 0-8 1.337-8 4v2a1 1 0 001 1h14a1 1 0 001-1v-2c0-2.663-5.33-4-8-4z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">AGM</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage Annual General Meetings
                </p>
              </Link>

              <Link
                to="/klsadmin/memberrole"
                className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 rounded-lg bg-purple-50 hover:bg-purple-100 hover:shadow-md"
              >
                <div className="p-3 mb-3 bg-purple-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm2 13a6 6 0 00-12 0"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Member Role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Assign or manage member roles
                </p>
              </Link>
            </div>
          </div>

          {/* Recent Resolutions */}
          <div className="p-6 bg-white shadow-xl rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Recent GC And BOM Resolutions
              </h2>
            </div>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedResolutions.map((resolution) => (
                    <tr key={resolution.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {resolution.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            resolution.type === "GC"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {resolution.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {resolution.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-700 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-gray-700 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
