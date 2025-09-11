import React from "react";
import Layout from "../Layout";
function Dashboard() {
  return (
    <div className="p-8 bg-gradient-to-br from-white via-indigo-50 to-indigo-100 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-indigo-700 mb-4 text-center font-serif drop-shadow">KLS Resolutions Dashboard</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">Welcome to the Admin Dashboard. Manage all your GC, BOM, AGM resolutions and members from here.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:shadow-2xl transition">
            <span className="text-indigo-600 text-3xl font-bold mb-2">GC</span>
            <p className="text-gray-500 text-center">View and manage GC Resolutions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:shadow-2xl transition">
            <span className="text-indigo-600 text-3xl font-bold mb-2">BOM</span>
            <p className="text-gray-500 text-center">View and manage BOM Resolutions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:shadow-2xl transition">
            <span className="text-indigo-600 text-3xl font-bold mb-2">AGM</span>
            <p className="text-gray-500 text-center">View and manage AGM details</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center hover:shadow-2xl transition">
            <span className="text-indigo-600 text-3xl font-bold mb-2">MEMBERS</span>
            <p className="text-gray-500 text-center">View and manage Members</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
