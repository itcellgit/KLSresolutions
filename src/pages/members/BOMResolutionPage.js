import React, { useEffect, useState, useRef } from "react";
import { getBOMResolutions } from "../../api/bomResolutions";
import { getAllManagementTenures } from "../../api/managementTenures";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "../../components/Header";
import HtmlContent from "../../components/HtmlContent";

// Helper function to map agenda sections to predefined categories
const mapToSectionCategory = (agendaSection) => {
  if (!agendaSection) return "OTHER MATTER";

  const sectionLower = agendaSection.toLowerCase();

  if (sectionLower.includes("main")) return "MAIN AGENDA";
  if (sectionLower.includes("purchase")) return "PURCHASE AGENDA";
  if (sectionLower.includes("staff")) return "STAFF MATTERS";

  return "OTHER MATTER";
};

const BOMResolutionPage = () => {
  const [bomResolutions, setBOMResolutions] = useState([]);
  const [managementTenures, setManagementTenures] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const expandedContentRef = useRef(null);

  // State for accordion sections - only one section can be open at a time
  const [openSections, setOpenSections] = useState({
    "MAIN AGENDA": false,
    "PURCHASE EXPENSES": false,
    "STAFF MATTERS": false,
    "OTHER MATTERS": false,
  });

  // Get token from Redux or localStorage
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  // Helper function to get BOM date from the object
  const getBOMDate = (item) => {
    // The BOM date is directly on the item object
    if (item.bom_date) {
      return item.bom_date;
    }
    // Fallback to other possible date fields
    if (item.date) {
      return item.date;
    }
    if (item.meeting_date) {
      return item.meeting_date;
    }
    return null;
  };

  // For print
  const handlePrint = () => {
    if (!expandedContentRef.current) return;
    // Get the expanded date for heading
    let heading = "BOM Resolutions";
    let dateText = "Date: N/A";
    if (expandedId && expandedId !== "N/A") {
      heading = "BOM Resolutions";
      const date = new Date(expandedId);
      dateText = `Date: ${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`;
    }
    const printContents = `
      <div style='text-align:center; margin-bottom: 16px;'>
        <h2 style='margin:0; font-size: 2em;'>${heading}</h2>
        <div style='font-size: 1.1em; margin-top: 4px;'>${dateText}</div>
        <hr style='margin: 12px 0 24px 0; border: none; border-top: 2px solid #444;' />
      </div>
      ${expandedContentRef.current.innerHTML}
    `;
    const printWindow = window.open("", "", "height=800,width=900");
    printWindow.document.write("<html><head>");
    printWindow.document.write('<link rel="stylesheet" href="/index.css" />');
    printWindow.document.write("</head><body >");
    printWindow.document.write(printContents);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // For PDF of group
  const generateGroupPDF = async () => {
    if (!expandedContentRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(expandedContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const heading = "BOM Resolutions";
      const bomDate = expandedId !== "N/A" ? expandedId : null;
      const dateText = bomDate ? `Date: ${formatDate(bomDate)}` : "Date: N/A";
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      const headingWidth = pdf.getTextWidth(heading);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const headingX = (pageWidth - headingWidth) / 2;
      pdf.text(heading, headingX, 20);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const dateWidth = pdf.getTextWidth(dateText);
      const dateX = (pageWidth - dateWidth) / 2;
      pdf.text(dateText, dateX, 30);
      pdf.line(15, 35, pageWidth - 15, 35);
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 40;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const filename = bomDate
        ? `BOM_Resolutions_${formatDate(bomDate).replace(/\s/g, "_")}.pdf`
        : "BOM_Resolutions.pdf";
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    const fetchBOMResolutions = async () => {
      // Check if token exists
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await getBOMResolutions(token);
        // Log the response to understand its structure
        console.log("API Response:", response);
        // Extract the data array from the response
        const data = response.data || response.resolutions || response;
        // Check if data is an array
        if (Array.isArray(data)) {
          setBOMResolutions(data);
        } else {
          console.error("Unexpected data format:", data);
          setError("Received data in unexpected format");
          setBOMResolutions([]);
        }
      } catch (err) {
        console.error("Error fetching BOM resolutions:", err);
        // Handle specific 401 error
        if (err.response && err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Clear invalid token
          localStorage.removeItem("token");
        } else {
          setError("Failed to fetch BOM resolutions. Please try again later.");
        }
        setBOMResolutions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchManagementTenures = async () => {
      try {
        const response = await getAllManagementTenures(token);
        console.log("Management Tenures fetched:", response);
        console.log("Number of tenures:", response?.length);
        setManagementTenures(response);
      } catch (err) {
        console.error("Error fetching management tenures:", err);
      }
    };

    fetchBOMResolutions();
    fetchManagementTenures();
  }, [token]);

  // Function to handle back button click
  const handleBackClick = () => {
    // Check if token exists before navigating
    if (!token) {
      console.error("No authentication token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      // Use replace instead of push to avoid history issues
      navigate("/member/dashboard", { replace: true });
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation using window.location
      window.location.href = "/member/dashboard";
    }
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

  // NEW ACCORDION HELPER FUNCTIONS
  // Handle accordion toggle - only one section can be open at a time
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [section]: !prev[section],
    }));
  };

  // Function to categorize resolutions into sections
  const categorizeResolutions = (resolutions) => {
    const categories = {
      "MAIN AGENDA": [],
      "PURCHASE EXPENSES": [],
      "STAFF MATTERS": [],
      "OTHER MATTERS": [],
    };

    resolutions.forEach((resolution) => {
      const agenda = resolution.agenda || "";
      const agendaUpper = agenda.toUpperCase();

      if (
        agendaUpper.includes("PURCHASE") ||
        agendaUpper.includes("EXPENSE") ||
        agendaUpper.includes("PROCUREMENT") ||
        agendaUpper.includes("VENDOR") ||
        agendaUpper.includes("SUPPLIER") ||
        agendaUpper.includes("PAYMENT") ||
        agendaUpper.includes("BILL") ||
        agendaUpper.includes("INVOICE")
      ) {
        categories["PURCHASE EXPENSES"].push(resolution);
      } else if (
        agendaUpper.includes("STAFF") ||
        agendaUpper.includes("EMPLOYEE") ||
        agendaUpper.includes("SALARY") ||
        agendaUpper.includes("APPOINTMENT") ||
        agendaUpper.includes("RECRUITMENT") ||
        agendaUpper.includes("HR") ||
        agendaUpper.includes("LEAVE") ||
        agendaUpper.includes("PROMOTION")
      ) {
        categories["STAFF MATTERS"].push(resolution);
      } else if (
        agendaUpper.includes("MAIN") ||
        agendaUpper.includes("PRINCIPAL") ||
        agendaUpper.includes("POLICY") ||
        agendaUpper.includes("STRATEGIC") ||
        agendaUpper.includes("BUDGET") ||
        agendaUpper.includes("ANNUAL") ||
        agendaUpper.includes("ACADEMIC") ||
        agendaUpper.includes("ADMISSION")
      ) {
        categories["MAIN AGENDA"].push(resolution);
      } else {
        categories["OTHER MATTERS"].push(resolution);
      }
    });

    return categories;
  };

  // NEW FILTERING LOGIC
  // Filter resolutions based on search, date, and tenure
  const filteredResolutions = bomResolutions.filter((resolution) => {
    const matchesSearch =
      resolution.agenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !selectedDate ||
      (resolution.bom_date && resolution.bom_date.startsWith(selectedDate));

    const matchesTenure =
      !selectedTenure ||
      (resolution.tenure_id &&
        resolution.tenure_id.toString() === selectedTenure);

    return matchesSearch && matchesDate && matchesTenure;
  });

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
      const currentResolution = bomResolutions.find(
        (item) => (item.id || bomResolutions.indexOf(item)) === expandedId
      );
      // Add heading to PDF
      const heading = "BOM RESOLUTION DETAILS";
      const bomDate = getBOMDate(currentResolution);
      const dateText = bomDate ? `Date: ${formatDate(bomDate)}` : "Date: N/A";
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
        ? `BOM_Resolution_${
            bomDate ? formatDate(bomDate).replace(/\s/g, "_") : "Unknown_Date"
          }.pdf`
        : "BOM_Resolution_Details.pdf";
      // Save the PDF
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filter data based on search term
  const filteredData = bomResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const bomDate = getBOMDate(item);
    return (
      (item.agenda && item.agenda.toLowerCase().includes(searchLower)) ||
      (item.agenda_section &&
        item.agenda_section.toLowerCase().includes(searchLower)) ||
      (item.resolution &&
        item.resolution.toLowerCase().includes(searchLower)) ||
      (item.compliance &&
        item.compliance.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.agenda &&
        item.gc_resolution.agenda.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.resolution &&
        item.gc_resolution.resolution.toLowerCase().includes(searchLower)) ||
      (item.gc_resolution &&
        item.gc_resolution.gc_date &&
        item.gc_resolution.gc_date.toLowerCase().includes(searchLower)) ||
      (bomDate && bomDate.toLowerCase().includes(searchLower))
    );
  });

  // Group by date
  const groupedByDate = filteredData.reduce((acc, item) => {
    const bomDate = getBOMDate(item);
    const dateKey = bomDate || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});
  const groupedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Predefined sections in the desired order
  const predefinedSections = [
    "MAIN AGENDA",
    "PURCHASE AGENDA",
    "STAFF MATTERS",
    "OTHER MATTER",
  ];

  // Set up auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full">
      <Header />
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
              Board of Management Resolutions
            </h1>
            <p className="max-w-2xl mx-auto mt-2 text-gray-600">
              View and search all resolutions passed by the Board of Management
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>
      </div>
      <div className="mx-auto max-w-7xl">
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
            <div className="text-center">
              <div className="inline-block w-12 h-12 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
              <p className="font-medium text-gray-600">
                Loading BOM Resolutions...
              </p>
            </div>
          </div>
        )}
        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 text-red-700 rounded-lg shadow-sm bg-red-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
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
                  placeholder="Search resolutions by agenda, agenda section, resolution, compliance, date..."
                  className="block w-full py-3 pl-10 pr-4 transition border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm("")}
                  >
                    <svg
                      className="w-5 h-5"
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
                )}
              </div>

              {/* NEW FILTER DROPDOWNS */}
              <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:gap-4">
                {/* Date Filter */}
                <div className="flex-1">
                  {/* <label className="block mb-1 text-sm font-medium text-gray-700">
                    Filter by Date
                  </label> */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Tenure Filter */}
                <div className="flex-1">
                  <select
                    value={selectedTenure}
                    onChange={(e) => setSelectedTenure(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    style={{
                      minHeight: "40px",
                      backgroundColor: "white",
                      color: "#1f2937",
                    }}
                  >
                    <option
                      value=""
                      style={{ color: "#1f2937", backgroundColor: "white" }}
                    >
                      All Tenures
                    </option>
                    {managementTenures.map((tenure) => (
                      <option
                        key={tenure.id}
                        value={tenure.id}
                        style={{ color: "#1f2937", backgroundColor: "white" }}
                      >
                        {tenure.tenure}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedDate || selectedTenure) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedDate("");
                        setSelectedTenure("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center px-4 py-3 mt-4 rounded-lg bg-indigo-50">
                <span className="text-sm text-indigo-800">
                  Showing{" "}
                  <span className="font-bold">
                    {filteredResolutions.length}
                  </span>{" "}
                  of <span className="font-bold">{bomResolutions.length}</span>{" "}
                  resolutions
                </span>
              </div>
            </div>
          </div>
        )}
        {/* OLD TABLE CODE - COMMENTED OUT */}

        {/* NEW ACCORDION CODE */}
        {!isLoading && (
          <div className="space-y-4">
            {(() => {
              const categorizedData =
                categorizeResolutions(filteredResolutions);
              const sections = [
                "MAIN AGENDA",
                "PURCHASE EXPENSES",
                "STAFF MATTERS",
                "OTHER MATTERS",
              ];

              return sections.map((sectionName) => {
                const sectionData = categorizedData[sectionName];
                const isOpen = openSections[sectionName];

                if (!sectionData || sectionData.length === 0) return null;

                return (
                  <div
                    key={sectionName}
                    className="overflow-hidden bg-white shadow-lg rounded-xl"
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleSection(sectionName)}
                      className="flex items-center justify-between w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold text-gray-900">
                          {sectionName}
                        </h3>
                        <span className="px-3 py-1 ml-3 text-sm text-indigo-800 bg-indigo-100 rounded-full">
                          {sectionData.length}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* Accordion Content */}
                    {isOpen && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                S.NO
                              </th>
                              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                Agenda
                              </th>
                              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                Resolution
                              </th>
                              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                Compliance
                              </th>
                              <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                BOM Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sectionData.map((resolution, index) => (
                              <tr key={resolution.id}>
                                <td className="w-4 px-6 py-4 text-sm font-medium text-center text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="max-w-xs">
                                    <HtmlContent
                                      content={resolution.agenda || "N/A"}
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="max-w-md">
                                    <HtmlContent
                                      content={resolution.resolution || "N/A"}
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="max-w-xs">
                                    <HtmlContent
                                      content={resolution.compliance || "N/A"}
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                  {resolution.bom_date
                                    ? formatDate(resolution.bom_date)
                                    : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {filteredResolutions.length === 0 && (
              <div className="py-16 text-center text-gray-500 bg-white border border-gray-200 rounded-xl">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-700">
                  {error
                    ? "Unable to load data due to authentication error."
                    : searchTerm || selectedDate || selectedTenure
                    ? "No resolutions found matching your search criteria."
                    : "No BOM resolutions available."}
                </h3>
                {(searchTerm || selectedDate || selectedTenure) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate("");
                      setSelectedTenure("");
                    }}
                    className="px-4 py-2 mt-4 text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {/* Footer */}
        {!isLoading && (
          <div className="mt-8 text-sm text-center text-gray-500">
            <p>Karnataka Law Society © {new Date().getFullYear()}</p>
            <p className="mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMResolutionPage;
