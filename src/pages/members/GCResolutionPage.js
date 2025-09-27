import React, { useEffect, useState, useRef } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { getInstitutes } from "../../api/institutes";
import { getAllManagementTenures } from "../../api/managementTenures";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "../../components/Header";

const getCurrentTenure = () => {
  const today = new Date();
  const year = today.getFullYear();
  for (let start = 2021; start <= year; start++) {
    const end = start + 2;
    if (year >= start && year <= end) {
      return `${start}-${end}`;
    }
  }
  return "";
};

// Helper function to map agenda sections to predefined categories
const mapToSectionCategory = (agendaSection) => {
  if (!agendaSection) return "OTHER MATTERS";

  const sectionLower = agendaSection.toLowerCase();

  if (sectionLower.includes("main")) return "MAIN AGENDA";
  if (sectionLower.includes("purchase")) return "PURCHASE EXPENSE";
  if (sectionLower.includes("staff")) return "STAFF MATTERS";

  return "OTHER MATTERS";
};

// Helper function to strip HTML tags from a string
const stripHtmlTags = (str) => {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
};

const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [formData, setFormData] = useState({ tenure: getCurrentTenure() });
  const [tenures, setTenures] = useState([]);
  const [selectedTenure, setSelectedTenure] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const expandedContentRef = useRef(null);

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchTenures = async () => {
    try {
      const data = await getAllManagementTenures(token);
      setTenures(data);

      // Set the current tenure as default based on today's date
      if (data && data.length > 0) {
        const today = new Date();
        const currentTenure = data.find((tenure) => {
          const startDate = new Date(tenure.start_date);
          const endDate = new Date(tenure.end_date);
          return today >= startDate && today <= endDate;
        });

        if (currentTenure) {
          setSelectedTenure(String(currentTenure.id));
        } else {
          // If no current tenure found, fallback to the latest tenure
          const latestTenure = data.reduce((latest, current) => {
            return new Date(current.start_date) > new Date(latest.start_date)
              ? current
              : latest;
          });
          setSelectedTenure(String(latestTenure.id));
        }
      }
    } catch (err) {
      console.error("Error fetching tenures:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const gcData = await getGCResolutions(token);
        const resolutions = gcData?.resolutions || gcData || [];
        setGCResolutions(resolutions);
        setApiError(false);

        const institutesData = await getInstitutes(token);
        setInstitutes(institutesData);

        const allowedInstituteIds = [
          ...new Set(resolutions.map((item) => item.institute_id)),
        ];
        const filtered = institutesData.filter((inst) =>
          allowedInstituteIds.includes(inst.id)
        );
        setFilteredInstitutes(filtered);

        if (filtered.length > 0) {
          setSelectedInstitute(String(filtered[0].id));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(true);
        setGCResolutions([]);
        setInstitutes([]);
        setFilteredInstitutes([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
      fetchTenures();
    } else {
      setIsLoading(false);
      setApiError(true);
      setGCResolutions([]);
      setInstitutes([]);
      setFilteredInstitutes([]);
    }
  }, [token]);

  const getInstituteName = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.name : "N/A";
  };

  const generatePDF = async () => {
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

      const items = groupedByDate[expandedId] || [];
      const firstItem = items[0];

      // Get dynamic values
      const currentInstitute = institutes.find(
        (inst) => inst.id === parseInt(selectedInstitute)
      );
      const instituteCode = currentInstitute?.code || "N/A";
      const gcNo = firstItem?.gc_no || "N/A";
      const gcDate = firstItem?.gc_date ? formatDate(firstItem.gc_date) : "N/A";

      // Get tenure from current year or first item's date
      const currentYear = firstItem?.gc_date
        ? new Date(firstItem.gc_date).getFullYear()
        : new Date().getFullYear();
      let tenure = "";
      for (let start = 2021; start <= currentYear; start++) {
        const end = start + 2;
        if (currentYear >= start && currentYear <= end) {
          tenure = `${start}-${end}`;
          break;
        }
      }

      // Custom Heading for PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 15;

      // Add logo at the center top
      try {
        // Create a new image element to load the logo
        const logoImg = new Image();
        logoImg.src = "/image.png"; // Reference to the logo in public folder

        // Wait for image to load and add to PDF
        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            try {
              // Add logo at the center top
              const logoWidth = 30;
              const logoHeight = 30;
              const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
              const logoY = y; // At the top

              pdf.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
              resolve();
            } catch (err) {
              console.warn("Could not add logo to PDF:", err);
              resolve(); // Continue without logo
            }
          };
          logoImg.onerror = () => {
            console.warn("Could not load logo image");
            resolve(); // Continue without logo
          };
        });
      } catch (err) {
        console.warn("Error loading logo:", err);
      }

      // Add space for logo
      y += 35;

      // Main title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("KARNATAK LAW SOCIETY'S", pageWidth / 2, y, { align: "center" });
      y += 6;

      // Institute name (dynamic)
      const instituteName = currentInstitute?.name || "N/A";
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(instituteName, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "(Permanently affiliated and Autonomous Institution under",
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 5;
      pdf.text(
        "Visvesvaraya Technological University, Belagavi)",
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 8;

      // Line
      pdf.line(15, y, pageWidth - 15, y);
      y += 8;

      // Reference and Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Ref. No KLS/Resolution/${gcNo}`, 15, y);
      pdf.text(`Date: ${gcDate}`, pageWidth - 15, y, { align: "right" });
      y += 8;

      // Meeting Notice
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("MEETING NOTICE", pageWidth / 2, y, { align: "center" });
      y += 7;

      // Meeting details
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const meetingText1 = `The 01st meeting of the Governing Council (${tenure}), will be held on ${gcDate} at 4:00pm`;
      const meetingText2 = `Council Room of KLS-${instituteCode}.`;
      pdf.text(meetingText1, 15, y);
      y += 4;
      pdf.text(meetingText2, 15, y);
      y += 6;

      // Request text
      const requestText =
        "All members of the Governing Council are requested to make it convenient to attend the meeting.";
      pdf.text(requestText, 15, y);
      y += 8;

      // Agenda header
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`AGENDA of GC-${instituteCode} MEETING`, pageWidth / 2, y, {
        align: "center",
      });
      y += 8;

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = y;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - position;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = firstItem
        ? `GC_Resolution_${
            firstItem.gc_date
              ? formatDate(firstItem.gc_date).replace(/\s/g, "_")
              : "Unknown_Date"
          }.pdf`
        : "GC_Resolution_Details.pdf";

      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    if (!expandedContentRef.current) return;
    const currentDateKey = expandedId;
    const items = groupedByDate[currentDateKey] || [];
    const printContents = expandedContentRef.current.innerHTML;
    const firstItem = items[0];

    // Get dynamic values
    const currentInstitute = institutes.find(
      (inst) => inst.id === parseInt(selectedInstitute)
    );
    const instituteCode = currentInstitute?.code || "N/A";
    const gcNo = firstItem?.gc_no || "N/A";
    const gcDate = firstItem?.gc_date ? formatDate(firstItem.gc_date) : "N/A";

    // Get tenure from current year or first item's date
    const currentYear = firstItem?.gc_date
      ? new Date(firstItem.gc_date).getFullYear()
      : new Date().getFullYear();
    let tenure = "";
    for (let start = 2021; start <= currentYear; start++) {
      const end = start + 2;
      if (currentYear >= start && currentYear <= end) {
        tenure = `${start}-${end}`;
        break;
      }
    }

    const printWindow = window.open("", "", "height=800,width=900");
    printWindow.document.write(
      `<html><head><title>Print GC Resolution</title>` +
        '<link rel="stylesheet" href="/index.css" />' +
        `</head><body style='font-family: Arial, sans-serif; margin: 20px;'>` +
        `<div style='text-align:center; margin-bottom:30px;'>` +
        `<img src='/image.png' alt='Logo' style='display: block; margin: 0 auto 10px auto; width: 60px; height: 60px; object-fit: contain;' onerror='this.style.display="none"'/>` +
        `<h2 style='margin:0; font-size: 18px; font-weight: bold;'>KARNATAK LAW SOCIETY'S</h2>` +
        `<h3 style='margin: 4px 0; font-size: 16px; font-weight: bold;'>${
          currentInstitute?.name || "N/A"
        }</h3>` +
        `<div style='font-size:12px; margin: 5px 0;'>(Permanently affiliated and Autonomous Institution under</div>` +
        `<div style='font-size:12px; margin-bottom: 10px;'>Visvesvaraya Technological University, Belagavi)</div>` +
        `<hr style='margin: 10px 0; border: 1px solid #000;'/>` +
        `<div style='display: flex; justify-content: space-between; margin: 6px 0; font-size: 12px;'>` +
        `<span>Ref. No KLS/Resolution/${gcNo}</span>` +
        `<span>Date: ${gcDate}</span>` +
        `</div>` +
        `<h3 style='margin: 12px 0 6px 0; font-size: 16px; font-weight: bold;'>MEETING NOTICE</h3>` +
        `<div style='font-size:12px; margin: 6px 0; text-align: left;'>The 01st meeting of the Governing Council (${tenure}), will be held on ${gcDate} at 4:00pm</div>` +
        `<div style='font-size:12px; margin: 3px 0; text-align: left;'>Council Room of KLS-${instituteCode}.</div>` +
        `<div style='font-size:12px; margin: 8px 0;'>All members of the Governing Council are requested to make it convenient to attend the meeting.</div>` +
        `<h4 style='margin: 12px 0 8px 0; font-size: 14px; font-weight: bold;'>AGENDA of GC-${instituteCode} MEETING</h4>` +
        `</div>` +
        printContents +
        `</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const filteredData = gcResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const instituteName = getInstituteName(item.institute_id).toLowerCase();
    const matchesSearch =
      String(item.agenda || "")
        .toLowerCase()
        .includes(searchLower) ||
      String(item.agenda_section || "")
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
      String(item.institute_id) === String(selectedInstitute);

    let matchesTenure = true;
    if (selectedTenure) {
      if (item.tenure_id) {
        matchesTenure = String(item.tenure_id) === String(selectedTenure);
      } else {
        matchesTenure = false;
      }
    }

    return matchesSearch && matchesInstitute && matchesTenure;
  });

  const groupedByDate = filteredData.reduce((acc, item) => {
    const dateKey = item.gc_date || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const groupedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const handleBackClick = () => {
    navigate("/member/dashboard");
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Predefined sections in the desired order
  const predefinedSections = [
    "MAIN AGENDA",
    "PURCHASE EXPENSE",
    "STAFF MATTERS",
    "OTHER MATTERS",
  ];

  return (
    <div className="w-full">
      <Header />

      <div className="min-h-screen p-4 bg-gray-50 md:p-8">
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
            <div className="w-32"></div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          {!isLoading && filteredInstitutes.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {filteredInstitutes.map((inst) => (
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

                <div className="ml-4">
                  <label
                    htmlFor="tenure"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Tenure
                  </label>
                  <select
                    id="tenure"
                    name="tenure"
                    value={selectedTenure}
                    onChange={(e) => setSelectedTenure(e.target.value)}
                    className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Tenures</option>
                    {tenures.map((tenure) => (
                      <option key={tenure.id} value={String(tenure.id)}>
                        {tenure.tenure}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

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
                    placeholder="Search resolutions by agenda, agenda section, resolution, compliance, institute name..."
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
                        GC Date
                      </th>
                      <th className="w-32 px-6 py-4 text-xs font-semibold tracking-wider text-left uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedDates.length > 0 ? (
                      groupedDates.map((dateKey, idx) => {
                        const isExpanded = expandedId === dateKey;
                        const items = groupedByDate[dateKey];
                        return [
                          <tr
                            key={`row-${dateKey}`}
                            className="transition-colors duration-150 hover:bg-indigo-50"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {dateKey !== "N/A"
                                  ? formatDate(dateKey)
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : dateKey)
                                }
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                {isExpanded ? (
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
                          </tr>,
                          isExpanded && (
                            <tr
                              key={`expand-${dateKey}`}
                              className="bg-indigo-50"
                            >
                              <td colSpan="3" className="px-0 py-0">
                                <div className="overflow-hidden bg-white border-t-4 border-indigo-500 shadow-lg rounded-b-xl">
                                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                                    <div>
                                      <h3 className="text-xl font-bold text-white">
                                        GC Resolutions for{" "}
                                        {dateKey !== "N/A"
                                          ? formatDate(dateKey)
                                          : "N/A"}
                                      </h3>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={generatePDF}
                                        disabled={isGeneratingPDF}
                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60"
                                      >
                                        {isGeneratingPDF ? (
                                          <span>Generating PDF...</span>
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
                                                d="M12 4v16m8-8H4"
                                              />
                                            </svg>
                                            Download PDF
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={handlePrint}
                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      >
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
                                            d="M6 9V2h12v7"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2h-2"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 14h12v7H6z"
                                          />
                                        </svg>
                                        Print
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
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="p-6" ref={expandedContentRef}>
                                    <div className="w-full">
                                      {(() => {
                                        // Group items by the predefined sections
                                        const groupedBySection = items.reduce(
                                          (acc, item) => {
                                            const sectionCategory =
                                              mapToSectionCategory(
                                                item.agenda_section
                                              );
                                            if (!acc[sectionCategory]) {
                                              acc[sectionCategory] = [];
                                            }
                                            acc[sectionCategory].push(item);
                                            return acc;
                                          },
                                          {}
                                        );

                                        return (
                                          <div className="overflow-hidden border border-gray-300 rounded-lg">
                                            <table className="w-full border-collapse">
                                              <tbody>
                                                {predefinedSections.map(
                                                  (section, sectionIndex) => {
                                                    const sectionItems =
                                                      groupedBySection[
                                                        section
                                                      ] || [];
                                                    if (
                                                      sectionItems.length === 0
                                                    )
                                                      return null;

                                                    return (
                                                      <React.Fragment
                                                        key={section}
                                                      >
                                                        {/* Section Header Row */}
                                                        <tr>
                                                          <td
                                                            colSpan="2"
                                                            className="px-4 py-3 font-bold text-left text-gray-800 bg-blue-100 border border-gray-300"
                                                            style={{
                                                              fontSize: "14px",
                                                            }}
                                                          >
                                                            {section}
                                                          </td>
                                                        </tr>
                                                        {/* Section Items */}
                                                        {sectionItems.map(
                                                          (item, index) => (
                                                            <tr
                                                              key={
                                                                item.id || index
                                                              }
                                                            >
                                                              <td
                                                                className="px-4 py-3 font-medium text-center border border-gray-300 bg-gray-50"
                                                                style={{
                                                                  width: "80px",
                                                                  fontSize:
                                                                    "12px",
                                                                }}
                                                              >
                                                                {index + 1}.
                                                              </td>
                                                              <td
                                                                className="px-4 py-3 border border-gray-300 bg-white"
                                                                style={{
                                                                  fontSize:
                                                                    "12px",
                                                                  fontFamily:
                                                                    "Arial, sans-serif",
                                                                  lineHeight:
                                                                    "1.4",
                                                                }}
                                                              >
                                                                <h4>Agenda:</h4>{" "}
                                                                {stripHtmlTags(
                                                                  item.agenda
                                                                ) || "N/A"}
                                                                <br />
                                                                <h4>
                                                                  Resolution:
                                                                </h4>
                                                                {stripHtmlTags(
                                                                  item.resolution
                                                                ) || "N/A"}
                                                                <br />
                                                                <h4>
                                                                  Compliance:
                                                                </h4>
                                                                {stripHtmlTags(
                                                                  item.compliance
                                                                ) || "N/A"}
                                                              </td>
                                                            </tr>
                                                          )
                                                        )}
                                                      </React.Fragment>
                                                    );
                                                  }
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
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
                          ),
                        ];
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
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
                              : "No Resolutions Found For Selected Tenure"}
                          </h3>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
    </div>
  );
};

export default GCResolutionPage;
