import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  getAGMs,
  createAGM,
  updateAGM,
  deleteAGM,
  getAGMsByMember,
} from "../../api/agm";
import { getInstitutes } from "../../api/institutes"; // Import this
import { useSelector } from "react-redux";

const AGM = () => {
  const [agms, setAGMs] = useState([]);
  const [institutes, setInstitutes] = useState([]); // Add this
  const [loading, setLoading] = useState(true);
  const [institutesLoading, setInstitutesLoading] = useState(true); // Add this
  const [error, setError] = useState(null);
  const [institutesError, setInstitutesError] = useState(null); // Add this
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    date: "",
    //location: "",
    agenda: "",
    notes: "",
    institute_id: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

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

  // Fetch institutes from backend
  const fetchInstitutes = async () => {
    setInstitutesLoading(true);
    setInstitutesError(null);
    try {
      const data = await getInstitutes(token);
      setInstitutes(data);
    } catch (err) {
      setInstitutesError(err.message);
    } finally {
      setInstitutesLoading(false);
    }
  };

  useEffect(() => {
    fetchAGMs();
    fetchInstitutes(); // Add this
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for adding AGM
  const openAddModal = () => {
    setFormData({
      id: null,
      date: "",
      //location: "",
      agenda: "",
      notes: "",
      institute_id: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing AGM
  const handleEdit = (agm) => {
    setFormData({
      id: agm.id,
      date: agm.date,
      //location: agm.location,
      agenda: agm.agenda,
      notes: agm.notes,
      institute_id: agm.institute_id,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Handle delete AGM
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this AGM?")) return;
    try {
      await deleteAGM(id, token);
      fetchAGMs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Submit AGM (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateAGM(formData.id, formData, token);
      } else {
        await createAGM(formData, token);
      }
      setIsModalOpen(false);
      fetchAGMs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        id: null,
        date: "",
        //location: "",
        agenda: "",
        notes: "",
        institute_id: "",
      });
      setIsEditing(false);
    }
  }, [isModalOpen]);

  // Filter AGMs based on search term
  const filteredAGMs = agms.filter((agm) =>
    //agm.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agm.date.includes(searchTerm)
  );

  // Helper function to get institute name by id

  /*
  const getInstituteName = (instituteId) => {
    const institute = institutes.find((i) => i.id === instituteId);
    return institute ? institute.name : "Not specified";
  };
  */

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            AGM Management
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Manage and organize all Annual General Meetings
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search AGMs..."
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
            Add New AGM
          </button>
        </div>

        {/* AGMs Table */}
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
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Agenda
                  </th>
                  {/* <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Location
                  </th> */}
                  <th
                    scope="col"
                    className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                  >
                    Notes
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
                    <td colSpan="5" className="px-6 py-12 text-center">
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
                    <td colSpan="5" className="px-6 py-12 text-center">
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
                    <td colSpan="5" className="px-6 py-12 text-center">
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
                          No AGMs found
                        </h3>
                        <p className="mb-4 text-gray-500">
                          {searchTerm
                            ? "No AGMs match your search"
                            : "Get started by adding your first AGM"}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={openAddModal}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Add AGM
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAGMs.map((agm) => (
                    <tr key={agm.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {agm.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agm.date).toLocaleDateString()}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agm.location}
                      </td> */}
                      {/*
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getInstituteName(agm.institute_id)}
                      </td>
                      */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agm.notes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(agm)}
                          className="mr-3 text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(agm.id)}
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

        {/* Add/Edit AGM Modal */}
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
                      {isEditing ? "Edit AGM" : "Add New AGM"}
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
                    <div className="mb-4">
                      <label
                        htmlFor="date"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    {/*  <div className="mb-4">
                      <label
                        htmlFor="location"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter location"
                        required
                      />
                    </div> */}
                    <div className="mb-4">
                      <label
                        htmlFor="agenda"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Agenda
                      </label>
                      <textarea
                        id="agenda"
                        name="agenda"
                        value={formData.agenda}
                        onChange={handleChange}
                        rows="3"
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter agenda"
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="notes"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter notes"
                      ></textarea>
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="institute_id"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        Institute
                      </label>
                      {institutesLoading ? (
                        <select
                          disabled
                          className="block w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-100 sm:text-sm"
                        >
                          <option>Loading institutes...</option>
                        </select>
                      ) : institutesError ? (
                        <select
                          disabled
                          className="block w-full py-2 px-3 border border-red-300 rounded-md bg-red-50 sm:text-sm"
                        >
                          <option>Error loading institutes</option>
                        </select>
                      ) : (
                        <select
                          id="institute_id"
                          name="institute_id"
                          value={formData.institute_id}
                          onChange={handleChange}
                          className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select an institute</option>
                          {institutes.map((institute) => (
                            <option key={institute.id} value={institute.id}>
                              {institute.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {isEditing ? "Update AGM" : "Add AGM"}
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

export default AGM;
