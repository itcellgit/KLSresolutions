import React, { useState } from "react";

const cardData = [
  {
    title: "AGM Resolutions",
    description:
      "Annual General Meeting decisions and corporate governance matters.",
    icon: "📋",
    link: "/member/agm-resolutions",
  },
  {
    title: "BOM Resolutions",
    description:
      "Board of Management strategic decisions and policy implementations.",
    icon: "⚖️",
    link: "/member/bom-resolutions",
  },
  {
    title: "GC Resolutions",
    description:
      "General Council administrative resolutions and procedural matters.",
    icon: "📄",
    link: "/member/gc-resolutions",
  },
];

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Header Section */}
      <div className="border-b border-gray-700/50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
              KLS Governance Portal
            </h1>
            <p className="text-gray-300 text-xl">
              Board Member Resolution Management System
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cardData.map((card, index) => (
            <a
              key={card.title}
              href={card.link}
              className="group block h-full"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className={`
                bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl 
                border border-gray-700/50 backdrop-blur-sm p-12
                transition-all duration-300 ease-in-out
                hover:shadow-3xl hover:border-gray-600/50 hover:-translate-y-3
                h-[360px] flex flex-col justify-center items-center text-center
                hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800
                ${
                  hoveredCard === index
                    ? "ring-2 ring-blue-500/30 shadow-blue-500/10"
                    : ""
                }
              `}
              >
                {/* Icon */}
                <div className="mb-10 p-8 bg-gray-700/50 rounded-3xl group-hover:bg-blue-600/20 transition-all duration-300 group-hover:scale-110">
                  <span className="text-6xl block">{card.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed mb-8 text-lg px-4">
                  {card.description}
                </p>

                {/* Action Indicator */}
                <div className="flex items-center text-blue-400 text-base font-medium group-hover:text-blue-300 mt-auto">
                  <span>Access Portal</span>
                  <svg
                    className="ml-3 w-6 h-6 transform group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
