import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import { createAGMResolution } from "../api/agmResolutions"; // Uncomment if API available
// import { agmResolutions } from "../data/sampleAGMResolutions"; // Uncomment if sample data available

const sampleAGMResolutions = [
  {
    id: 1,
    agm_date: "2025-09-01T10:00:00",
    agenda: "Annual Budget Approval",
    notes: "Budget for 2025-2026 approved by majority."
  },
  {
    id: 2,
    agm_date: "2025-09-05T14:00:00",
    agenda: "Election of New Board Members",
    notes: "New board members elected for the next term."
  },
];

const AddAGM = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(null);
  // const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  // Filter resolutions by search
  const filteredResolutions = sampleAGMResolutions.filter(
    (r) =>
      r.agenda.toLowerCase().includes(search.toLowerCase()) ||
      r.notes.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            className="px-4 py-2 mr-4 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 font-semibold shadow"
            onClick={() => navigate(-1)}
          >
            &#8592; Back
          </button>
          <h1 className="text-4xl font-black text-blue-700 text-center font-serif drop-shadow-lg flex-1">AGM Resolutions Management</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1" />
          <div className="flex gap-2 items-center justify-end">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agenda or notes..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
            />
            {/* Uncomment below if adding AGM resolutions is allowed */}
            {/* <button
              className="px-5 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              onClick={() => setModalOpen(true)}
            >
              Add AGM Resolution
            </button> */}
          </div>
        </div>
        {/* Table of resolutions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-2 px-3 font-semibold text-blue-700 w-32">Agenda</th>
                <th className="py-2 px-3 font-semibold text-blue-700">Date & Time</th>
                <th className="py-2 px-3 font-semibold text-blue-700">Notes</th>
                <th className="py-2 px-3 font-semibold text-blue-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResolutions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No resolutions found.</td>
                </tr>
              ) : (
                filteredResolutions.map((agm) => (
                  <tr key={agm.id} className="border-b">
                    <td className="py-2 px-3 text-gray-800 font-medium truncate max-w-xs" title={agm.agenda}>{agm.agenda}</td>
                    <td className="py-2 px-3 text-gray-500">{formatDate(agm.agm_date)}</td>
                    <td className="py-2 px-3 text-gray-600">{agm.notes}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        className="px-4 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        onClick={() => { setSelectedResolution(agm); setDetailModalOpen(true); }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Modal for viewing details */}
        {detailModalOpen && selectedResolution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg mx-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setDetailModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="mb-4 text-2xl font-bold text-blue-700 text-center">AGM Resolution Details</h2>
              <div className="mb-4">
                <span className="block text-lg font-semibold text-gray-800 mb-2">Agenda:</span>
                <span className="block text-base text-gray-700 mb-2">{selectedResolution.agenda}</span>
                <span className="block text-lg font-semibold text-gray-800 mb-2">Date & Time:</span>
                <span className="block text-base text-gray-700 mb-2">{formatDate(selectedResolution.agm_date)}</span>
                <span className="block text-lg font-semibold text-gray-800 mb-2">Notes:</span>
                <span className="block text-base text-gray-700 whitespace-pre-line">{selectedResolution.notes || "No notes available."}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAGM;
