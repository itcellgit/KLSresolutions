
import React from "react";
import { useNavigate } from "react-router-dom";

const cardConfig = [
  { label: "GC", route: "/instituteadmin/gc", color: "bg-indigo-600" },
  { label: "BOM", route: "/instituteadmin/bom-resolutions", color: "bg-purple-600" },
  { label: "AGM", route: "/instituteadmin/agm", color: "bg-green-600" },
  { label: "MEMBERS", route: "/instituteadmin/members", color: "bg-pink-600" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <h1 className="mb-10 text-4xl font-extrabold text-gray-900 text-center">Institute Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-3xl">
        {cardConfig.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl shadow-lg p-8 flex flex-col items-center justify-center cursor-pointer transition transform hover:scale-105 ${card.color} text-white`}
            onClick={() => navigate(card.route)}
          >
            <span className="text-2xl font-bold tracking-wide mb-2">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
