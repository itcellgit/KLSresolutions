import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import DashboardLayout from "../components/DashboardLayout";
import HtmlContent from "../components/HtmlContent";
import FileDownloadLink from "../components/FileDownloadLink";
import {
  getGCResolutions,
  createGCResolution,
  updateGCResolution,
  deleteGCResolution,
} from "../api/gcResolutions";
import { getInstitutes } from "../api/institutes";
import { getAllManagementTenures } from "../api/managementTenures";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AddGCResolution = () => {
  const goToDashboard = () => {
    navigate("/instituteadmin/dashboard");
  };
  const navigate = useNavigate();
  // State for search
  const [searchTerm, setSearchTerm] = useState("");
  // State for dropdown data (will be populated from backend)
  const [institutes, setInstitutes] = useState([]);
  const [tenures, setTenures] = useState([]);
  // State for loading
  const [loading, setLoading] = useState(true);
  const [tenuresLoading, setTenuresLoading] = useState(true);
  // State for errors
  const [error, setError] = useState(null);
  const [tenuresError, setTenuresError] = useState(null);
  // State for resolutions (will be populated from backend)
  const [resolutions, setResolutions] = useState([]);
  // State for loading resolutions
  const [resolutionsLoading, setResolutionsLoading] = useState(true);
  const [resolutionsError, setResolutionsError] = useState(null);
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for editing
  const [editingId, setEditingId] = useState(null);
  // State for form data
  const [formData, setFormData] = useState({
    agenda: "",
    resolution: "",
    compliance: "",
    meeting_notes: "",
    gc_date: "",
    institute_id: "",
    tenure_id: "",
  });
  // State for file uploads
  const [fileData, setFileData] = useState({
    agenda: null,
    resolution: null,
    compliance: null,
    meeting_notes: null,
  });
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // State for date filter
  const [selectedDate, setSelectedDate] = useState("");
  // State for tenure filter
  const [selectedTenure, setSelectedTenure] = useState("");
  // Get token and user from Redux store
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  // Add missing state for PDF generation
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Fetch institutes and resolutions when component mounts
  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        setLoading(true);
        const data = await getInstitutes(token);
        setInstitutes(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching institutes:", err);
        setError("Failed to load institutes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    const fetchResolutions = async (tenure_id = null) => {
      try {
        setResolutionsLoading(true);
        const response = await getGCResolutions(token, tenure_id);
        if (response && response.resolutions) {
          setResolutions(response.resolutions);
        } else {
          setResolutions([]);
        }
        setResolutionsError(null);
      } catch (err) {
        console.error("Error fetching resolutions:", err);
        setResolutionsError(
          "Failed to load resolutions. Please try again later."
        );
        setResolutions([]);
      } finally {
        setResolutionsLoading(false);
      }
    };

    const fetchTenures = async () => {
      try {
        setTenuresLoading(true);
        console.log(
          "Fetching management tenures with token:",
          token ? "Token present" : "No token"
        );
        const data = await getAllManagementTenures(token);
        console.log("Management tenures fetched successfully:", data);

        if (data && Array.isArray(data)) {
          setTenures(data);
          setTenuresError(null);
          console.log("Set tenures state:", data.length, "tenures");
        } else {
          console.error("Invalid tenures data received:", data);
          setTenuresError("Invalid data format received");
          setTenures([]);
        }
      } catch (err) {
        console.error("Error fetching tenures:", err);
        console.error("Error details:", err.response?.data);
        setTenuresError(
          err.message || "Failed to load tenures. Please try again later."
        );
        setTenures([]);
      } finally {
        setTenuresLoading(false);
      }
    };

    if (token) {
      fetchInstitutes();
      fetchResolutions(selectedTenure || null);
      fetchTenures();
    }
  }, [token, selectedTenure]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFileData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Validation: Agenda file is always required (for both add and edit)
      if (!editingId && !fileData.agenda) {
        // For new resolutions, agenda file is mandatory
        setFormError("Agenda file is required");
        setIsSubmitting(false);
        return;
      }

      if (editingId && !fileData.agenda) {
        // For editing, check if there's an existing agenda file
        const existingResolution = resolutions.find((r) => r.id === editingId);
        if (!existingResolution?.agenda_file_path) {
          setFormError("Agenda file is required");
          setIsSubmitting(false);
          return;
        }
      }

      // Create FormData for file uploads
      const submitData = new FormData();

      // Add regular form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Add file fields
      Object.keys(fileData).forEach((key) => {
        if (fileData[key]) {
          submitData.append(key, fileData[key]);
        }
      });

      if (editingId) {
        // Update existing resolution
        await updateGCResolution(editingId, submitData, token);
        console.log("Resolution updated successfully");
      } else {
        // Add new resolution
        await createGCResolution(submitData, token);
        //console.log("Resolution added successfully");
      }
      // Reset form and close modal
      setFormData({
        agenda: "",
        resolution: "",
        compliance: "",
        meeting_notes: "",
        gc_date: "",
        institute_id: "",
        tenure_id: "",
      });
      setFileData({
        agenda: null,
        resolution: null,
        compliance: null,
        meeting_notes: null,
      });
      setIsModalOpen(false);
      setEditingId(null);
      // Refresh resolutions list
      const response = await getGCResolutions(token);
      if (response && response.resolutions) {
        setResolutions(response.resolutions);
      }
    } catch (err) {
      console.error("Error saving resolution:", err);
      setFormError("Failed to save resolution. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to open modal for editing
  const openEditModal = async (resolution) => {
    console.log(
      "Opening edit modal for resolution:",
      resolution.id,
      "current tenures:",
      tenures.length
    );

    // Fetch tenures if not already loaded or if there's an error
    if (tenures.length === 0 || tenuresError) {
      console.log("Fetching tenures for edit modal");
      try {
        setTenuresLoading(true);
        const data = await getAllManagementTenures(token);
        console.log("Fetched tenures for edit modal:", data);
        if (data && Array.isArray(data)) {
          setTenures(data);
          setTenuresError(null);
        }
      } catch (err) {
        console.error("Error fetching tenures for edit modal:", err);
        setTenuresError(err.message || "Failed to load tenures");
      } finally {
        setTenuresLoading(false);
      }
    }

    setFormData({
      agenda: resolution.agenda,
      resolution: resolution.resolution,
      compliance: resolution.compliance || "",
      meeting_notes: resolution.meeting_notes || "",
      gc_date: resolution.gc_date,
      institute_id: resolution.institute_id,
      tenure_id: resolution.tenure_id || "",
    });
    // Clear file selection for editing (show current files, but no new files selected)
    setFileData({
      agenda: null,
      resolution: null,
      compliance: null,
      meeting_notes: null,
    });
    setEditingId(resolution.id);
    setIsModalOpen(true);
    setFormError(null);
  };

  // Function to reset form when opening modal for new resolution
  const openAddModal = async () => {
    console.log("Opening add modal - current tenures:", tenures.length);

    // Fetch tenures if not already loaded or if there's an error
    if (tenures.length === 0 || tenuresError) {
      console.log("Fetching tenures for add modal");
      try {
        setTenuresLoading(true);
        const data = await getAllManagementTenures(token);
        console.log("Fetched tenures for add modal:", data);
        if (data && Array.isArray(data)) {
          setTenures(data);
          setTenuresError(null);
        }
      } catch (err) {
        console.error("Error fetching tenures for add modal:", err);
        setTenuresError(err.message || "Failed to load tenures");
      } finally {
        setTenuresLoading(false);
      }
    }

    setFormData({
      agenda: "",
      resolution: "",
      compliance: "",
      meeting_notes: "",
      gc_date: "",
      institute_id: "",
      tenure_id: "",
    });
    setFileData({
      agenda: null,
      resolution: null,
      compliance: null,
      meeting_notes: null,
    });
    setEditingId(null);
    setIsModalOpen(true);
    setFormError(null);
  };

  // Function to handle delete
  const handleDelete = async (id) => {
    // Show confirmation alert
    if (
      window.confirm(
        "Are you sure you want to delete this resolution? This action cannot be undone."
      )
    ) {
      try {
        // Call delete API
        await deleteGCResolution(id, token);
        console.log("Resolution deleted successfully");
        // Refresh resolutions list
        const response = await getGCResolutions(token);
        if (response && response.resolutions) {
          setResolutions(response.resolutions);
        }
      } catch (err) {
        console.error("Error deleting resolution:", err);
        setFormError("Failed to delete resolution. Please try again.");
      }
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate("");
  };

  // Handle tenure filter change
  const handleTenureFilterChange = (e) => {
    setSelectedTenure(e.target.value);
  };

  // Clear tenure filter
  const clearTenureFilter = () => {
    setSelectedTenure("");
  };

  // Get latest date from resolutions
  const getLatestDate = () => {
    if (resolutions.length === 0) return "";
    const dates = resolutions.map((r) => r.gc_date).sort();
    return dates[dates.length - 1];
  };

  // Set latest date as default when resolutions are loaded
  useEffect(() => {
    if (resolutions.length > 0 && !selectedDate) {
      const latestDate = getLatestDate();
      setSelectedDate(latestDate);
    }
  }, [resolutions]);

  // Filter resolutions based on search term, selected date, and selected tenure
  const filteredResolutions = resolutions.filter((resolution) => {
    // Apply date filter if a date is selected
    if (selectedDate && resolution.gc_date !== selectedDate) {
      return false;
    }

    // Apply tenure filter if a tenure is selected
    if (
      selectedTenure &&
      resolution.tenure_id &&
      resolution.tenure_id !== parseInt(selectedTenure)
    ) {
      return false;
    }

    const institute = institutes.find((i) => i.id === resolution.institute_id);
    return (
      resolution.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.resolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resolution.compliance &&
        resolution.compliance
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      institute?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resolution.gc_date.includes(searchTerm)
    );
  });

  // Reset to first page when search term, date filter, or tenure filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, selectedTenure]);

  // Helper function to get institute name by id
  const getInstituteName = (instituteId) => {
    const institute = institutes.find((i) => i.id === instituteId);
    return institute ? institute.name : "Unknown";
  };

  // Helper function to get tenure name by id
  const getTenureName = (tenureId) => {
    if (!tenureId) return "Not Assigned";
    const tenure = tenures.find((t) => t.id === tenureId);
    return tenure ? tenure.tenure : "Unknown";
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to download PDF
  const downloadPDF = async () => {
    if (filteredResolutions.length === 0) {
      alert("No resolutions available to download");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Get first resolution to extract some basic info
      const firstItem = filteredResolutions[0];

      // ✅ Get institute info from logged-in institute admin's user data
      const userInstituteId = user?.institute_id;
      const currentInstitute = institutes.find(
        (inst) => inst.id === parseInt(userInstituteId)
      );

      const instituteCode = currentInstitute?.code || "N/A";
      const instituteName = currentInstitute?.name || "N/A";
      const gcDate = firstItem?.gc_date ? formatDate(firstItem.gc_date) : "N/A";

      // ✅ Tenure calculation
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

      // ==== HEADING ====
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 15;

      // Logo
      try {
        const logoImg = new Image();
        logoImg.src = "/image.png";

        await new Promise((resolve) => {
          logoImg.onload = () => {
            try {
              const logoWidth = 30;
              const logoHeight = 30;
              const logoX = (pageWidth - logoWidth) / 2;
              pdf.addImage(logoImg, "PNG", logoX, y, logoWidth, logoHeight);
            } catch (err) {
              console.warn("Could not add logo:", err);
            }
            resolve();
          };
          logoImg.onerror = () => resolve();
        });
      } catch (err) {
        console.warn("Error loading logo:", err);
      }

      y += 35;

      // Main Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("KARNATAK LAW SOCIETY'S", pageWidth / 2, y, { align: "center" });
      y += 6;

      // Institute Name - ✅ Now uses the logged-in institute admin's institute
      pdf.setFontSize(14);
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

      // Ref & Date
      pdf.setFontSize(10);
      pdf.text(`Ref. No KLS/Resolution/${instituteCode}`, 15, y);
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
      pdf.text(
        `The 01st meeting of the Governing Council (${tenure}), will be held on ${gcDate} at 4:00pm`,
        15,
        y
      );
      y += 4;
      pdf.text(`Council Room of KLS-${instituteCode}.`, 15, y);
      y += 6;

      // Request
      pdf.text(
        "All members of the Governing Council are requested to make it convenient to attend the meeting.",
        15,
        y
      );
      y += 10;

      // Agenda header
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`AGENDA of GC-${instituteCode} MEETING`, pageWidth / 2, y, {
        align: "center",
      });
      y += 10;

      // ==== RESOLUTIONS ====
      // Table headers - make normal weight
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("S.No", 14, y);
      pdf.text("Agenda", 30, y);
      y += 5;
      pdf.line(14, y, pageWidth - 14, y);
      y += 5;

      // Resolution content - set to normal font
      pdf.setFont("helvetica", "normal");
      filteredResolutions.forEach((resolution, index) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }

        // S.No - normal weight
        pdf.text(`${index + 1}`, 14, y);

        // Agenda content - normal weight
        const agendaText = `Resolution ${index + 1}`;
        const splitText = pdf.splitTextToSize(agendaText, pageWidth - 44);
        pdf.text(splitText, 30, y);

        y += splitText.length * 5;
      });

      // Save PDF
      const filename = firstItem
        ? `GC_Resolution_${
            firstItem.gc_date
              ? formatDate(firstItem.gc_date).replace(/\s/g, "_")
              : "Unknown_Date"
          }.pdf`
        : "GC_Resolutions.pdf";

      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <Header />
      <DashboardLayout>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          {/* Enhanced Breadcrumb Navigation */}
          <div className="w-full px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mx-auto max-w-7xl">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={goToDashboard}
                  className="flex items-center px-3 py-2 text-gray-600 transition-all duration-200 rounded-lg hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </button>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium text-indigo-600">
                  GC Resolutions
                </span>
              </nav>

              {/* Download PDF Button */}
              <button
                onClick={downloadPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 w-full bg-gray-50">
            <div className="w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {/* Enhanced Header Section */}
              <div className="mb-10">
                <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text">
                      Governing Council Resolutions
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg leading-relaxed text-gray-600">
                      Comprehensive management system for tracking, organizing,
                      and maintaining all Governing Council resolutions with
                      detailed compliance monitoring
                    </p>
                  </div>
                </div>
              </div>
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 gap-6 mb-10 sm:grid-cols-2 lg:grid-cols-2">
                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Total Resolutions
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {resolutions.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        With Compliance
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {
                          resolutions.filter(
                            (r) => r.compliance && r.compliance.trim() !== ""
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* <div className="p-6 transition-all duration-300 transform bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="p-4 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold tracking-wide text-gray-600 uppercase">
                        Total Sections
                      </p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {Object.keys(groupedResolutions).length}
                      </p>
                    </div>
                  </div>
                </div> */}
              </div>
              {/* Enhanced Action Bar */}
              <div className="p-6 mb-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
                  {/* Search and Filter Section */}
                  <div className="flex flex-col items-start w-full gap-4 sm:flex-row lg:w-auto">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="Search by agenda, resolution, compliance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-3 pl-12 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute w-5 h-5 text-gray-400 left-4 top-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center w-full gap-2 sm:w-auto">
                      <div className="relative w-full sm:w-48">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={handleDateFilterChange}
                          className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute w-5 h-5 text-gray-400 left-3 top-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      {selectedDate && (
                        <button
                          onClick={clearDateFilter}
                          className="p-3 text-gray-500 transition-colors duration-200 bg-gray-100 rounded-lg hover:text-gray-700 hover:bg-gray-200"
                          title="Clear date filter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Tenure Filter */}
                    <div className="flex items-center w-full gap-2 sm:w-auto">
                      <div className="relative w-full sm:w-48">
                        <select
                          value={selectedTenure}
                          onChange={handleTenureFilterChange}
                          className="w-full py-3 pl-10 pr-4 transition-all duration-200 bg-white border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Tenures</option>
                          {tenures.map((tenure) => (
                            <option key={tenure.id} value={tenure.id}>
                              {tenure.tenure_period}
                            </option>
                          ))}
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute w-5 h-5 text-gray-400 left-3 top-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-14 0h2m-2 0h-2m16 0v2a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2m0 0h4m-6 0V5a2 2 0 012-2h4a2 2 0 012 2v16m-6 0h6"
                          />
                        </svg>
                      </div>
                      {selectedTenure && (
                        <button
                          onClick={clearTenureFilter}
                          className="p-3 text-gray-500 transition-colors duration-200 bg-gray-100 rounded-lg hover:text-gray-700 hover:bg-gray-200"
                          title="Clear tenure filter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Latest Date Info */}
                    {selectedDate === getLatestDate() &&
                      resolutions.length > 0 && (
                        <div className="flex items-center px-3 py-2 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Latest GC as on ({formatDate(selectedDate)})
                        </div>
                      )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col w-full gap-3 sm:flex-row lg:w-auto">
                    <button
                      onClick={openAddModal}
                      className="flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-300 transform shadow-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mr-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add New Resolution
                    </button>
                  </div>
                </div>
              </div>
              {/* Enhanced Resolutions Table */}
              <div className="mb-10 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
                {resolutionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading resolutions...</p>
                  </div>
                ) : resolutionsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-16 h-16 mb-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <h3 className="mb-1 text-lg font-medium text-gray-900">
                      Error loading resolutions
                    </h3>
                    <p className="text-gray-600">{resolutionsError}</p>
                  </div>
                ) : filteredResolutions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-16 h-16 mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      No resolutions found
                    </h3>
                    <p className="max-w-md mb-6 text-center text-gray-600">
                      {searchTerm || selectedDate || selectedTenure
                        ? `No resolutions match your search criteria. Try adjusting your search terms, date filter, or tenure filter.`
                        : "Start by adding your first GC resolution to begin tracking and managing council decisions."}
                    </p>
                    {!searchTerm && !selectedDate && !selectedTenure && (
                      <button
                        onClick={openAddModal}
                        className="flex items-center px-6 py-3 text-white transition-colors duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add First Resolution
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            S.NO
                          </th>

                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Tenure
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Agenda
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Resolution
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Compliance
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Meeting Notes
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Details
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResolutions.map((resolution, index) => (
                          <tr key={resolution.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {index + 1}
                            </td>

                            <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                              {getTenureName(resolution.tenure_id)}
                            </td>
                            <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                              <FileDownloadLink
                                filename={resolution.agenda}
                                label="Agenda"
                                token={token}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-justify text-gray-500 break-words w-72">
                              <FileDownloadLink
                                filename={resolution.resolution}
                                label="Resolution"
                                token={token}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words w-72">
                              <FileDownloadLink
                                filename={resolution.compliance}
                                label="Compliance"
                                token={token}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words w-72">
                              <FileDownloadLink
                                filename={resolution.meeting_notes}
                                label="Meeting Notes"
                                token={token}
                              />
                            </td>
                            <td className="w-16 px-6 py-4 text-sm text-gray-500 break-words">
                              <div className="flex flex-col">
                                <span>
                                  {getInstituteName(resolution.institute_id)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Dated - {formatDate(resolution.gc_date)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 break-words">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(resolution)}
                                  className="mr-3 text-indigo-600 hover:text-indigo-900"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(resolution.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {filteredResolutions.length > 0 && (
                <div className="p-4 mt-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Total:{" "}
                      <span className="font-medium text-gray-900">
                        {filteredResolutions.length}
                      </span>{" "}
                      resolutions
                      {selectedDate && (
                        <span> for {formatDate(selectedDate)}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
              {/* Add/Edit Resolution Modal */}
              {isModalOpen && (
                <div
                  className="fixed inset-0 z-50 overflow-y-auto"
                  aria-labelledby="modal-title"
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                    <div
                      className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                      aria-hidden="true"
                      onClick={() => setIsModalOpen(false)}
                    ></div>
                    <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                      <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 mr-4 bg-white rounded-full bg-opacity-20">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3
                                className="text-xl font-bold leading-6 text-white"
                                id="modal-title"
                              >
                                {editingId
                                  ? "Edit Resolution"
                                  : "Add New Resolution"}
                              </h3>
                              <p className="mt-1 text-sm text-indigo-100">
                                {editingId
                                  ? "Update the resolution details below"
                                  : "Fill in the details to create a new GC resolution"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="p-2 text-white transition-all duration-200 rounded-full hover:text-gray-200 focus:outline-none hover:bg-white hover:bg-opacity-20"
                            onClick={() => setIsModalOpen(false)}
                          >
                            <svg
                              className="w-6 h-6"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="px-8 py-6 bg-white">
                        {formError && (
                          <div className="flex items-start p-4 mb-6 text-red-800 border border-red-200 bg-red-50 rounded-xl">
                            <svg
                              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <div>
                              <h4 className="font-medium">Error occurred</h4>
                              <p className="mt-1 text-sm">{formError}</p>
                            </div>
                          </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <label
                                htmlFor="gc_date"
                                className="block mb-3 text-sm font-semibold text-gray-700"
                              >
                                GC Date *
                              </label>
                              <input
                                type="date"
                                id="gc_date"
                                name="gc_date"
                                value={formData.gc_date}
                                onChange={handleInputChange}
                                className="block w-full py-3 pl-4 pr-4 transition-all duration-200 border border-gray-300 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <label
                                htmlFor="tenure_id"
                                className="block mb-2 text-sm font-medium text-gray-700"
                              >
                                Management Tenure
                                {process.env.NODE_ENV === "development" && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Debug: {tenures.length} tenures loaded,
                                    Loading: {tenuresLoading ? "Yes" : "No"},
                                    Error: {tenuresError ? "Yes" : "No"})
                                  </span>
                                )}
                              </label>
                              <select
                                id="tenure_id"
                                name="tenure_id"
                                value={formData.tenure_id}
                                onChange={handleInputChange}
                                className="block w-full py-3 pl-4 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                              >
                                <option value="">Select tenure</option>
                                {tenuresLoading ? (
                                  <option disabled>Loading tenures...</option>
                                ) : tenuresError ? (
                                  <option disabled>
                                    Error loading tenures: {tenuresError}
                                  </option>
                                ) : tenures.length === 0 ? (
                                  <option disabled>No tenures available</option>
                                ) : (
                                  tenures.map((tenure) => (
                                    <option key={tenure.id} value={tenure.id}>
                                      {tenure.tenure}
                                    </option>
                                  ))
                                )}
                              </select>
                              {tenuresError && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      console.log("Manual refresh of tenures");
                                      try {
                                        setTenuresLoading(true);
                                        const data =
                                          await getAllManagementTenures(token);
                                        if (data && Array.isArray(data)) {
                                          setTenures(data);
                                          setTenuresError(null);
                                        }
                                      } catch (err) {
                                        console.error(
                                          "Manual refresh error:",
                                          err
                                        );
                                        setTenuresError(err.message);
                                      } finally {
                                        setTenuresLoading(false);
                                      }
                                    }}
                                    className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                                    disabled={tenuresLoading}
                                  >
                                    {tenuresLoading
                                      ? "Refreshing..."
                                      : "Retry Loading Tenures"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="agenda"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Agenda File{" "}
                              {(!editingId ||
                                (editingId && !formData.agenda)) &&
                                "*"}
                            </label>
                            {editingId && formData.agenda && (
                              <div className="p-2 mb-2 border border-blue-200 rounded bg-blue-50">
                                <p className="text-sm text-blue-700">
                                  Current file:
                                  <FileDownloadLink
                                    filename={formData.agenda}
                                    label="Download current agenda"
                                    token={token}
                                  />
                                </p>
                                <p className="mt-1 text-xs text-blue-600">
                                  Upload a new file to replace the current one
                                </p>
                              </div>
                            )}
                            <input
                              type="file"
                              name="agenda"
                              id="agenda"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required={
                                !editingId || (editingId && !formData.agenda)
                              }
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Upload agenda document (PDF, DOC, DOCX, TXT)
                            </p>
                            {fileData.agenda && (
                              <p className="mt-1 text-sm text-green-600">
                                Selected: {fileData.agenda.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="resolution"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Resolution File
                            </label>
                            {editingId && formData.resolution && (
                              <div className="p-2 mb-2 border border-blue-200 rounded bg-blue-50">
                                <p className="text-sm text-blue-700">
                                  Current file:
                                  <FileDownloadLink
                                    filename={formData.resolution}
                                    label="Download current resolution"
                                    token={token}
                                  />
                                </p>
                                <p className="mt-1 text-xs text-blue-600">
                                  Upload a new file to replace the current one
                                </p>
                              </div>
                            )}
                            <input
                              type="file"
                              name="resolution"
                              id="resolution"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Upload resolution document (PDF, DOC, DOCX, TXT)
                            </p>
                            {fileData.resolution && (
                              <p className="mt-1 text-sm text-green-600">
                                Selected: {fileData.resolution.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="compliance"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Compliance File
                              <span className="ml-1 font-normal text-gray-400">
                                (Optional)
                              </span>
                            </label>
                            {editingId && formData.compliance && (
                              <div className="p-2 mb-2 border border-blue-200 rounded bg-blue-50">
                                <p className="text-sm text-blue-700">
                                  Current file:
                                  <FileDownloadLink
                                    filename={formData.compliance}
                                    label="Download current compliance"
                                    token={token}
                                  />
                                </p>
                                <p className="mt-1 text-xs text-blue-600">
                                  Upload a new file to replace the current one
                                </p>
                              </div>
                            )}
                            <input
                              type="file"
                              name="compliance"
                              id="compliance"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Upload compliance document (PDF, DOC, DOCX, TXT)
                            </p>
                            {fileData.compliance && (
                              <p className="mt-1 text-sm text-green-600">
                                Selected: {fileData.compliance.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="meeting_notes"
                              className="block mb-3 text-sm font-semibold text-gray-700"
                            >
                              Meeting Notes File
                              <span className="ml-1 font-normal text-gray-400">
                                (Optional)
                              </span>
                            </label>
                            {editingId && formData.meeting_notes && (
                              <div className="p-2 mb-2 border border-blue-200 rounded bg-blue-50">
                                <p className="text-sm text-blue-700">
                                  Current file:
                                  <FileDownloadLink
                                    filename={formData.meeting_notes}
                                    label="Download current meeting notes"
                                    token={token}
                                  />
                                </p>
                                <p className="mt-1 text-xs text-blue-600">
                                  Upload a new file to replace the current one
                                </p>
                              </div>
                            )}
                            <input
                              type="file"
                              name="meeting_notes"
                              id="meeting_notes"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.txt"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Upload meeting notes document (PDF, DOC, DOCX,
                              TXT)
                            </p>
                            {fileData.meeting_notes && (
                              <p className="mt-1 text-sm text-green-600">
                                Selected: {fileData.meeting_notes.name}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col justify-end pt-6 space-y-3 border-t border-gray-200 sm:flex-row sm:space-y-0 sm:space-x-4">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-sm rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-white transition-all duration-200 border border-transparent shadow-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-3 animate-spin"
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
                                  {editingId ? "Updating..." : "Saving..."}
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  {editingId
                                    ? "Update Resolution"
                                    : "Create Resolution"}
                                </span>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </DashboardLayout>
    </>
  );
};

export default AddGCResolution;
