
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { createGCResolution } from "../api/gcResolutions";

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
    } catch (err) {
      setError("Failed to add GC Resolution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="mb-6 text-3xl font-extrabold text-gray-900 text-center">Add GC Resolution</h1>
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
  );
};

export default AddGCResolution;
