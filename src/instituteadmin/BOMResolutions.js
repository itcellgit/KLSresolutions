import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bomResolutions } from "../data/sampleBOMResolutions";

const BOMResolutions = () => {
  const [search, setSearch] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const navigate = useNavigate();

  // Filter resolutions by search
  const filteredResolutions = bomResolutions.filter(
    (r) =>
      r.agenda.toLowerCase().includes(search.toLowerCase()) ||
      r.institute.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            className="px-4 py-2 mr-4 text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 font-semibold shadow"
            onClick={() => navigate(-1)}
          >
            &#8592; Back
          </button>
          <h1 className="text-4xl font-black text-purple-700 text-center font-serif drop-shadow-lg flex-1">BOM Resolutions</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-end mb-8 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by agenda or institute..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none w-64"
          />
        </div>
        {/* Table of resolutions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-purple-50">
                <th className="py-2 px-3 font-semibold text-purple-700 w-32">Agenda</th>
                <th className="py-2 px-3 font-semibold text-purple-700">Institute</th>
                <th className="py-2 px-3 font-semibold text-purple-700">Date & Time</th>
                <th className="py-2 px-3 font-semibold text-purple-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResolutions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No resolutions found.</td>
                </tr>
              ) : (
                filteredResolutions.map((bom) => (
                  <tr key={bom.id} className="border-b">
                    <td className="py-2 px-3 text-gray-800 font-medium truncate max-w-xs" title={bom.agenda}>{bom.agenda}</td>
                    <td className="py-2 px-3 text-gray-600">{bom.institute}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(bom.time).toLocaleString()}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        className="px-4 py-1 text-sm font-semibold bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                        onClick={() => { setSelectedResolution(bom); setDetailModalOpen(true); }}
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
              <h2 className="mb-4 text-2xl font-bold text-purple-700 text-center">BOM Resolution Details</h2>
              <div className="mb-4">
                <span className="block text-lg font-semibold text-gray-800 mb-2">Agenda:</span>
                <span className="block text-base text-gray-700 mb-2">{selectedResolution.agenda}</span>
                <span className="block text-lg font-semibold text-gray-800 mb-2">Institute:</span>
                <span className="block text-base text-gray-700 mb-2">{selectedResolution.institute}</span>
                <span className="block text-lg font-semibold text-gray-800 mb-2">Date & Time:</span>
                <span className="block text-base text-gray-700 mb-2">{new Date(selectedResolution.time).toLocaleString()}</span>
                <span className="block text-lg font-semibold text-gray-800 mb-2">Description:</span>
                <span className="block text-base text-gray-700 whitespace-pre-line">{selectedResolution.description || "No description available."}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMResolutions;
