import React from "react";
import Header from "../..//components/Header";

const cardData = [
  {
    title: "AGM Resolutions",
    description: "Annual General Meeting decisions and updates.",
    color: "#FFD600",
    // icon: "ðŸŽ¯",
    link: "/member/agm-resolutions",
    bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500",
    text: "text-yellow-900",
  },
  {
    title: "BOM Resolutions",
    description: "Board of Management resolutions and actions.",
    color: "#43A047",
    // icon: "ðŸ“‘",
    link: "/member/bom-resolutions",
    bg: "bg-gradient-to-br from-green-300 via-green-400 to-green-600",
    text: "text-green-900",
  },
  {
    title: "GC Resolutions",
    description: "General Council resolutions and agendas.",
    color: "#3F51B5",
    // icon: "ðŸ—‚ï¸",
    link: "/member/gc-resolutions",
    bg: "bg-gradient-to-br from-indigo-300 via-indigo-400 to-indigo-600",
    text: "text-indigo-900",
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex flex-col">
      <Header />
      <main className="flex flex-col items-center w-full px-0 py-10 md:py-16">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3 px-4 md:px-12 lg:px-24 xl:px-32">
          {cardData.map((card) => (
            <a
              key={card.title}
              href={card.link}
              className={`group block ${card.bg} shadow-xl rounded-3xl p-8 md:p-10 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
              style={{ minHeight: 200 }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span
                  className="mb-6 text-6xl md:text-7xl animate-bounce-slow"
                  aria-label={card.title}
                >
                  {card.icon}
                </span>
                <h2
                  className={`mb-2 text-2xl md:text-3xl font-bold ${card.text} group-hover:text-white text-center transition-colors font-serif`}
                >
                  {card.title}
                </h2>
                <p className="text-lg md:text-xl font-medium text-center text-gray-900 group-hover:text-white drop-shadow-sm">
                  {card.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
