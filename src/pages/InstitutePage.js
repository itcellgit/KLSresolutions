// pages/InstitutePage.js

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  getInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
} from "../api/institutes";
import { useSelector } from "react-redux";

const InstitutePage = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for form inputs
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
  });
  // State for editing
  const [editingId, setEditingId] = useState(null);

  // State for institutes list
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Get token from Redux
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // Filter institutes based on search term
  const filteredInstitutes = institutes.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.users && inst.users.length > 0
        ? inst.users[0].email.toLowerCase().includes(searchTerm.toLowerCase())
        : false)
  );

  const totalPages = Math.ceil(filteredInstitutes.length / itemsPerPage);
  const paginatedInstitutes = filteredInstitutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fetch institutes from backend using API function
  useEffect(() => {
    const fetchInstitutes = async () => {
      setLoading(true);
      try {
        if (!token) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }
        const data = await getInstitutes(token);
        setInstitutes(data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
        } else {
          alert("Failed to fetch institutes. Please try again.");
        }
        setInstitutes([]);
      }
      setLoading(false);
    };
    fetchInstitutes();
  }, [isModalOpen, token]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this institute?"))
      return;
    try {
      if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }
      await deleteInstitute(id, token);
      setInstitutes((prev) => prev.filter((inst) => inst.id !== id));
      alert("Institute deleted successfully!");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.error || "Failed to delete institute");
      }
    }
  };

  // Handle edit button click
  const handleEdit = (institute) => {
    setFormData({
      name: institute.name || "",
      code: institute.code || "",
      phone: institute.phone || "",
      email:
        institute.users && institute.users.length > 0
          ? institute.users[0].email
          : "",
    });
    setEditingId(institute.id);
    setIsModalOpen(true);
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "/login";
      return;
    }
    try {
      if (editingId) {
        await updateInstitute(editingId, formData, token);
        alert("Institute updated successfully!");
      } else {
        await createInstitute(formData, token);
        alert("Institute and user created successfully!");
      }
      setFormData({ name: "", code: "", phone: "", email: "" });
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      } else {
        const errorMessage =
          err.response?.data?.error ||
          (editingId
            ? "Failed to update institute"
            : "Failed to create institute and user");
        alert(errorMessage);
      }
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({ name: "", code: "", phone: "", email: "" });
      setEditingId(null);
    }
  }, [isModalOpen]);

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Institute Management
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and organize all your educational institutes in one place
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search institutes..."
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            Add New Institute
          </button>
        </div>

        {/* Institutes Table */}
        <div className="mb-10 overflow-hidden bg-white shadow-xl rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    S.NO
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Institute Name
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Institute Code
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Phone No
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-600">Loading institutes...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedInstitutes.length === 0 ? (
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
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <h3 className="mb-1 text-lg font-medium text-gray-900">
                          No institutes found
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Get started by adding your first institute"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInstitutes.map((inst, index) => (
                    <tr
                      key={inst.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 break-words w-72">
                        {inst.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 break-words w-72">
                        {inst.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {inst.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 break-words w-72">
                        {inst.users && inst.users.length > 0
                          ? inst.users[0].email
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(inst)}
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
                            onClick={() => handleDelete(inst.id)}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center py-4 space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  currentPage === i + 1
                    ? "bg-indigo-700 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Add/Edit Institute Modal */}
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
                      {editingId ? "Edit Institute" : "Add New Institute"}
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
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                      <label
                        htmlFor="name"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Institute Name *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter institute name"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-gray-400"
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
                      </div>
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="code"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Institute Code
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="code"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter institute code"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="phone"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Phone No
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter phone number"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="email"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Email *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="block w-full py-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Enter email address"
                          required
                          disabled={editingId} // Disable email editing in edit mode
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      {editingId && (
                        <p className="mt-1 text-sm text-gray-500">
                          Email cannot be changed in edit mode
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        {editingId ? "Update Institute" : "Add Institute"}
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

export default InstitutePage;
