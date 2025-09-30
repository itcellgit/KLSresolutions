import React, { useEffect, useState, useRef } from "react";
import { getBOMResolutions, searchPDFContent } from "../../api/bomResolutions";
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

  // PDF search related state
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // PDF viewing state
  const [activeTab, setActiveTab] = useState(null);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileError, setFileError] = useState("");

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

  // PDF Search functionality
  const performPdfSearch = async (searchText) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log("Searching PDF content for:", searchText);
      const results = await searchPDFContent(searchText);
      console.log("Search results:", results);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Error searching PDF content:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle PDF viewing
  const handlePDFView = async (type, filename) => {
    console.log(
      `handlePDFView called with type: ${type}, filename: ${filename}`
    );

    setFileError("");

    if (filename) {
      try {
        const API_URL = "https://resolutions.klsbelagavi.org/api";
        const response = await fetch(
          `${API_URL}/bom_resolutions/file/${filename}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
          setViewingPDF(type);
          setFileError("");
          console.log(`Successfully loaded PDF for ${type}`);
        } else {
          console.error("Failed to fetch PDF:", response.status);
          setViewingPDF(null);
          setPdfUrl("");
          setFileError(
            `Failed to load ${type.replace(
              "-",
              " "
            )} file. The file may not exist or there was an error accessing it.`
          );
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
        setViewingPDF(null);
        setPdfUrl("");
        setFileError(
          `Error loading ${type.replace(
            "-",
            " "
          )} file. Please check your connection and try again.`
        );
      }
    } else {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(
        `No ${type.replace("-", " ")} file available for this resolution.`
      );
    }
  };

  // Handle tab click
  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    setFileError("");

    // Find current resolution based on selectedDate
    const currentResolution = bomResolutions.find(
      (item) => getBOMDate(item) === selectedDate
    );

    if (!currentResolution) {
      setFileError("No resolution selected.");
      return;
    }

    let filename = null;
    if (tab === "agenda") {
      filename = currentResolution.agenda;
    } else if (tab === "resolution") {
      filename = currentResolution.resolution;
    } else if (tab === "compliance") {
      filename = currentResolution.compliance;
    }

    if (filename) {
      await handlePDFView(tab, filename);
    } else {
      setViewingPDF(null);
      setPdfUrl("");
      setFileError(
        `No ${tab.replace("-", " ")} file available for this meeting.`
      );
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

  // Handle PDF search with debouncing
  useEffect(() => {
    if (pdfSearchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        performPdfSearch(pdfSearchTerm);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [pdfSearchTerm]);

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

  // Get tenure name
  const getTenureName = (tenureId) => {
    if (!tenureId) return "N/A";
    const tenure = managementTenures.find((t) => t.id === tenureId);
    return tenure ? tenure.tenure : "N/A";
  };

  // Filter BOM resolutions based on search term and selected filters
  const filteredBOMResolutions = bomResolutions.filter((resolution) => {
    // Search term filter (search in agenda, resolution, compliance fields)
    const matchesSearch =
      !searchTerm ||
      (resolution.agenda &&
        resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (resolution.resolution &&
        resolution.resolution
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (resolution.compliance &&
        resolution.compliance.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date filter
    const matchesDate =
      !selectedDate || getBOMDate(resolution) === selectedDate;

    // Tenure filter
    const matchesTenure =
      !selectedTenure || String(resolution.tenure_id) === selectedTenure;

    return matchesSearch && matchesDate && matchesTenure;
  });

  // Group resolutions by date and add search match information
  const groupedBOMResolutions = filteredBOMResolutions.reduce(
    (acc, resolution) => {
      const date = getBOMDate(resolution);
      if (!acc[date]) {
        acc[date] = [];
      }

      // Check if this resolution matches search results
      const matchedResult = searchResults.find(
        (r) => r.resolution_id === resolution.id
      );
      const resolutionWithMatch = {
        ...resolution,
        matchedField: matchedResult ? matchedResult.file_type : null,
      };

      acc[date].push(resolutionWithMatch);
      return acc;
    },
    {}
  );

  const uniqueDates = Object.keys(groupedBOMResolutions).sort(
    (a, b) => new Date(b) - new Date(a)
  );

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
        {/* PDF Search Section */}
        {!isLoading && !error && (
          <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="flex items-center mb-3 text-lg font-semibold text-blue-900">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Search Across All BOM Resolution PDFs
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-blue-400"
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
                placeholder="Search across all BOM resolution content (agenda, resolution text, compliance)..."
                className="block w-full py-3 pl-10 pr-12 transition bg-white border border-blue-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={pdfSearchTerm}
                onChange={(e) => setPdfSearchTerm(e.target.value)}
              />
              {pdfSearchTerm && !isSearching && (
                <button
                  onClick={() => setPdfSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
            {pdfSearchTerm && (
              <div className="mt-2 text-sm text-blue-700">
                {isSearching ? (
                  "Searching across resolution content..."
                ) : (
                  <>
                    Found{" "}
                    <span className="font-bold">{searchResults.length}</span>{" "}
                    matching resolution{searchResults.length !== 1 ? "s" : ""}
                    {searchResults.length > 0 &&
                      ` containing "${pdfSearchTerm.substring(0, 50)}${
                        pdfSearchTerm.length > 50 ? "..." : ""
                      }"`}
                  </>
                )}
              </div>
            )}
          </div>
        )}

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
                    {filteredBOMResolutions.length}
                  </span>{" "}
                  of <span className="font-bold">{bomResolutions.length}</span>{" "}
                  resolutions
                </span>
              </div>
            </div>
          </div>
        )}
        {/* OLD TABLE CODE - COMMENTED OUT */}

        {/* NEW DATE-BASED EXPANDABLE VIEW */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredBOMResolutions.length === 0 ? (
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
            ) : (
              uniqueDates.map((date) => {
                const resolutionsForDate = groupedBOMResolutions[date];
                const isExpanded = selectedDate === date;

                return (
                  <div
                    key={date}
                    className="overflow-hidden bg-white shadow-lg rounded-xl"
                  >
                    {/* Date Header - Clickable */}
                    <div
                      onClick={() => setSelectedDate(isExpanded ? null : date)}
                      className="flex items-center justify-between p-6 transition-colors cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {formatDate(date)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {resolutionsForDate.length} resolution
                            {resolutionsForDate.length !== 1 ? "s" : ""}
                            {resolutionsForDate[0]?.managementTenure &&
                              ` • ${
                                resolutionsForDate[0].managementTenure.tenure ||
                                getTenureName(resolutionsForDate[0].tenure_id)
                              }`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Search Match Indicator */}
                        {pdfSearchTerm.trim() &&
                          resolutionsForDate.some((r) => r.matchedField) && (
                            <div className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                              CONTAINS MATCH
                            </div>
                          )}

                        {/* Expand/Collapse Icon */}
                        <div className="text-blue-500">
                          <svg
                            className={`w-6 h-6 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Dashboard Buttons */}
                    {isExpanded && (
                      <div className="p-6 border-t bg-gray-50">
                        {/* Close Button */}
                        <div className="flex justify-end mb-4">
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="p-2 text-gray-400 transition-colors hover:text-gray-600"
                            title="Close"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Dashboard-style Big Box Buttons */}
                        <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                            {/* Agenda Button */}
                            <button
                              onClick={() => handleTabClick("agenda")}
                              className={`relative group block bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl rounded-2xl p-4 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                                activeTab === "agenda" ||
                                viewingPDF === "agenda"
                                  ? "scale-105 shadow-2xl ring-4 ring-blue-300"
                                  : ""
                              }`}
                              style={{ minHeight: 120 }}
                            >
                              {pdfSearchTerm.trim() &&
                                resolutionsForDate.some(
                                  (r) => r.matchedField === "agenda"
                                ) && (
                                  <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                    MATCH
                                  </div>
                                )}
                              <div className="flex flex-col items-center justify-center h-full">
                                <span
                                  className="mb-2 text-3xl animate-bounce-slow"
                                  aria-label="Agenda"
                                >
                                  📋
                                </span>
                                <h2 className="mb-1 font-serif text-lg font-bold text-center text-blue-900 transition-colors group-hover:text-white">
                                  Agenda
                                </h2>
                              </div>
                            </button>

                            {/* Resolution Button */}
                            <button
                              onClick={() => handleTabClick("resolution")}
                              className={`relative group block bg-gradient-to-br from-green-300 via-green-400 to-green-600 shadow-xl rounded-2xl p-4 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                                activeTab === "resolution" ||
                                viewingPDF === "resolution"
                                  ? "scale-105 shadow-2xl ring-4 ring-green-300"
                                  : ""
                              }`}
                              style={{ minHeight: 120 }}
                            >
                              {pdfSearchTerm.trim() &&
                                resolutionsForDate.some(
                                  (r) => r.matchedField === "resolution"
                                ) && (
                                  <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                    MATCH
                                  </div>
                                )}
                              <div className="flex flex-col items-center justify-center h-full">
                                <span
                                  className="mb-2 text-3xl animate-bounce-slow"
                                  aria-label="Resolution"
                                >
                                  📄
                                </span>
                                <h2 className="mb-1 font-serif text-lg font-bold text-center text-green-900 transition-colors group-hover:text-white">
                                  Resolution
                                </h2>
                              </div>
                            </button>

                            {/* Compliance Button */}
                            <button
                              onClick={() => handleTabClick("compliance")}
                              className={`relative group block bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 shadow-xl rounded-2xl p-4 border-4 border-white hover:scale-105 hover:shadow-2xl transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                                activeTab === "compliance" ||
                                viewingPDF === "compliance"
                                  ? "scale-105 shadow-2xl ring-4 ring-purple-300"
                                  : ""
                              }`}
                              style={{ minHeight: 120 }}
                            >
                              {pdfSearchTerm.trim() &&
                                resolutionsForDate.some(
                                  (r) => r.matchedField === "compliance"
                                ) && (
                                  <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full top-1 right-1">
                                    MATCH
                                  </div>
                                )}
                              <div className="flex flex-col items-center justify-center h-full">
                                <span
                                  className="mb-2 text-3xl animate-bounce-slow"
                                  aria-label="Compliance"
                                >
                                  ✅
                                </span>
                                <h2 className="mb-1 font-serif text-lg font-bold text-center text-purple-900 transition-colors group-hover:text-white">
                                  Compliance
                                </h2>
                              </div>
                            </button>
                          </div>

                          {/* PDF Viewer Section */}
                          {viewingPDF && pdfUrl && (
                            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Viewing:{" "}
                                  {viewingPDF.charAt(0).toUpperCase() +
                                    viewingPDF.slice(1)}
                                </h3>
                                <button
                                  onClick={() => {
                                    setViewingPDF(null);
                                    setPdfUrl("");
                                    setActiveTab(null);
                                  }}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Close PDF
                                </button>
                              </div>
                              <div className="w-full h-96">
                                <iframe
                                  src={pdfUrl}
                                  title={`${viewingPDF} PDF`}
                                  className="w-full h-full border border-gray-300 rounded"
                                  style={{ minHeight: "400px" }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {fileError && (
                            <div className="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
                              {fileError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        {/* Footer */}
        {!isLoading && (
          <div className="mt-8 text-sm text-center text-gray-500">
            <p>Karnatak Law Society © {new Date().getFullYear()}</p>
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
