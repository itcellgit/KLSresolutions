// pages/MemberRoleManagementPage.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { getMembers } from "../../api/members";
import { getRoles } from "../../api/roles";
import { getInstitutes } from "../../api/institutes";
import {
  assignRole,
  updateMemberRole,
  deleteMemberRole,
} from "../../api/memberRole";
import { getAllMemberRoles } from "../../api/memberRole";
import { getAllManagementTenures } from "../../api/managementTenures";

const MemberRoleManagementPage = () => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    member_id: "",
    role_id: "",
    level: "",
    institute_id: "",
    tenure_id: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);
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
  // Add state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  // State for expanded tenures
  const [expandedTenures, setExpandedTenures] = useState({});

  // State for tenure view modes (Member/Institute toggle)
  const [tenureViewModes, setTenureViewModes] = useState({});

  // State for searchable member dropdown
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const memberDropdownRef = useRef(null);

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Debug: Check if token is available
  useEffect(() => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
    }
  }, [token]);

  // Fetch dropdown data on component mount and when modal opens
  useEffect(() => {
    if (token) {
      fetchDropdownData();
      fetchMemberRoles();
    }
  }, [token]);

  // Fetch dropdown data when modal opens to ensure fresh data
  useEffect(() => {
    if (isModalOpen && token) {
      fetchDropdownData();
    }
  }, [isModalOpen, token]);

  // Close member dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target)
      ) {
        setMemberDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add function to fetch member roles
  const fetchMemberRoles = async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setTableLoading(true);
    setError(null);

    try {
      const data = await getAllMemberRoles(token);
      setMemberRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching member roles:", err);
      setError(err.message || "Failed to load member roles");
    } finally {
      setTableLoading(false);
    }
  };

  // Function to fetch dropdown data
  const fetchDropdownData = async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setDropdownLoading(true);
    setError(null);
    setApiErrors({
      members: null,
      roles: null,
      institutes: null,
      managementTenures: null,
    });

    try {
      // Fetch members
      let membersData = [];
      try {
        membersData = await getMembers(token);
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
        setInstitutes(Array.isArray(institutesData) ? institutesData : []);
      } catch (err) {
        console.error("Error fetching institutes:", err);
        setApiErrors((prev) => ({
          ...prev,
          institutes: err.message || "Failed to load institutes",
        }));
      }

      // Fetch management tenures
      let managementTenuresData = [];
      try {
        managementTenuresData = await getAllManagementTenures(token);
        setManagementTenures(
          Array.isArray(managementTenuresData) ? managementTenuresData : []
        );
      } catch (err) {
        console.error("Error fetching management tenures:", err);
        setApiErrors((prev) => ({
          ...prev,
          managementTenures: err.message || "Failed to load management tenures",
        }));
      }

      // Check if all API calls failed
      if (
        !membersData.length &&
        !rolesData.length &&
        !institutesData.length &&
        !managementTenuresData.length
      ) {
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

  // Handle member selection from dropdown
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData((prev) => ({
      ...prev,
      member_id: member.id.toString(),
    }));
    setMemberDropdownOpen(false);
    setMemberSearchTerm("");
  };

  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const memberName =
      member.name || member.full_name || member.email || "Unknown";
    return memberName.toLowerCase().includes(memberSearchTerm.toLowerCase());
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.member_id ||
      !formData.role_id ||
      !formData.level ||
      !formData.tenure_id
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

      if (editingId) {
        // Update existing member role
        await updateMemberRole(editingId, payload, token);
        alert("Role updated successfully");
      } else {
        // Create new member role
        await assignRole(payload, token);
        alert("Role assigned successfully");
      }

      // Reset form and close modal
      setFormData({
        member_id: "",
        role_id: "",
        level: "",
        institute_id: "",
        tenure_id: "",
      });
      setEditingId(null);
      setIsModalOpen(false);
      setSelectedMember(null);
      setMemberSearchTerm("");

      // Refresh the member roles list
      fetchMemberRoles();
    } catch (err) {
      setError(err.message || "Failed to save role assignment");
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (memberRole) => {
    // Find the selected member for editing
    const member = members.find((m) => m.id === memberRole.member_id);
    setSelectedMember(member);

    // Set form data with current member role values
    setFormData({
      member_id: memberRole.member_id?.toString() || "",
      role_id: memberRole.role_id?.toString() || "",
      level: memberRole.level || "",
      institute_id: memberRole.institute_id?.toString() || "",
      tenure_id: memberRole.tenure_id?.toString() || "",
    });

    // Set editing ID
    setEditingId(memberRole.id);

    // Open modal
    setIsModalOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (id) => {
    const memberRole = memberRoles.find((mr) => mr.id === id);
    if (memberRole) {
      const memberName = getMemberName(memberRole.member_id);
      const roleName = getRoleName(memberRole.role_id);

      setDeleteConfirmation({
        isOpen: true,
        id: id,
        name: `${memberName} - ${roleName}`,
      });
    }
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return;

    setLoading(true);
    setError(null);

    try {
      await deleteMemberRole(deleteConfirmation.id, token);
      alert("Role assignment deleted successfully");

      // Refresh the member roles list
      fetchMemberRoles();
    } catch (err) {
      setError(err.message || "Failed to delete role assignment");
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setDeleteConfirmation({ isOpen: false, id: null, name: "" });
    }
  };

  // Cancel delete action
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, id: null, name: "" });
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        member_id: "",
        role_id: "",
        level: "",
        institute_id: "",
        tenure_id: "",
      });
      setEditingId(null);
      setSelectedMember(null);
      setMemberSearchTerm("");
      setMemberDropdownOpen(false);
    }
  }, [isModalOpen]);

  // Toggle tenure accordion - only one can be open at a time
  const toggleTenure = (tenure) => {
    setExpandedTenures((prev) => {
      // If the clicked tenure is already expanded, close it
      if (prev[tenure]) {
        return {};
      }
      // Otherwise, close all others and open the clicked one
      return { [tenure]: true };
    });
  };

  // Toggle view mode for a specific tenure
  const toggleTenureViewMode = (tenure) => {
    setTenureViewModes((prev) => ({
      ...prev,
      [tenure]: prev[tenure] === "institute" ? "member" : "institute",
    }));
  };

  // Get current view mode for a tenure (default is 'member')
  const getTenureViewMode = (tenure) => {
    return tenureViewModes[tenure] || "member";
  };

  // Helper function to get role priority for "Karnatak Law Society" (Not Assigned) institutes
  const getRolePriorityForKLS = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    const roleName = role
      ? (role.role_name || role.name || role.title || "").toLowerCase()
      : "";

    // Define role hierarchy for Karnatak Law Society (lower number = higher priority)
    if (roleName.includes("president") && !roleName.includes("vice")) {
      return 1; // President
    } else if (roleName.includes("vice") && roleName.includes("president")) {
      return 2; // Vice President
    } else if (roleName.includes("chairman")) {
      return 3; // Chairman
    } else if (roleName.includes("secretary")) {
      return 4; // Secretary
    } else if (roleName.includes("member")) {
      return 5; // Member
    } else {
      return 6; // Other roles
    }
  };

  // Helper function to get role priority for other institutes
  const getRolePriorityForOtherInstitutes = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    const roleName = role
      ? (role.role_name || role.name || role.title || "").toLowerCase()
      : "";

    // Define role hierarchy for other institutes (lower number = higher priority)
    if (roleName.includes("chairman")) {
      return 1; // Chairman
    } else if (roleName.includes("member")) {
      return 2; // Member
    } else {
      return 3; // Other roles
    }
  };

  // Helper function to get member name by ID
  const getMemberName = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    return member
      ? member.name || member.full_name || member.email || "Unknown"
      : "Unknown Member";
  };

  // Helper function to get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role
      ? role.role_name || role.name || role.title || "Unknown"
      : "Unknown Role";
  };

  // Helper function to get institute name by ID
  const getInstituteName = (instituteId) => {
    if (!instituteId) return "KLS Board";
    const institute = institutes.find((i) => i.id === instituteId);
    return institute
      ? institute.name || institute.institute_name || "Unknown"
      : "Unknown Institute";
  };

  // Process rows for tenure view (grouped by member)
  const processRowsForTenure = (roles) => {
    // Group by member first
    const memberGroups = {};
    roles.forEach((role) => {
      const memberId = role.member_id;
      if (!memberGroups[memberId]) {
        memberGroups[memberId] = [];
      }
      memberGroups[memberId].push(role);
    });

    // Sort members by role priority
    const sortedMembers = Object.keys(memberGroups).sort((a, b) => {
      const memberARoles = memberGroups[a];
      const memberBRoles = memberGroups[b];

      // Get highest priority role for each member
      const memberAPriority = Math.min(
        ...memberARoles.map((role) => {
          return !role.institute_id
            ? getRolePriorityForKLS(role.role_id)
            : getRolePriorityForOtherInstitutes(role.role_id);
        })
      );

      const memberBPriority = Math.min(
        ...memberBRoles.map((role) => {
          return !role.institute_id
            ? getRolePriorityForKLS(role.role_id)
            : getRolePriorityForOtherInstitutes(role.role_id);
        })
      );

      return memberAPriority - memberBPriority;
    });

    // Create rows with proper rowspan
    const processedRows = [];
    sortedMembers.forEach((memberId) => {
      const memberRoles = memberGroups[memberId];

      // Sort roles within member group
      memberRoles.sort((a, b) => {
        const priorityA = !a.institute_id
          ? getRolePriorityForKLS(a.role_id)
          : getRolePriorityForOtherInstitutes(a.role_id);
        const priorityB = !b.institute_id
          ? getRolePriorityForKLS(b.role_id)
          : getRolePriorityForOtherInstitutes(b.role_id);
        return priorityA - priorityB;
      });

      memberRoles.forEach((role, index) => {
        processedRows.push({
          ...role,
          rowSpan: index === 0 ? memberRoles.length : 0, // First row gets rowspan, others get 0
        });
      });
    });

    return processedRows;
  };

  // Process rows for institute view (grouped by institute)
  const processRowsForInstituteView = (roles) => {
    // Group by institute first
    const instituteGroups = {};
    roles.forEach((role) => {
      const instituteKey = role.institute_id || "kls_board";
      const instituteName = getInstituteName(role.institute_id);

      if (!instituteGroups[instituteKey]) {
        instituteGroups[instituteKey] = {
          instituteName,
          roles: [],
        };
      }
      instituteGroups[instituteKey].roles.push(role);
    });

    // Sort institutes (KLS Board first, then alphabetically)
    const sortedInstitutes = Object.entries(instituteGroups).sort(
      ([keyA, groupA], [keyB, groupB]) => {
        if (keyA === "kls_board") return -1;
        if (keyB === "kls_board") return 1;
        return groupA.instituteName.localeCompare(groupB.instituteName);
      }
    );

    const processedRows = [];

    sortedInstitutes.forEach(([instituteKey, group]) => {
      // Add institute header row
      const uniqueMembers = new Set(group.roles.map((role) => role.member_id));
      const uniqueRoles = new Set(group.roles.map((role) => role.role_id));

      processedRows.push({
        isInstituteHeader: true,
        instituteName: group.instituteName,
        memberCount: uniqueMembers.size,
        roleCount: uniqueRoles.size,
      });

      // Sort roles within institute
      const sortedRoles = group.roles.sort((a, b) => {
        // Sort by member name first, then by role priority
        const memberAName = getMemberName(a.member_id);
        const memberBName = getMemberName(b.member_id);

        if (memberAName !== memberBName) {
          return memberAName.localeCompare(memberBName);
        }

        // Same member, sort by role priority
        const priorityA = !a.institute_id
          ? getRolePriorityForKLS(a.role_id)
          : getRolePriorityForOtherInstitutes(a.role_id);
        const priorityB = !b.institute_id
          ? getRolePriorityForKLS(b.role_id)
          : getRolePriorityForOtherInstitutes(b.role_id);

        return priorityA - priorityB;
      });

      // Add role rows
      sortedRoles.forEach((role) => {
        processedRows.push({
          ...role,
          rowSpan: 1, // In institute view, each row is separate
        });
      });
    });

    return processedRows;
  };

  // Filter member roles based on search term
  const filteredAndSearched = useMemo(() => {
    if (!memberRoles || memberRoles.length === 0) {
      return [];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();

    if (!searchTermLower) {
      return memberRoles;
    }

    return memberRoles.filter((memberRole) => {
      try {
        // Safely extract member information
        const member = memberRole.Member || {};
        const role = memberRole.Role || {};
        const institute = memberRole.Institute || {};
        const managementTenure = memberRole.managementTenure || {};

        // Build searchable strings safely. If the joined managementTenure isn't
        // present, fall back to any `tenure` field on memberRole or use the
        // numeric `tenure_id` so the UI has something to display.
        const memberName =
          member.name || member.full_name || member.email || "Unknown";
        const roleName = role.role_name || role.name || role.title || "Unknown";
        const instituteName =
          institute.name || institute.institute_name || "KLS Board";
        // Try joined object first; if missing, lookup by tenure_id from fetched list
        const tenureFromList =
          managementTenures && managementTenures.length
            ? managementTenures.find(
                (t) => String(t.id) === String(memberRole.tenure_id)
              )
            : null;

        const tenureName =
          managementTenure.tenure ||
          memberRole.tenure ||
          (tenureFromList
            ? tenureFromList.tenure
            : memberRole.tenure_id
            ? String(memberRole.tenure_id)
            : "No Tenure");
        const level = memberRole.level || "";

        // Create searchable text
        const searchableText = [
          memberName,
          roleName,
          instituteName,
          tenureName,
          level,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchTermLower);
      } catch (error) {
        console.error("Error filtering member role:", error, memberRole);
        return false;
      }
    });
  }, [memberRoles, searchTerm, members, roles, institutes, managementTenures]); // Added dependencies

  // Fix the grouping logic
  const groupedByTenure = useMemo(() => {
    if (!filteredAndSearched || filteredAndSearched.length === 0) {
      return {};
    }

    const grouped = {};

    filteredAndSearched.forEach((memberRole) => {
      try {
        // Safely get tenure information for grouping. Use managementTenure.tenure
        // if available, otherwise fall back to memberRole.tenure or tenure_id.
        const managementTenure = memberRole.managementTenure || {};
        const tenureFromList =
          managementTenures && managementTenures.length
            ? managementTenures.find(
                (t) => String(t.id) === String(memberRole.tenure_id)
              )
            : null;
        const tenureKey =
          managementTenure.tenure ||
          memberRole.tenure ||
          (tenureFromList
            ? tenureFromList.tenure
            : memberRole.tenure_id
            ? String(memberRole.tenure_id)
            : "No Tenure");

        if (!grouped[tenureKey]) {
          grouped[tenureKey] = [];
        }
        grouped[tenureKey].push(memberRole);
      } catch (error) {
        console.error("Error grouping member role:", error, memberRole);
      }
    });

    return grouped;
  }, [filteredAndSearched, managementTenures]);

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

        {/* Tenure Accordion */}
        <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
          {tableLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-10 h-10 mb-4 text-indigo-600 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h3 className="mb-1 text-lg font-medium text-gray-900">
                Loading role assignments...
              </h3>
            </div>
          ) : Object.keys(groupedByTenure).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
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
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedByTenure)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort tenures in descending order
                .map(([tenure, roles]) => {
                  const viewMode = getTenureViewMode(tenure);
                  const processedRows =
                    viewMode === "institute"
                      ? processRowsForInstituteView(roles)
                      : processRowsForTenure(roles);
                  return (
                    <div
                      key={tenure}
                      className="transition-all duration-200 ease-in-out"
                    >
                      <button
                        className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => toggleTenure(tenure)}
                      >
                        <div className="flex items-center">
                          <svg
                            className={`w-5 h-5 mr-3 text-indigo-600 transform transition-transform duration-200 ${
                              expandedTenures[tenure] ? "rotate-90" : ""
                            }`}
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
                          <span className="text-lg font-medium text-gray-900">
                            {tenure}
                          </span>
                          <span className="px-2 py-1 ml-3 text-xs font-medium text-indigo-800 bg-indigo-100 rounded-full">
                            {roles.length}{" "}
                            {roles.length === 1 ? "Assignment" : "Assignments"}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                            expandedTenures[tenure] ? "rotate-180" : ""
                          }`}
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
                      </button>

                      {/* Toggle Button for Member/Institute View - Only show when tenure is expanded */}
                      {expandedTenures[tenure] && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              View Mode:
                            </span>
                            <div className="flex items-center p-1 bg-white border border-gray-300 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (getTenureViewMode(tenure) !== "member") {
                                    toggleTenureViewMode(tenure);
                                  }
                                }}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                                  getTenureViewMode(tenure) === "member"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                              >
                                Member
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    getTenureViewMode(tenure) !== "institute"
                                  ) {
                                    toggleTenureViewMode(tenure);
                                  }
                                }}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                                  getTenureViewMode(tenure) === "institute"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                              >
                                Institute
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedTenures[tenure] && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                  Member
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                  Role
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                  Level
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                  Institute
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                  Status
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase"
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {processedRows.map((row, index) => {
                                // Handle institute header rows
                                if (row.isInstituteHeader) {
                                  return (
                                    <tr
                                      key={`institute-${row.instituteName}-${index}`}
                                      className="bg-blue-50"
                                    >
                                      <td
                                        colSpan="6"
                                        className="px-6 py-3 text-sm font-semibold text-blue-800"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-5 h-5 mr-2 text-blue-600"
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
                                            <span>{row.instituteName}</span>
                                          </div>
                                          <div className="flex space-x-2">
                                            <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                              {row.memberCount}{" "}
                                              {row.memberCount === 1
                                                ? "Member"
                                                : "Members"}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                              {row.roleCount}{" "}
                                              {row.roleCount === 1
                                                ? "Role"
                                                : "Roles"}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                // Handle regular member role rows
                                return (
                                  <tr key={row.id}>
                                    {row.rowSpan > 0 ? (
                                      <td
                                        rowSpan={row.rowSpan}
                                        className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap"
                                      >
                                        {getMemberName(row.member_id)}
                                      </td>
                                    ) : null}
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                      {getRoleName(row.role_id)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          row.level === "GC"
                                            ? "bg-red-100 text-red-800"
                                            : row.level === "BOM"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {row.level}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                      {getInstituteName(row.institute_id)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          (row.status || "").toLowerCase() ===
                                          "active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {row.status ? row.status : "-"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                      <button
                                        onClick={() => handleEdit(row)}
                                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteClick(row.id)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
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
                          {/* Searchable Member Dropdown */}
                          <div className="relative" ref={memberDropdownRef}>
                            <div
                              className="block w-full py-3 pl-4 pr-10 bg-white border border-gray-300 rounded-lg cursor-pointer focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              onClick={() =>
                                setMemberDropdownOpen(!memberDropdownOpen)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={
                                    selectedMember
                                      ? "text-gray-900"
                                      : "text-gray-500"
                                  }
                                >
                                  {selectedMember
                                    ? selectedMember.name ||
                                      selectedMember.full_name ||
                                      selectedMember.email ||
                                      "Unknown"
                                    : "Select a member"}
                                </span>
                                <svg
                                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                                    memberDropdownOpen ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
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

                            {memberDropdownOpen && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
                                <div className="p-2 border-b border-gray-200">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder="Search members..."
                                      value={memberSearchTerm}
                                      onChange={(e) =>
                                        setMemberSearchTerm(e.target.value)
                                      }
                                      className="w-full py-2 pl-8 pr-4 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                      autoFocus
                                    />
                                    <svg
                                      className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                                <div className="overflow-y-auto max-h-48">
                                  {filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => (
                                      <div
                                        key={member.id}
                                        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                          handleMemberSelect(member)
                                        }
                                      >
                                        <div className="font-medium text-gray-900">
                                          {member.name ||
                                            member.full_name ||
                                            member.email ||
                                            "Unknown"}
                                        </div>
                                        {member.email &&
                                          (member.name || member.full_name) && (
                                            <div className="text-xs text-gray-500">
                                              {member.email}
                                            </div>
                                          )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                      No members found
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
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

                  <div className="grid gap-2 space-y-2 lg:grid-cols-2 lg:space-y-0">
                    <div className="mb-6">
                      <label
                        htmlFor="tenure_id"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Tenure
                      </label>
                      <select
                        id="tenure_id"
                        name="tenure_id"
                        value={formData.tenure_id}
                        onChange={handleInputChange}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Select Tenure</option>
                        {managementTenures.map((tenure) => (
                          <option key={tenure.id} value={tenure.id}>
                            {tenure.tenure} ({tenure.start_date})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
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
                        disabled={loading || dropdownLoading || !selectedMember}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
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
              onClick={cancelDelete}
            ></div>

            {/* Modal container */}
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-medium leading-6 text-white"
                    id="modal-title"
                  >
                    Confirm Deletion
                  </h3>
                  <button
                    type="button"
                    className="text-white hover:text-gray-200 focus:outline-none"
                    onClick={cancelDelete}
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
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-12 h-12 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Delete Role Assignment
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the role assignment for{" "}
                        <span className="font-medium text-gray-900">
                          {deleteConfirmation.name}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberRoleManagementPage;
