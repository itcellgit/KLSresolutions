import React from "react";
import { gcResolutions } from "./members/GCResolutionPage";
import { bomResolutions } from "./members/BOMResolutionPage";

const cardData = [
  {
    title: "AGM Resolutions",
    description: "Annual General Meeting decisions and updates.",
    color: "yellow",
    icon: "🎯",
    link: "/member/agm-resolutions",
    gradient: "from-yellow-400 to-yellow-600",
  },
  {
    title: "GC Resolutions",
    description: "General Council resolutions and agendas.",
    color: "indigo",
    icon: "🗂️",
    link: "/member/gc-resolutions",
    gradient: "from-indigo-400 to-indigo-600",
  },
  {
    title: "BOM Resolutions",
    description: "Board of Management resolutions and actions.",
    color: "green",
    icon: "📑",
    link: "/member/bom-resolutions",
    gradient: "from-green-400 to-green-600",
  },
];

const Dashboard = () => {
  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-12 bg-gradient-to-br from-gray-100 to-blue-100">
      <h1 className="mb-12 text-5xl font-extrabold tracking-tight text-gray-800 drop-shadow-lg">
        KLS Resolutions Dashboard
      </h1>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-10 mb-16 sm:grid-cols-2 md:grid-cols-3">
        {cardData.map((card) => (
          <a
            key={card.title}
            href={card.link}
            className={`group block bg-gradient-to-br ${card.gradient} shadow-2xl rounded-3xl p-10 border-t-8 border-${card.color}-500 hover:scale-105 hover:shadow-3xl transition-transform duration-200`}
            style={{ minHeight: 220 }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="mb-6 text-6xl animate-bounce-slow">
                {card.icon}
              </span>
              <h2
                className={`text-2xl font-bold mb-3 text-${card.color}-900 group-hover:text-white transition-colors`}
              >
                {card.title}
              </h2>
              <p className="text-lg font-medium text-center text-gray-100 transition-colors group-hover:text-white drop-shadow-sm">
                {card.description}
              </p>
            </div>
          </a>
        ))}
      </div>
      {/* Recent agendas display */}
      <div className="w-full max-w-4xl mt-2">
        <h2 className="mb-6 text-2xl font-bold text-gray-700">
          Recent GC & BOM Agendas
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-xl font-semibold text-indigo-700">
              GC Resolutions
            </h3>
            <ul>
              {gcResolutions.slice(0, 3).map((gc) => (
                <li key={gc.id} className="mb-4">
                  <span className="text-lg font-semibold">{gc.agenda}</span>
                  <br />
                  <span className="text-sm text-gray-500">
                    {gc.institute} &middot; {new Date(gc.time).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-xl font-semibold text-green-700">
              BOM Resolutions
            </h3>
            <ul>
              {bomResolutions.slice(0, 3).map((bom) => (
                <li key={bom.id} className="mb-4">
                  <span className="text-lg font-semibold">{bom.agenda}</span>
                  <br />
                  <span className="text-sm text-gray-500">
                    {bom.institute} &middot;{" "}
                    {new Date(bom.time).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
