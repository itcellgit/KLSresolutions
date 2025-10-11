import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMembers } from "../api/members";
import { getRoles } from "../api/roles";
import { getInstitutes } from "../api/institutes";
import { getAllMemberRoles } from "../api/memberRole";
import { getAllManagementTenures } from "../api/managementTenures";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";

const Members = () => {
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for dropdown data
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [managementTenures, setManagementTenures] = useState([]);
  // State for member roles
  const [memberRoles, setMemberRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({
    members: null,
    roles: null,
    institutes: null,
    managementTenures: null,
  });
  // Add state for table loading
  const [tableLoading, setTableLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  // Add state to track if data is fully loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  // Add state for tenure filter
  const [selectedTenureId, setSelectedTenureId] = useState("");
  const [currentTenure, setCurrentTenure] = useState(null);

  // Get token and user info from Redux
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Ref to track logged missing members to avoid console spam
  const loggedMissingMembers = useRef(new Set());

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

  // Helper function to get tenure name by id
  const getTenureName = (tenureId) => {
    const tenure = managementTenures.find((t) => t.id === tenureId);
    if (!tenure) return "Not Assigned";
    return tenure.tenure || "Unknown";
  };

  // Function to find current tenure (latest active tenure)
  const findCurrentTenure = (tenures) => {
    if (!Array.isArray(tenures) || tenures.length === 0) return null;

    const currentDate = new Date();

    // First, try to find an active tenure that covers current date
    const activeTenure = tenures.find((tenure) => {
      if (tenure.start_date && tenure.end_date) {
        const startDate = new Date(tenure.start_date);
        const endDate = new Date(tenure.end_date);
        return currentDate >= startDate && currentDate <= endDate;
      }
      return false;
    });

    if (activeTenure) return activeTenure;

    // If no active tenure found, return the most recent one
    return tenures.sort((a, b) => {
      const dateA = new Date(a.start_date || a.created_at || 0);
      const dateB = new Date(b.start_date || b.created_at || 0);
      return dateB - dateA;
    })[0];
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

  // Set current tenure as default when management tenures are loaded
  useEffect(() => {
    if (managementTenures.length > 0 && !selectedTenureId) {
      const current = findCurrentTenure(managementTenures);
      if (current) {
        setCurrentTenure(current);
        setSelectedTenureId(current.id.toString());
      }
    }
  }, [managementTenures, selectedTenureId]);

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
    setApiErrors({
      members: null,
      roles: null,
      institutes: null,
      managementTenures: null,
    });

    try {
      // Fetch all data in parallel
      const [
        membersData,
        rolesData,
        institutesData,
        memberRolesData,
        managementTenuresData,
      ] = await Promise.all([
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
        getAllManagementTenures(token).catch((err) => {
          console.error("Error fetching management tenures:", err);
          setApiErrors((prev) => ({
            ...prev,
            managementTenures:
              err.message || "Failed to load management tenures",
          }));
          return [];
        }),
      ]);

      // Set all data
      setMembers(Array.isArray(membersData) ? membersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setInstitutes(Array.isArray(institutesData) ? institutesData : []);
      setManagementTenures(
        Array.isArray(managementTenuresData) ? managementTenuresData : []
      );

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
      console.log("Management tenures data:", managementTenuresData);
    } catch (err) {
      console.error("Unexpected error in fetchAllData:", err);
      setError("An unexpected error occurred while loading data.");
    } finally {
      setDropdownLoading(false);
      setTableLoading(false);
      setDataLoaded(true);
    }
  };

  // Filter member roles based on search term and selected tenure
  const filteredMemberRoles = memberRoles.filter((memberRole) => {
    const member = members.find((m) => m.id === memberRole.member_id);
    const role = roles.find((r) => r.id === memberRole.role_id);
    const institute = institutes.find((i) => i.id === memberRole.institute_id);
    const tenureName = getTenureName(memberRole.tenure_id);

    // Filter by tenure if selected
    const matchesTenure =
      !selectedTenureId ||
      selectedTenureId === "all" ||
      memberRole.tenure_id?.toString() === selectedTenureId;

    // Filter by search term
    const matchesSearch =
      !searchTerm ||
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
      tenureName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTenure && matchesSearch;
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

  // Handle tenure filter change
  const handleTenureChange = (e) => {
    setSelectedTenureId(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  return (
    <>
      <Header />
      <DashboardLayout>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          {/* Enhanced Breadcrumb Navigation */}
          <div className="w-full px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mx-auto max-w-7xl">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={goToDashboard}
                  className="flex items-center px-3 py-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-indigo-700 hover:bg-indigo-50"
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
                  Member Role Management
                </span>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full bg-gray-50">
            <div className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {/* Enhanced Header Section */}
              <div className="mb-10">
                <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text">
                      Member Role Management System
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg leading-relaxed text-gray-600">
                      Comprehensive management system for member roles,
                      assignments, and tenure tracking across institutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
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
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Total Member Roles
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {filteredMemberRoles.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Governing Council
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {
                          filteredMemberRoles.filter(
                            (role) => role.level === "GC"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
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
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Board of Management
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {
                          filteredMemberRoles.filter(
                            (role) => role.level === "BOM"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Bar and Filters */}
              <div className="p-6 mb-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
                  <div className="flex flex-col items-start w-full gap-4 sm:flex-row lg:w-auto">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="Search by member, role, institute, level or tenure..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full py-3 pl-12 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute w-5 h-5 text-gray-400 left-4 top-4"
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

                    {/* Tenure Filter Dropdown */}
                    <div className="relative w-full sm:w-64">
                      <select
                        value={selectedTenureId}
                        onChange={handleTenureChange}
                        className="w-full py-3 pl-4 pr-10 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none"
                      >
                        <option value="">All Tenures</option>
                        {managementTenures.map((tenure) => (
                          <option key={tenure.id} value={tenure.id.toString()}>
                            {tenure.tenure}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="absolute w-5 h-5 text-gray-400 pointer-events-none right-3 top-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
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

              {/* Enhanced Member Roles Table */}
              <div className="mb-10 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="w-16 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          S.No
                        </th>
                        <th className="w-48 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          Member
                        </th>
                        <th className="w-48 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          Role
                        </th>
                        <th className="w-32 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
                          Level
                        </th>
                        <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200 w-52">
                          Institute
                        </th>
                        <th className="w-40 px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-700 uppercase border-b-2 border-gray-200">
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
                                Loading member roles...
                              </h3>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <h3 className="mb-1 text-lg font-medium text-gray-900">
                                Error loading member roles
                              </h3>
                              <p className="text-gray-500">{error}</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredMemberRoles.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              </div>
                              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                                {searchTerm || selectedTenureId
                                  ? "No matching member roles found"
                                  : user?.usertypeid === 2
                                  ? "No member roles found for your institute"
                                  : "No member roles found"}
                              </h3>
                              <p className="max-w-md mb-6 text-center text-gray-600">
                                {searchTerm || selectedTenureId
                                  ? `No member roles match your current filters. Try adjusting your search terms or tenure selection.`
                                  : "There are no member roles available at this time."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((memberRole, idx) => (
                          <tr
                            key={memberRole.id}
                            className="transition-colors duration-150 hover:bg-gray-50"
                          >
                            <td className="w-16 px-6 py-5 text-sm font-semibold text-center text-indigo-600">
                              {indexOfFirstItem + idx + 1}
                            </td>
                            <td className="w-48 px-6 py-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {getMemberName(memberRole.member_id)}
                            </td>
                            <td className="w-48 px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                              {getRoleName(memberRole.role_id)}
                            </td>
                            <td className="w-32 px-6 py-5 text-sm text-center whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap w-52">
                              {getInstituteName(memberRole.institute_id)}
                            </td>
                            <td className="w-40 px-6 py-5 text-sm text-gray-700 whitespace-nowrap">
                              {getTenureName(memberRole.tenure_id)}
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
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 shadow-md rounded-b-xl">
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
                          {Math.min(
                            indexOfLastItem,
                            filteredMemberRoles.length
                          )}
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

export default Members;
