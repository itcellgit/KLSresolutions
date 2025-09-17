// pages/MemberRoleManagementPage.js
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMembers } from "../api/members";
import { getRoles } from "../api/roles";
import { getInstitutes } from "../api/institutes";
import { getAllMemberRoles } from "../api/memberRole";

const Members = () => {
  // Fixed: Added the arrow function syntax
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for dropdown data
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  // State for member roles
  const [memberRoles, setMemberRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({
    members: null,
    roles: null,
    institutes: null,
  });
  // Add state for table loading
  const [tableLoading, setTableLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  // Add state to track if data is fully loaded
  const [dataLoaded, setDataLoaded] = useState(false);

  // Get token and user info from Redux
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Ref to track logged missing members to avoid console spam
  const loggedMissingMembers = useRef(new Set());

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Go to dashboard
  const goToDashboard = () => {
    navigate("/instituteadmin/dashboard");
  };

  // Helper: get member name by id (backend uses `name` field)
  const getMemberName = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      if (!loggedMissingMembers.current.has(memberId)) {
        console.log(`Member with ID ${memberId} not found in members array`);
        loggedMissingMembers.current.add(memberId);
      }
      return `Member #${memberId}`;
    }
    // Prefer explicit member.name (defined in backend model). Fallback to nested user if needed.
    if (member.name) return member.name;
    if (member.user && member.user.username) return member.user.username;
    return `Member #${memberId}`;
  };

  // Helper function to get role name by id
  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return `Role #${roleId}`;
    return role.role_name || role.name || role.title || "Unknown";
  };

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find((i) => i.id === instituteId);
    if (!institute) return "Not Assigned";
    return institute.name || institute.institute_name || "Unknown";
  };

  // Debug: Check if token is available
  useEffect(() => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
    }
  }, [token]);

  // Fetch dropdown data on component mount
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Combined function to fetch all data
  const fetchAllData = async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setDropdownLoading(true);
    setTableLoading(true);
    setDataLoaded(false);
    setError(null);
    setApiErrors({ members: null, roles: null, institutes: null });

    try {
      // Fetch all data in parallel
      const [membersData, rolesData, institutesData, memberRolesData] =
        await Promise.all([
          getMembers(token).catch((err) => {
            console.error("Error fetching members:", err);
            setApiErrors((prev) => ({
              ...prev,
              members: err.message || "Failed to load members",
            }));
            return [];
          }),
          getRoles(token).catch((err) => {
            console.error("Error fetching roles:", err);
            setApiErrors((prev) => ({
              ...prev,
              roles: err.message || "Failed to load roles",
            }));
            return [];
          }),
          getInstitutes(token).catch((err) => {
            console.error("Error fetching institutes:", err);
            setApiErrors((prev) => ({
              ...prev,
              institutes: err.message || "Failed to load institutes",
            }));
            return [];
          }),
          getAllMemberRoles(token).catch((err) => {
            console.error("Error fetching member roles:", err);
            setError(err.message || "Failed to load member roles");
            return [];
          }),
        ]);

      // Set all data
      setMembers(Array.isArray(membersData) ? membersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setInstitutes(Array.isArray(institutesData) ? institutesData : []);

      // Filter member roles based on user type
      let filteredMemberRoles = memberRolesData;
      if (user && user.usertypeid === 2 && user.institute_id) {
        // Institute admin: filter by their institute_id
        filteredMemberRoles = memberRolesData.filter(
          (role) => role.institute_id === user.institute_id
        );
      }
      setMemberRoles(
        Array.isArray(filteredMemberRoles) ? filteredMemberRoles : []
      );

      // Log data for debugging
      console.log("Members data:", membersData);
      console.log("Member roles data:", filteredMemberRoles);
    } catch (err) {
      console.error("Unexpected error in fetchAllData:", err);
      setError("An unexpected error occurred while loading data.");
    } finally {
      setDropdownLoading(false);
      setTableLoading(false);
      setDataLoaded(true);
    }
  };

  // Filter member roles based on search term
  const filteredMemberRoles = memberRoles.filter((memberRole) => {
    const member = members.find((m) => m.id === memberRole.member_id);
    const role = roles.find((r) => r.id === memberRole.role_id);
    const institute = institutes.find((i) => i.id === memberRole.institute_id);
    return (
      getMemberName(memberRole.member_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getRoleName(memberRole.role_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getInstituteName(memberRole.institute_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      memberRole.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberRole.tenure.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMemberRoles.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredMemberRoles.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
      {/* Header with Logout */}
      <nav className="bg-white shadow-lg py-4 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide">
            KLS Resolutions
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 focus:outline-none"
        >
          Logout
        </button>
      </nav>

      <div className="flex justify-end mt-5 mr-3">
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
          <span className="font-medium text-blue-600">Home</span>
        </button>
      </div>

      <main className="flex-1 w-full flex flex-col items-center justify-start">
        <div className="max-w-6xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
              Member Role Management
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              {user?.usertypeid === 1
                ? "View all member roles and assignments"
                : "View member roles and assignments for your institute"}
            </p>
          </div>

          {/* Error message for token issues */}
          {error && (
            <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Search Bar */}
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

          {/* Member Roles Table */}
          <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase">
                      S.NO
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-48">
                      Member
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-48">
                      Role
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-32">
                      Level
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-52">
                      Institute
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase w-40">
                      Tenure
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!dataLoaded || tableLoading || dropdownLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                          <h3 className="mb-1 text-lg font-medium text-gray-900">
                            Loading data...
                          </h3>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <h3 className="mb-1 text-lg font-medium text-gray-900">
                            Error loading data
                          </h3>
                          <p className="text-gray-500">{error}</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMemberRoles.length === 0 ? (
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <h3 className="mb-1 text-lg font-medium text-gray-900">
                            {searchTerm
                              ? "No matching role assignments found"
                              : user?.usertypeid === 2
                              ? "No role assignments found for your institute"
                              : "No role assignments found"}
                          </h3>
                          <p className="text-gray-500">
                            {searchTerm
                              ? "Try adjusting your search criteria."
                              : "There are no role assignments available at this time."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((memberRole, idx) => (
                      <tr key={memberRole.id}>
                        <td className="w-16 px-6 py-4 text-sm font-medium text-center text-gray-900">
                          {indexOfFirstItem + idx + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap w-48 break-words">
                          {getMemberName(memberRole.member_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap w-48 break-words">
                          {getRoleName(memberRole.role_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap w-32">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              memberRole.level === "GC"
                                ? "bg-red-100 text-red-800"
                                : memberRole.level === "BOM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {memberRole.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap w-52 break-words">
                          {getInstituteName(memberRole.institute_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap w-40 break-words">
                          {memberRole.tenure}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredMemberRoles.length > itemsPerPage && (
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
                      {Math.min(indexOfLastItem, filteredMemberRoles.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredMemberRoles.length}
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

export default Members;
