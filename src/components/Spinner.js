// src/components/Spinner.js
import React from "react";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
};

export default Spinner;
// This is a simple spinner component that can be used to indicate loading states.
