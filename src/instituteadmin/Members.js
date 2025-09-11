import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getMembers } from "../api/members";
import { useNavigate } from "react-router-dom";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const token = useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers(token);
        setMembers(data);
      } catch (err) {
        setError("Failed to fetch members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [token]);

  // Filter members by search
  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()) ||
      m.institute?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            className="px-4 py-2 mr-4 text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 font-semibold shadow"
            onClick={() => navigate(-1)}
          >
            &#8592; Back
          </button>
          <h1 className="text-4xl font-black text-teal-700 text-center font-serif drop-shadow-lg flex-1">Board Members</h1>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-end mb-8 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or institute..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none w-64"
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading members...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-teal-50">
                  <th className="py-2 px-3 font-semibold text-teal-700 w-32">Name</th>
                  <th className="py-2 px-3 font-semibold text-teal-700">Role</th>
                  <th className="py-2 px-3 font-semibold text-teal-700">Institute</th>
                  <th className="py-2 px-3 font-semibold text-teal-700">Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">No members found.</td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2 px-3 text-gray-800 font-medium">{m.name}</td>
                      <td className="py-2 px-3 text-gray-600">{m.role}</td>
                      <td className="py-2 px-3 text-gray-600">{m.institute}</td>
                      <td className="py-2 px-3 text-gray-500">{m.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
