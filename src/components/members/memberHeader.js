import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";

const MemberHeader = ({ toggleSidebar }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
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
            aria-label="Toggle sidebar"
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
              Member Portal
            </h1>
          </div>
        </div>

        {/* Right side - User info + Logout */}
        <div className="flex items-center">
          {user && (
            <div className="hidden md:block">
              <span className="mr-4 text-sm text-gray-600">
                Welcome, {user.email}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default MemberHeader;
