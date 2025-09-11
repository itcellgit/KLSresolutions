
import React from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { gcResolutions } from "../data/sampleGCResolutions";
import { bomResolutions } from "../data/sampleBOMResolutions";

const cardConfig = [
  {
    label: "GC",
    route: "/instituteadmin/gc",
    color: "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800",
    icon: (
      <span className="mb-3">
        <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="6" width="18" height="12" rx="4" fill="#2563eb" />
          <path d="M7 10h10M7 14h10" stroke="#fff" strokeWidth="2" />
        </svg>
      </span>
    ),
  },
  {
    label: "BOM",
    route: "/instituteadmin/bom-resolutions",
    color: "bg-gradient-to-br from-fuchsia-400 via-purple-500 to-purple-700",
    icon: (
      <span className="mb-3">
        <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="6" width="18" height="12" rx="4" fill="#a21caf" />
          <path d="M6 10h12M6 14h12" stroke="#fff" strokeWidth="2" />
        </svg>
      </span>
    ),
  },
  {
    label: "AGM",
    route: "/instituteadmin/agm",
    color: "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700",
    icon: (
      <span className="mb-3">
        <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="8" fill="#facc15" />
          <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" />
        </svg>
      </span>
    ),
  },
  {
    label: "MEMBERS",
    route: "/instituteadmin/members",
    color: "bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700",
    icon: (
      <span className="mb-3">
        <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="10" r="4" fill="#14b8a6" />
          <rect x="6" y="16" width="12" height="4" rx="2" fill="#14b8a6" />
        </svg>
      </span>
    ),
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex flex-col">
      <Header />
      <main className="flex flex-col items-center w-full px-0 py-10 md:py-16">
        <h1 className="mb-10 text-4xl md:text-5xl font-black tracking-tight text-indigo-700 text-center font-serif drop-shadow-lg">
          Institute Admin Dashboard
        </h1>
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-4 px-4 md:px-8 lg:px-16 xl:px-24">
          {cardConfig.map((card) => (
            <div
              key={card.label}
              className={`group block ${card.color} shadow-xl rounded-3xl p-10 md:p-14 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 cursor-pointer flex flex-col items-center justify-center w-full mb-2`}
              style={{ minHeight: 220 }}
              onClick={() => navigate(card.route)}
            >
              {card.icon}
              <span className="mb-2 text-3xl md:text-4xl font-extrabold text-white group-hover:text-gray-100 text-center transition-colors font-serif tracking-wide">
                {card.label}
              </span>
            </div>
          ))}
        </div>
        {/* Latest GC and BOM Resolutions Tables - now full width */}
        <div className="w-full mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 px-4 md:px-8 lg:px-16 xl:px-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
            <h2 className="mb-6 text-2xl font-bold text-indigo-700">Latest GC Resolutions</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="py-2 px-3 font-semibold text-indigo-700">Agenda</th>
                  <th className="py-2 px-3 font-semibold text-indigo-700">Institute</th>
                  <th className="py-2 px-3 font-semibold text-indigo-700">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {gcResolutions.slice(0, 5).map((gc) => (
                  <tr key={gc.id} className="border-b">
                    <td className="py-2 px-3 text-gray-800 font-medium">{gc.agenda}</td>
                    <td className="py-2 px-3 text-gray-600">{gc.institute}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(gc.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
            <h2 className="mb-6 text-2xl font-bold text-purple-700">Latest BOM Resolutions</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-purple-50">
                  <th className="py-2 px-3 font-semibold text-purple-700">Agenda</th>
                  <th className="py-2 px-3 font-semibold text-purple-700">Institute</th>
                  <th className="py-2 px-3 font-semibold text-purple-700">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {bomResolutions.slice(0, 5).map((bom) => (
                  <tr key={bom.id} className="border-b">
                    <td className="py-2 px-3 text-gray-800 font-medium">{bom.agenda}</td>
                    <td className="py-2 px-3 text-gray-600">{bom.institute}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(bom.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
