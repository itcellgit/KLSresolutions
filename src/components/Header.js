import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";

const Header = ({ toggleSidebar }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-white via-indigo-50 to-indigo-100 border-b border-indigo-200 shadow-lg">
      <div className="flex items-center justify-between px-8 py-5">
        {/* Left side - Sidebar toggle + Logo + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-indigo-500 md:hidden hover:text-indigo-700 focus:outline-none mr-2"
          >
            <svg
              className="w-8 h-8"
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
          <img
            src={process.env.PUBLIC_URL + "/image.png"}
            alt="KLS Logo"
            className="w-14 h-14 rounded-full shadow-xl border-2 border-indigo-200 mr-4 hidden md:block"
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black text-indigo-700 tracking-wide font-serif mb-0 leading-tight drop-shadow-lg">
              KLS Resolutions
            </h1>
            <span className="text-sm font-semibold text-indigo-500 tracking-wide">
              Management Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:block">
              <span className="mr-2 text-base text-gray-700 font-semibold">
                Welcome,{" "}
                <span className="text-indigo-700 font-bold">
                  {user.username}
                </span>
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-5 py-2 text-base font-bold text-white bg-indigo-600 rounded-xl shadow hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
