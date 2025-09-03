import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Left side - Sidebar toggle + Title */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 md:hidden hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="ml-2 md:ml-0">
            <h1 className="text-xl font-semibold text-gray-800">
              KLS RESOLUTION SYSTEM
            </h1>
          </div>
        </div>

        {/* {currentUser && (
          <div className="flex items-center">
            <div className="hidden md:block">
              <span className="mr-4 text-sm text-gray-600">
                Welcome, {currentUser.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 ml-4 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        )} */}

        <div className="flex items-center">
          {currentUser && (
            <div className="hidden md:block">
              <span className="mr-4 text-sm text-gray-600">
                Welcome, {currentUser.email}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 ml-4 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
