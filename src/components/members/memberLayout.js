// src/components/member/MemberLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import MemberHeader from "./MemberHeader";
import MemberSidebar from "./MemberSidebar";

const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <MemberSidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MemberHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
