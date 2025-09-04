import React from "react";

const Members = () => {
  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-gray-50 to-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-8 text-2xl font-extrabold text-gray-900 text-center">Board Members</h1>
        {/* Board members list for institute admin goes here */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600">List of board members for your institution.</p>
        </div>
      </div>
    </div>
  );
};

export default Members;
