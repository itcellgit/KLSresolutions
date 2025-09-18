import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <main className="flex flex-col items-center justify-start flex-1 w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
