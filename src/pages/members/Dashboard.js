import React from "react";

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Member Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p>Welcome to your member dashboard!</p>
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <ul className="list-disc pl-5">
            <li>
              <a
                href="/member/institutes"
                className="text-blue-600 hover:underline"
              >
                View Institutes
              </a>
            </li>
            {/* Add more actions as needed */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
