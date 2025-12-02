import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";

const cardConfig = [
  {
    label: "GC",
    route: "/instituteadmin/add-gc-resolution",
    color: "bg-gradient-to-br from-indigo-300 via-indigo-400 to-indigo-600",
    text: "text-indigo-900",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    description: "Governing Council",
  },
  {
    label: "BOM",
    route: "/instituteadmin/bom-resolutions",
    color:
      "relative group block bg-orange-800 shadow-xl rounded-2xl p-3 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-orange-700",
    text: "text-white-500",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    description: "Board of Management",
  },
  {
    label: "AGM",
    route: "/instituteadmin/add-agm",
    color: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500",
    text: "text-yellow-900",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    description: "Annual General Meeting",
  },
  {
    label: "MEMBERS",
    route: "/instituteadmin/members",
    color: "bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600",
    text: "text-blue-900",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    description: "Member Management",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <Header />
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col">
          <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Institute Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage your institute's governance, meetings, and members from
                one central location
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {cardConfig.map((card, index) => (
                <div
                  key={card.label}
                  className={`group relative rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                    card.color
                  } ${card.text || "text-white"}`}
                  onClick={() => navigate(card.route)}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="p-8 flex flex-col items-center justify-center h-full relative z-10">
                    <div className="mb-4 p-4 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
                      {card.icon}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{card.label}</h2>
                    <p className="text-white text-opacity-90 text-center">
                      {card.description}
                    </p>
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
