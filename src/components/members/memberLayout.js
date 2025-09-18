// src/components/member/MemberLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
//import MemberHeader from "./MemberHeader";
import MemberSidebar from "./MemberSidebar";
import Header from "../../components/Header";

const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <MemberSidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MemberHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
