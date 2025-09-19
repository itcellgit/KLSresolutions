// import React, { useState, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { logoutUser } from "../redux/authSlice";
// import { useNavigate } from "react-router-dom";
// import ChangePasswordModal from "./ChangePasswordModal";

// const Header = ({ toggleSidebar }) => {
//   const user = useSelector((state) => state.auth.user);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
//     useState(false);
//   const [successMessage, setSuccessMessage] = useState("");

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (isDropdownOpen && !event.target.closest(".relative")) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isDropdownOpen]);

//   const handleLogout = () => {
//     dispatch(logoutUser());
//     navigate("/login");
//     setIsDropdownOpen(false); // Close dropdown after logout
//   };

//   const handleChangePassword = () => {
//     setIsChangePasswordModalOpen(true);
//     setIsDropdownOpen(false); // Close dropdown after selection
//   };

//   const handlePasswordChangeSuccess = (message) => {
//     setSuccessMessage(message);
//     // Hide success message after 5 seconds
//     setTimeout(() => {
//       setSuccessMessage("");
//     }, 5000);
//   };

//   const handleCloseModal = () => {
//     setIsChangePasswordModalOpen(false);
//   };

//   return (
//     <>
//       {/* Success message */}
//       {successMessage && (
//         <div className="fixed top-4 right-4 z-50">
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
//             <div className="flex items-center">
//               <svg
//                 className="w-5 h-5 text-green-600 mr-2"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <p className="text-sm font-medium text-green-800">
//                 {successMessage}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       <header className="border-b border-indigo-200 shadow-lg bg-gradient-to-r from-white via-indigo-50 to-indigo-100">
//         <div className="flex items-center justify-between px-8 py-5">
//           {/* Left side - Sidebar toggle + Logo + Title */}
//           <div className="flex items-center gap-4">
//             <button
//               onClick={toggleSidebar}
//               className="mr-2 text-indigo-500 md:hidden hover:text-indigo-700 focus:outline-none"
//             >
//               <svg
//                 className="w-8 h-8"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 6h16M4 12h16M4 18h16"
//                 />
//               </svg>
//             </button>
//             <img
//               src={process.env.PUBLIC_URL + "/image.png"}
//               alt="KLS Logo"
//               className="hidden mr-4 border-2 border-indigo-200 rounded-full shadow-xl w-14 h-14 md:block"
//             />
//             <div className="flex flex-col justify-center">
//               <h1 className="mb-0 font-serif text-3xl font-black leading-tight tracking-wide text-indigo-700 md:text-4xl drop-shadow-lg">
//                 Karnataka Law Society
//               </h1>
//               <span className="text-sm font-semibold tracking-wide text-indigo-500">
//                 Management Portal
//               </span>
//             </div>
//           </div>

//           <div className="flex items-center gap-4">
//             {user && (
//               <div className="hidden md:block">
//                 <span className="mr-2 text-base font-semibold text-gray-700">
//                   Welcome,{" "}
//                   <span className="font-bold text-indigo-700">
//                     {user.username}
//                   </span>
//                 </span>
//               </div>
//             )}

//             {/* Profile dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                 className="flex items-center justify-center w-10 h-10 text-indigo-600 transition bg-indigo-100 rounded-full hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <svg
//                   className="w-6 h-6"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                   />
//                 </svg>
//               </button>

//               {/* Dropdown menu */}
//               {isDropdownOpen && (
//                 <div className="absolute right-0 z-10 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
//                   <div className="py-1">
//                     <button
//                       onClick={handleChangePassword}
//                       className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
//                     >
//                       <svg
//                         className="w-4 h-4 mr-3"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H6a3 3 0 01-3-3V9a3 3 0 013-3h1m8 0V6a3 3 0 00-3-3H9a3 3 0 00-3 3v1"
//                         />
//                       </svg>
//                       Change Password
//                     </button>
//                     <button
//                       onClick={handleLogout}
//                       className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
//                     >
//                       <svg
//                         className="w-4 h-4 mr-3"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//                         />
//                       </svg>
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Change Password Modal */}
//       <ChangePasswordModal
//         isOpen={isChangePasswordModalOpen}
//         onClose={handleCloseModal}
//         onSuccess={handlePasswordChangeSuccess}
//       />
//     </>
//   );
// };

// export default Header;
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";

const Header = ({ toggleSidebar }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handlePasswordChangeSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleCloseModal = () => {
    setIsChangePasswordModalOpen(false);
  };

  return (
    <>
      {/* Success message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-indigo-200 shadow-lg bg-gradient-to-r from-white via-indigo-50 to-indigo-100">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Sidebar toggle + Logo + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
            <img
              src={process.env.PUBLIC_URL + "/image.png"}
              alt="KLS Logo"
              className="hidden border-2 border-indigo-200 rounded-full shadow-xl w-12 h-12 md:block"
            />
            <div className="flex flex-col justify-center">
              <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight tracking-wide text-indigo-700 drop-shadow-lg">
                Karnataka Law Society
              </h1>
              <span className="text-xs md:text-sm font-semibold tracking-wide text-indigo-500">
                Management Portal
              </span>
            </div>
          </div>

          {/* Right side - User info and dropdown */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:block">
                <span className="text-sm md:text-base font-medium text-gray-700">
                  Welcome,{" "}
                  <span className="font-bold text-indigo-700">
                    {user.username}
                  </span>
                </span>
              </div>
            )}

            {/* Profile dropdown */}
            <div className="relative user-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 transition-all duration-200 bg-indigo-100 rounded-full hover:bg-indigo-200 ring-2 ring-offset-2 ring-indigo-500"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
              >
                <svg
                  className="w-6 h-6 text-indigo-600 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 transform">
                  <div className="py-1">
                    <button
                      onClick={handleChangePassword}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-700 group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 mr-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200">
                        <svg
                          className="w-4 h-4 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H6a3 3 0 01-3-3V9a3 3 0 013-3h1m8 0V6a3 3 0 00-3-3H9a3 3 0 00-3 3v1"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">Change Password</span>
                    </button>
                    {/* Logout button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-red-50 hover:text-red-700 group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 mr-3 bg-red-100 rounded-lg group-hover:bg-red-200">
                        <svg
                          className="w-4 h-4 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={handleCloseModal}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};

export default Header;
