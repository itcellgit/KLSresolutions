import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
      <nav className="bg-white shadow-lg py-4 px-8 flex items-center justify-between">
        <span className="text-2xl font-extrabold text-blue-700 tracking-wide">KLS Resolutions</span>
        <button
          onClick={handleLogout}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-2 rounded-full shadow-lg hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 focus:outline-none"
        >
          Logout
        </button>
      </nav>
      <main className="flex-1 w-full flex flex-col items-center justify-start">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
