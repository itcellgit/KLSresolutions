
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createGCResolution } from "../api/gcResolutions";
import { gcResolutions } from "../data/sampleGCResolutions";

const AddGCResolution = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await createGCResolution(formData, token);
      setSuccess("GC Resolution added successfully!");
      setFormData({ title: "", description: "", date: "", time: "" });
      setModalOpen(false);
    } catch (err) {
      setError("Failed to add GC Resolution");
    } finally {
      setLoading(false);
    }
  };

  // Filter resolutions by search
  const filteredResolutions = gcResolutions.filter(
    (r) =>
      r.agenda.toLowerCase().includes(search.toLowerCase()) ||
      r.institute.toLowerCase().includes(search.toLowerCase())
  );

  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            className="px-4 py-2 mr-4 text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 font-semibold shadow"
            onClick={() => navigate(-1)}
          >
            &#8592; Back
          </button>
          <h1 className="text-4xl font-black text-indigo-700 text-center font-serif drop-shadow-lg flex-1">GC Resolutions Management</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1" />
          <div className="flex gap-2 items-center justify-end">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agenda or institute..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64"
            />
            <button
              className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              onClick={() => setModalOpen(true)}
            >
              Add GC Resolution
            </button>
          </div>
        </div>
        {/* Table of resolutions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-indigo-50">
                <th className="py-2 px-3 font-semibold text-indigo-700 w-32">Agenda</th>
                <th className="py-2 px-3 font-semibold text-indigo-700">Institute</th>
                <th className="py-2 px-3 font-semibold text-indigo-700">Date & Time</th>
                <th className="py-2 px-3 font-semibold text-indigo-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResolutions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No resolutions found.</td>
                </tr>
              ) : (
                filteredResolutions.map((gc) => (
                  <tr key={gc.id} className="border-b">
                    <td className="py-2 px-3 text-gray-800 font-medium truncate max-w-xs" title={gc.agenda}>{gc.agenda}</td>
                    <td className="py-2 px-3 text-gray-600">{gc.institute}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(gc.time).toLocaleString()}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        className="px-4 py-1 text-sm font-semibold bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                        onClick={() => { setSelectedResolution(gc); setDetailModalOpen(true); }}
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
        {/* Modal for adding resolution */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg mx-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="mb-6 text-2xl font-bold text-gray-900 text-center">Add GC Resolution</h2>
              {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}
              {success && <div className="mb-4 text-green-600 font-medium">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter resolution title"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter resolution description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add GC Resolution"}
                </button>
              </form>
            </div>
          </div>
        )}
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
              <h2 className="mb-4 text-2xl font-bold text-indigo-700 text-center">GC Resolution Details</h2>
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

export default AddGCResolution;
