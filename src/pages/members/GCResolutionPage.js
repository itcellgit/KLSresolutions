import React, { useEffect, useState, useRef } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { getInstitutes } from "../../api/institutes"; // Import the getInstitutes function
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [institutes, setInstitutes] = useState([]); // State to store institutes
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("all");
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // Ref for capturing the expanded content
  const expandedContentRef = useRef(null);
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch GC Resolutions
        const gcData = await getGCResolutions(token);
        console.log("Fetched GC Resolutions:", gcData);
        if (
          !gcData ||
          (gcData.resolutions && gcData.resolutions.length === 0)
        ) {
          setApiError(false);
          setGCResolutions([]);
        } else {
          setApiError(false);
          setGCResolutions(gcData.resolutions || gcData);
        }
        // Fetch Institutes
        const institutesData = await getInstitutes(token);
        console.log("Fetched Institutes:", institutesData);
        setInstitutes(institutesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(true);
        setGCResolutions([]);
        setInstitutes([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchData();
    } else {
      setIsLoading(false);
      setApiError(true);
      setGCResolutions([]);
      setInstitutes([]);
    }
  }, [token]);
  // Function to get institute name by ID
  const getInstituteName = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.name : "N/A";
  };
  // Function to generate PDF
  const generatePDF = async () => {
    if (!expandedContentRef.current) return;
    setIsGeneratingPDF(true);
    try {
      // Create canvas from HTML content
      const canvas = await html2canvas(expandedContentRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // Get the current resolution data
      const currentResolution = gcResolutions.find(
        (item) => item.id === expandedId
      );

      // Add heading to PDF
      const heading = "GC RESOLUTION DETAILS";
      const dateText =
        currentResolution && currentResolution.gc_date
          ? `Date: ${formatDate(currentResolution.gc_date)}`
          : "Date: N/A";

      // Set font size and style for heading
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");

      // Calculate heading width to center it
      const headingWidth = pdf.getTextWidth(heading);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const headingX = (pageWidth - headingWidth) / 2;

      // Add heading to PDF
      pdf.text(heading, headingX, 20);

      // Add date to PDF
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const dateWidth = pdf.getTextWidth(dateText);
      const dateX = (pageWidth - dateWidth) / 2;
      pdf.text(dateText, dateX, 30);

      // Add a line under the heading
      pdf.line(15, 35, pageWidth - 15, 35);

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 40; // Start position after heading (40mm from top)

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = currentResolution
        ? `GC_Resolution_${
            currentResolution.gc_date
              ? formatDate(currentResolution.gc_date).replace(/\s/g, "_")
              : "Unknown_Date"
          }.pdf`
        : "GC_Resolution_Details.pdf";

      // Save the PDF
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  // Filter data based on selected institute and search term
  const filteredData = gcResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const instituteName = getInstituteName(item.institute_id).toLowerCase();
    const matchesSearch =
      String(item.agenda || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.resolution || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.compliance || "")
        .toLowerCase()
        .includes(searchLower) ||
      instituteName.includes(searchLower) ||
      String(item.gc_date || "")
        .toLowerCase()
        .includes(searchLower);
    const matchesInstitute =
      selectedInstitute === "all" ||
      String(item.institute_id) === String(selectedInstitute);
    return matchesSearch && matchesInstitute;
  });
  // Function to handle back button click
  const handleBackClick = () => {
    navigate("/member/dashboard");
  };
  // Function to toggle expanded view
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-8">
      {/* Header Section */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center px-4 py-2 text-indigo-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:text-indigo-800"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
              Governing Council Resolutions
            </h1>
            <p className="max-w-2xl mx-auto mt-2 text-gray-600">
              View and search all resolutions passed by the Governing Council
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>
      </div>
      <div className="mx-auto max-w-7xl">
        {/* Institute Tabs */}
        {!isLoading && institutes.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                  selectedInstitute === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-indigo-700 border-gray-300 hover:bg-indigo-50"
                }`}
                onClick={() => setSelectedInstitute("all")}
              >
                All Institutes
              </button>
              {institutes.map((inst) => (
                <button
                  key={inst.id}
                  className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                    selectedInstitute === String(inst.id)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-indigo-700 border-gray-300 hover:bg-indigo-50"
                  }`}
                  onClick={() => setSelectedInstitute(String(inst.id))}
                >
                  {inst.code}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
            <div className="text-center">
              <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
              <p className="font-medium text-gray-600">
                Loading GC Resolutions...
              </p>
            </div>
          </div>
        )}
        {/* Search Bar and Stats */}
        {!isLoading && (
          <div className="p-6 mb-8 bg-white border border-gray-200 shadow-md rounded-xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-4xl">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search resolutions by agenda, resolution, compliance, institute name..."
                  className="block w-full py-3 pl-10 pr-4 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center px-4 py-3 rounded-lg bg-indigo-50">
                <span className="text-sm text-indigo-800">
                  Showing{" "}
                  <span className="font-bold">{filteredData.length}</span> of{" "}
                  <span className="font-bold">{gcResolutions.length}</span>{" "}
                  resolutions
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Table */}
        {!isLoading && (
          <div className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="text-white bg-gradient-to-r from-indigo-600 to-purple-700">
                  <tr>
                    <th className="w-16 px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase">
                      GC No
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase">
                      GC Date
                    </th>
                    <th className="w-32 px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((res, index) => (
                      <>
                        <tr
                          key={res.id}
                          className="transition-colors duration-150 hover:bg-indigo-50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {res.gc_no || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(res.gc_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleExpand(res.id)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              {expandedId === res.id ? (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 15l7-7 7 7"
                                    ></path>
                                  </svg>
                                  Hide
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 9l-7 7-7-7"
                                    ></path>
                                  </svg>
                                  View
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedId === res.id && (
                          <tr className="bg-indigo-50">
                            <td colSpan="4" className="px-0 py-0">
                              <div className="overflow-hidden bg-white border-t-4 border-indigo-500 shadow-lg rounded-b-xl">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                                  <div>
                                    <h3 className="text-xl font-bold text-white">
                                      GC Resolution Details
                                    </h3>
                                    <p className="mt-1 text-indigo-100">
                                      <span className="font-medium">Date:</span>{" "}
                                      {formatDate(res.gc_date)}
                                    </p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={generatePDF}
                                      disabled={isGeneratingPDF}
                                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                    >
                                      {isGeneratingPDF ? (
                                        <>
                                          <svg
                                            className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                            ></circle>
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                          </svg>
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <svg
                                            className="w-4 h-4 mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            ></path>
                                          </svg>
                                          PDF
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setExpandedId(null)}
                                      className="text-white transition-colors hover:text-indigo-200"
                                    >
                                      <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                {/* Content - This is what will be captured for PDF */}
                                <div ref={expandedContentRef} className="p-6">
                                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Agenda */}
                                    <div className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-md">
                                          <svg
                                            className="w-6 h-6 text-indigo-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                          </svg>
                                        </div>
                                        <div className="ml-4">
                                          <h4 className="text-lg font-medium text-gray-900">
                                            Agenda
                                          </h4>
                                          <p className="mt-2 text-gray-700 whitespace-pre-line">
                                            {res.agenda || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Compliance */}
                                    <div className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 p-2 bg-green-100 rounded-md">
                                          <svg
                                            className="w-6 h-6 text-green-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                        </div>
                                        <div className="ml-4">
                                          <h4 className="text-lg font-medium text-gray-900">
                                            Compliance
                                          </h4>
                                          <p className="mt-2 text-gray-700">
                                            {res.compliance || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Resolution */}
                                    <div className="p-5 border border-gray-200 rounded-lg shadow-sm md:col-span-2 bg-gray-50">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-md">
                                          <svg
                                            className="w-6 h-6 text-purple-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                          </svg>
                                        </div>
                                        <div className="flex-1 ml-4">
                                          <h4 className="text-lg font-medium text-gray-900">
                                            Resolution
                                          </h4>
                                          <div className="p-4 mt-2 bg-white border border-gray-300 rounded-md shadow-inner">
                                            <p className="text-gray-700 whitespace-pre-line">
                                              {res.resolution || "N/A"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Institute Name */}
                                    <div className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-md">
                                          <svg
                                            className="w-6 h-6 text-blue-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                          </svg>
                                        </div>
                                        <div className="ml-4">
                                          <h4 className="text-lg font-medium text-gray-900">
                                            Institute Name
                                          </h4>
                                          <p className="px-3 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded">
                                            {getInstituteName(res.institute_id)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* GC Date */}
                                    <div className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-md">
                                          <svg
                                            className="w-6 h-6 text-yellow-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </div>
                                        <div className="ml-4">
                                          <h4 className="text-lg font-medium text-gray-900">
                                            GC Date
                                          </h4>
                                          <p className="mt-2 text-gray-700">
                                            {formatDate(res.gc_date)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Footer */}
                                <div className="px-6 py-3 text-right border-t border-gray-200 bg-gray-50">
                                  <button
                                    onClick={() => setExpandedId(null)}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Close Details
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-16 text-center bg-indigo-50"
                      >
                        <svg
                          className="w-16 h-16 mx-auto text-indigo-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="mt-4 text-xl font-medium text-gray-700">
                          {apiError
                            ? "Data unavailable"
                            : "No resolutions found"}
                        </h3>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Footer */}
        {!isLoading && (
          <div className="mt-8 text-sm text-center text-gray-500">
            <p>
              Governing Council Resolutions System © {new Date().getFullYear()}
            </p>
            <p className="mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default GCResolutionPage;
