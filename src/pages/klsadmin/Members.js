import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from "../../api/members";
import { useSelector } from "react-redux";

const Members = () => {
  // State for managing members
  const [members, setMembers] = useState([]);
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to track if we're editing or adding
  const [isEditing, setIsEditing] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    changePassword: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Fetch members from backend
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers(token);
      setMembers(data);
    } catch (err) {
      setError(err.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset form and close modal
  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      phone: "",
      address: "",
      username: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      changePassword: false,
    });
    setIsModalOpen(false);
    setIsEditing(false);
  };

  // Open modal for adding a new member
  const openAddModal = () => {
    setFormData({
      id: null,
      name: "",
      phone: "",
      address: "",
      username: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      changePassword: false,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing a member - FIXED to extract username from nested user object
  const openEditModal = (member) => {
    setFormData({
      id: member.id,
      name: member.name,
      phone: member.phone,
      address: member.address,
      username: member.user.username, // Extract username from nested user object
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      changePassword: false,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Handle form submission (both add and edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.username.trim()
    ) {
      alert("Please fill all required fields: name, phone, username");
      return;
    }

    // Password validation
    if (!isEditing) {
      // For new members, password is required
      if (!formData.password.trim()) {
        alert("Password is required for new members");
        return;
      }
      // Check if passwords match
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    } else {
      // For editing, password is only required if changePassword is checked
      if (formData.changePassword) {
        if (!formData.password.trim()) {
          alert("Please enter a new password");
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match");
          return;
        }
      }
    }

    try {
      if (isEditing) {
        // Update existing member
        const updateData = { ...formData };
        // Only include password in update if changePassword is checked
        if (!updateData.changePassword) {
          delete updateData.password;
        }
        delete updateData.confirmPassword;
        delete updateData.changePassword;
        delete updateData.showPassword;
        delete updateData.showConfirmPassword;

        await updateMember(formData.id, updateData, token);
        // Update local state
        setMembers(
          members.map((member) =>
            member.id === formData.id
              ? { ...formData, user: { username: formData.username } }
              : member
          )
        );
      } else {
        // Create new member
        const createData = { ...formData };
        delete createData.confirmPassword;
        delete createData.changePassword;
        delete createData.showPassword;
        delete createData.showConfirmPassword;
        // alert("Member.js in klsadmin 186");
        const newMember = await createMember(createData, token);
        // Add to members list
        setMembers([...members, newMember]);
      }
      // Reset form and close modal
      resetForm();
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle member deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        await deleteMember(id, token);
        // Update local state
        setMembers(members.filter((member) => member.id !== id));
      } catch (err) {
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone &&
        member.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.address &&
        member.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.username &&
        member.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.user &&
        member.user.username &&
        member.user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fetch members when component mounts
  useEffect(() => {
    fetchMembers();
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen]);

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Member Management
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and organize all your members
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 border-l-4 border-red-500 rounded bg-red-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-10 md:grid-cols-2">
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
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.length}
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
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search members..."
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
            onClick={openAddModal}
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
            Add New Member
          </button>
        </div>

        {/* Members Table */}
        <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    S.NO
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Member Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Phone
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Address
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Username
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    User Type
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
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
                        <h3 className="mb-1 text-lg font-medium text-gray-900">
                          Loading members...
                        </h3>
                      </div>
                    </td>
                  </tr>
                ) : paginatedMembers.length > 0 ? (
                  paginatedMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">{member.name}</td>
                      <td className="px-6 py-4">{member.phone || "-"}</td>
                      <td className="px-6 py-4 break-words w-72">
                        {member.address || "-"}
                      </td>
                      <td className="px-6 py-4">{member.user.username}</td>
                      <td className="px-6 py-4">
                        {member.usertypeid === "1"
                          ? "KLS Board Admin"
                          : member.usertypeid === "2"
                          ? "Institute Admin"
                          : "Institute Member"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(member)}
                          className="flex items-center mr-4 text-indigo-600 hover:text-indigo-900"
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
                          onClick={() => handleDelete(member.id)}
                          className="flex items-center text-red-600 hover:text-red-900"
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
                  ))
                ) : (
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
                          No members found
                        </h3>
                        <p className="text-gray-500">
                          Use the "Add New Member" button above to add your
                          first member.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center py-4 space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Member Modal */}
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
                onClick={resetForm}
              ></div>

              {/* Modal container */}
              <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-medium leading-6 text-white"
                      id="modal-title"
                    >
                      {isEditing ? "Edit Member" : "Add New Member"}
                    </h3>
                    <button
                      type="button"
                      className="text-white hover:text-gray-200 focus:outline-none"
                      onClick={resetForm}
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
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                      <label
                        htmlFor="name"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Member Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter member name"
                        required
                      />
                    </div>

                    <div className="mb-5">
                      <label
                        htmlFor="phone"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>

                    <div className="mb-5">
                      <label
                        htmlFor="address"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Address
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter address (optional)"
                      />
                    </div>

                    <div className="mb-5">
                      <label
                        htmlFor="username"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Username (Email) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter email"
                        required
                      />
                    </div>

                    {isEditing && (
                      <div className="mb-5">
                        <div className="flex items-center">
                          <input
                            id="changePassword"
                            name="changePassword"
                            type="checkbox"
                            checked={formData.changePassword}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="changePassword"
                            className="block ml-2 text-sm text-gray-700"
                          >
                            Change Password
                          </label>
                        </div>
                      </div>
                    )}

                    {(formData.changePassword || !isEditing) && (
                      <>
                        <div className="mb-5">
                          <label
                            htmlFor="password"
                            className="block mb-2 text-sm font-medium text-gray-700"
                          >
                            Password{" "}
                            {!isEditing && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type={formData.showPassword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder={
                                isEditing
                                  ? "Enter new password"
                                  : "Enter password"
                              }
                              required={!isEditing}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  showPassword: !formData.showPassword,
                                })
                              }
                            >
                              {formData.showPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mb-5">
                          <label
                            htmlFor="confirmPassword"
                            className="block mb-2 text-sm font-medium text-gray-700"
                          >
                            Confirm Password{" "}
                            {!isEditing && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type={
                                formData.showConfirmPassword
                                  ? "text"
                                  : "password"
                              }
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder={
                                isEditing
                                  ? "Confirm new password"
                                  : "Confirm password"
                              }
                              required={!isEditing}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-3"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  showConfirmPassword:
                                    !formData.showConfirmPassword,
                                })
                              }
                            >
                              {formData.showConfirmPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="w-5 h-5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isEditing ? "Update Member" : "Add Member"}
                      </button>
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

export default Members;
