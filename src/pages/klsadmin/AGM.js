import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  getAGMs,
  createAGM,
  updateAGM,
  deleteAGM,
  getAGMsByMember,
} from "../../api/agm";
import { useSelector } from "react-redux";

const AGM = () => {
  const [agms, setAGMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    date: "",
    location: "",
    agenda: "",
    notes: "",
    institute_id: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");

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

  useEffect(() => {
    fetchAGMs();
  }, []);

  // ...similar modal, form, and CRUD logic as Members.js...

    // Handle form input changes
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Open modal for adding AGM
    const openAddModal = () => {
      setFormData({ id: null, date: "", location: "", agenda: "", notes: "", institute_id: "" });
      setIsEditing(false);
      setIsModalOpen(true);
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

  return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">AGM Management</h1>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
          onClick={openAddModal}
        >
          Add AGM
        </button>

        {/* Modal for Add/Edit AGM */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit AGM" : "Add AGM"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="block mb-1">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border px-2 py-1 rounded" required />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Agenda</label>
                  <textarea name="agenda" value={formData.agenda} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Institute ID (optional)</label>
                  <input type="text" name="institute_id" value={formData.institute_id} onChange={handleChange} className="w-full border px-2 py-1 rounded" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">{isEditing ? "Update" : "Add"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>
            {/* AGM Table and controls go here */}
            <pre>{JSON.stringify(agms, null, 2)}</pre>
          </div>
        )}
      </div>
  );
};

export default AGM;
