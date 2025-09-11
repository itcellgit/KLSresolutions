// pages/MemberRoleManagementPage.js
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getMembers } from "../../api/members";
import { getRoles } from "../../api/roles";
import { getInstitutes } from "../../api/institutes";
import { assignRole } from "../../api/memberRole";

const MemberRoleManagementPage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    member_id: "",
    role_id: "",
    level: "",
    institute_id: "",
    tenure: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);
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

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Debug: Check if token is available
  useEffect(() => {
    //console.log("Token available:", !!token);
    if (!token) {
      setError("Authentication token not found. Please log in again.");
    }
  }, [token]);

  // Fetch dropdown data on component mount and when modal opens
  useEffect(() => {
    if (token) {
      fetchDropdownData();
    }
  }, [token]);

  // Fetch dropdown data when modal opens to ensure fresh data
  useEffect(() => {
    if (isModalOpen && token) {
      fetchDropdownData();
    }
  }, [isModalOpen, token]);

  // Function to fetch dropdown data
  const fetchDropdownData = async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setDropdownLoading(true);
    setError(null);
    setApiErrors({ members: null, roles: null, institutes: null });

    try {
      //console.log("Fetching dropdown data...");
      // Fetch members
      let membersData = [];
      try {
        membersData = await getMembers(token);
        //console.log("Members API response:", membersData);
        setMembers(Array.isArray(membersData) ? membersData : []);
      } catch (err) {
        console.error("Error fetching members:", err);
        setApiErrors((prev) => ({
          ...prev,
          members: err.message || "Failed to load members",
        }));
      }

      // Fetch roles
      let rolesData = [];
      try {
        rolesData = await getRoles(token);
        //console.log("Roles API response:", rolesData);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (err) {
        console.error("Error fetching roles:", err);
        setApiErrors((prev) => ({
          ...prev,
          roles: err.message || "Failed to load roles",
        }));
      }

      // Fetch institutes
      let institutesData = [];
      try {
        institutesData = await getInstitutes(token);
        //console.log("Institutes API response:", institutesData);
        setInstitutes(Array.isArray(institutesData) ? institutesData : []);
      } catch (err) {
        console.error("Error fetching institutes:", err);
        setApiErrors((prev) => ({
          ...prev,
          institutes: err.message || "Failed to load institutes",
        }));
      }

      // Check if all API calls failed
      if (!membersData.length && !rolesData.length && !institutesData.length) {
        setError(
          "Failed to load any dropdown data. Please check your connection and try again."
        );
      }
    } catch (err) {
      console.error("Unexpected error in fetchDropdownData:", err);
      setError("An unexpected error occurred while loading dropdown data.");
    } finally {
      setDropdownLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.member_id ||
      !formData.role_id ||
      !formData.level ||
      !formData.tenure
    ) {
      alert("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // If institute_id is empty, treat as KLS Board assignment
      const payload = {
        ...formData,
        institute_id: formData.institute_id || null,
        status: "active",
      };

      await assignRole(payload, token);
      alert("Role assigned successfully");
      setFormData({
        member_id: "",
        role_id: "",
        level: "",
        institute_id: "",
        tenure: "",
      });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to assign role");
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (memberRole) => {
    // Placeholder for backend integration
    console.log("Edit member role:", memberRole);
    alert("Edit functionality will be implemented with backend integration");
  };

  // Handle delete button click
  const handleDelete = (id) => {
    // Placeholder for backend integration
    console.log("Delete member role:", id);
    alert("Delete functionality will be implemented with backend integration");
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        member_id: "",
        role_id: "",
        level: "",
        institute_id: "",
        tenure: "",
      });
      setEditingId(null);
    }
  }, [isModalOpen]);

  // Filter member roles based on search term
  const filteredMemberRoles = memberRoles.filter((memberRole) => {
    const member = members.find((m) => m.id === memberRole.member_id);
    const role = roles.find((r) => r.id === memberRole.role_id);
    const institute = institutes.find((i) => i.id === memberRole.institute_id);
    return (
      member?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role?.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberRole.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberRole.tenure.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Helper function to get member name by id
  const getMemberName = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    return member
      ? member.name || member.full_name || member.email || "Unknown"
      : "Unknown";
  };

  // Helper function to get role name by id
  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role
      ? role.role_name || role.name || role.title || "Unknown"
      : "Unknown";
  };

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find((i) => i.id === instituteId);
    return institute
      ? institute.name || institute.institute_name || "Unknown"
      : "Not Assigned";
  };

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Member Role Management
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and assign roles to members at specific institutes
          </p>
        </div>

        {/* Error message for token issues */}
        {error && !isModalOpen && (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Assignments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {memberRoles.length}
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
                  Active Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.length}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Institutes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {institutes.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center w-full px-6 py-3 font-medium text-white transition-all duration-300 transform rounded-lg shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 hover:scale-105 sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Assign New Role
          </button>
        </div>

        {/* Member Roles Table */}
        <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Member
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Level
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Institute
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Tenure
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-right text-gray-500 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMemberRoles.length === 0 ? (
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <h3 className="mb-1 text-lg font-medium text-gray-900">
                          No role assignments found
                        </h3>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMemberRoles.map((memberRole) => (
                    <tr key={memberRole.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {memberRole.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {getMemberName(memberRole.member_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {getRoleName(memberRole.role_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
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
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {getInstituteName(memberRole.institute_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {memberRole.tenure}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(memberRole)}
                          className="mr-3 text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(memberRole.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Member Role Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                aria-hidden="true"
                onClick={() => setIsModalOpen(false)}
              ></div>

              {/* Modal container */}
              <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-medium leading-6 text-white"
                      id="modal-title"
                    >
                      {editingId ? "Edit Role Assignment" : "Assign New Role"}
                    </h3>
                    <button
                      type="button"
                      className="text-white hover:text-gray-200 focus:outline-none"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <svg
                        className="w-6 h-6"
                        xmlns="http://www.w3.org/2000/svg"
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
                </div>

                <div className="px-6 py-5 bg-white">
                  {/* Error message */}
                  {error && (
                    <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
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
                  {/* API-specific errors */}
                  {(apiErrors.members ||
                    apiErrors.roles ||
                    apiErrors.institutes) && (
                    <div className="p-3 mb-4 text-yellow-700 bg-yellow-100 rounded-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 mr-2 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          ></path>
                        </svg>
                        <div>
                          <p className="font-medium">
                            Some data couldn't be loaded:
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-2 space-y-2 lg:grid-cols-2 lg:space-y-0">
                      <div className="mb-4">
                        <label
                          htmlFor="member_id"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Member
                        </label>
                        {dropdownLoading ? (
                          <div className="py-2 text-center text-gray-500">
                            Loading members...
                          </div>
                        ) : (
                          <>
                            <select
                              id="member_id"
                              name="member_id"
                              value={formData.member_id}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                            >
                              <option value="">Select a member</option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name ||
                                    member.full_name ||
                                    member.email ||
                                    "Unknown"}
                                </option>
                              ))}
                            </select>
                            {apiErrors.members && (
                              <p className="mt-1 text-xs text-red-600">
                                {apiErrors.members}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="role_id"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Role
                        </label>
                        {dropdownLoading ? (
                          <div className="py-2 text-center text-gray-500">
                            Loading roles...
                          </div>
                        ) : (
                          <>
                            <select
                              id="role_id"
                              name="role_id"
                              value={formData.role_id}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              required
                            >
                              <option value="">Select a role</option>
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.role_name ||
                                    role.name ||
                                    role.title ||
                                    "Unknown"}
                                </option>
                              ))}
                            </select>
                            {apiErrors.roles && (
                              <p className="mt-1 text-xs text-red-600">
                                {apiErrors.roles}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 space-y-2 lg:grid-cols-2 lg:space-y-0">
                      <div className="mb-4">
                        <label
                          htmlFor="level"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Level
                        </label>
                        <select
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select level</option>
                          <option value="GC">GC</option>
                          <option value="BOM">BOM</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label
                          htmlFor="institute_id"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Institute
                        </label>
                        {dropdownLoading ? (
                          <div className="py-2 text-center text-gray-500">
                            Loading institutes...
                          </div>
                        ) : (
                          <>
                            <select
                              id="institute_id"
                              name="institute_id"
                              value={formData.institute_id}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="">KLS Board (No Institute)</option>
                              {institutes.map((institute) => (
                                <option key={institute.id} value={institute.id}>
                                  {institute.name ||
                                    institute.institute_name ||
                                    "Unknown"}
                                </option>
                              ))}
                            </select>
                            {apiErrors.institutes && (
                              <p className="mt-1 text-xs text-red-600">
                                {apiErrors.institutes}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* <div className="grid gap-2 space-y-2 lg:grid-cols-2 lg:space-y-0">
                      <div className="mb-6">
                        <label
                          htmlFor="tenure"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Tenure
                        </label>
                        <input
                          type="text"
                          id="tenure"
                          name="tenure"
                          value={formData.tenure}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., 2020-2025"
                          maxLength="128"
                          required
                        />
                      </div>
                    </div> */}

                    <div className="grid gap-2 space-y-2 lg:grid-cols-2 lg:space-y-0">
                      <div className="mb-6">
                        <label
                          htmlFor="tenure"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Tenure
                        </label>
                        <select
                          id="tenure"
                          name="tenure"
                          value={formData.tenure}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Tenure</option>
                          {Array.from({ length: 6 }, (_, i) => {
                            const start = 2021 + i;
                            const end = start + 2;
                            return (
                              <option key={start} value={`${start}-${end}`}>
                                {start}-{end}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="inline-flex justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || dropdownLoading}
                          className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {loading
                            ? "Processing..."
                            : editingId
                            ? "Update Assignment"
                            : "Assign Role"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberRoleManagementPage;
