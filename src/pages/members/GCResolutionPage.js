import React, { useEffect, useState, useRef } from "react";
import { getGCResolutions } from "../../api/gcResolutions";
import { getInstitutes } from "../../api/institutes";
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

const GCResolutionPage = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [formData, setFormData] = useState({ tenure: getCurrentTenure() });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState(""); // Changed from "all" to empty string
  const [apiError, setApiError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const expandedContentRef = useRef(null);

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

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

        // Set first institute as selected by default
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

      // Custom Heading for PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 18;
      pdf.setFontSize(15);
      pdf.setFont("helvetica", "bold");
      const title1 =
        "Karnatak Law Society's Gogte Institute of Technology, Belagavi";
      const title2 =
        "Minutes of Meeting of the Governing Council of KLS GIT (Eng Section)";
      const title3 = `Held on ${
        firstItem && firstItem.gc_date ? formatDate(firstItem.gc_date) : "N/A"
      } in Board Rooms of KLS, Tilakwadi, Belagavi`;
      pdf.text(title1, pageWidth / 2, y, { align: "center" });
      y += 8;
      pdf.setFontSize(13);
      pdf.text(title2, pageWidth / 2, y, { align: "center" });
      y += 8;
      pdf.setFontSize(12);
      pdf.text(title3, pageWidth / 2, y, { align: "center" });
      y += 8;
      pdf.line(15, y, pageWidth - 15, y);
      y += 5;

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
    const title1 =
      "Karnatak Law Society's Gogte Institute of Technology, Belagavi";
    const title2 =
      "Minutes of Meeting of the Governing Council of KLS GIT (Eng Section)";
    const title3 = `Held on ${
      firstItem && firstItem.gc_date ? formatDate(firstItem.gc_date) : "N/A"
    } in Board Rooms of KLS, Tilakwadi, Belagavi`;
    const printWindow = window.open("", "", "height=800,width=900");
    printWindow.document.write(
      `<html><head><title>Print GC Resolution</title>` +
        '<link rel="stylesheet" href="/index.css" />' +
        `</head><body style='font-family: Arial, sans-serif;'>` +
        `<div style='text-align:center;margin-bottom:10px;'>` +
        `<h2 style='margin:0;'>${title1}</h2>` +
        `<div style='font-size:18px;font-weight:bold;margin-bottom:2px;'>${title2}</div>` +
        `<div style='font-size:15px;margin-bottom:10px;'>${title3}</div>` +
        `<hr style='margin-bottom:20px;'/>` +
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

    // Only show data for the selected institute
    const matchesInstitute =
      String(item.institute_id) === String(selectedInstitute);

    let matchesTenure = true;
    if (formData.tenure) {
      if (item.gc_date) {
        const gcYear = new Date(item.gc_date).getFullYear();
        // Calculate the tenure for this resolution
        let itemTenure = "";
        for (let start = 2021; start <= gcYear; start++) {
          const end = start + 2;
          if (gcYear >= start && gcYear <= end) {
            itemTenure = `${start}-${end}`;
            break;
          }
        }
        matchesTenure = itemTenure === formData.tenure;
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
          {/* Institute Tabs & Tenure Dropdown */}
          {!isLoading && filteredInstitutes.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {/* Only show tabs for institutes with resolutions */}
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

                {/* Tenure Dropdown */}
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
                    value={formData?.tenure || ""}
                    onChange={handleInputChange}
                    className="block w-40 py-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Tenure</option>
                    {Array.from({ length: 6 }, (_, i) => {
                      const start = 2021 + i;
                      const end = start + 2;
                      return (
                        <option key={start} value={`${start}-${end}`}>
                          {start}-{end}
                        </option>
                      );
                    })}
                  </select>
                </div>
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

          {/* Table - Grouped by Date */}
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
                                    <div className="grid grid-cols-1 gap-6">
                                      {items.map((item, i) => (
                                        <React.Fragment key={item.id || i}>
                                          <div className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                                            <div className="mb-2 text-sm font-semibold text-indigo-700">
                                              GC No: {item.gc_no || "N/A"}
                                            </div>
                                            <div className="mb-2 text-xs text-gray-500">
                                              <span className="font-medium">
                                                Date:
                                              </span>{" "}
                                              {item.gc_date
                                                ? formatDate(item.gc_date)
                                                : "N/A"}
                                            </div>
                                            <div className="mb-2">
                                              <span className="font-medium">
                                                Agenda:
                                              </span>{" "}
                                              {item.agenda || "N/A"}
                                            </div>
                                            <div className="mb-2">
                                              <span className="font-medium">
                                                Resolution:
                                              </span>{" "}
                                              {item.resolution || "N/A"}
                                            </div>
                                            <div className="mb-2">
                                              <span className="font-medium">
                                                Compliance:
                                              </span>{" "}
                                              {item.compliance || "N/A"}
                                            </div>
                                            <div className="mb-2">
                                              <span className="font-medium">
                                                Institute:
                                              </span>{" "}
                                              {getInstituteName(
                                                item.institute_id
                                              )}
                                            </div>
                                          </div>
                                          <hr
                                            style={{
                                              borderTop: "1px solid #e5e7eb",
                                              margin: "16px 0",
                                            }}
                                          />
                                        </React.Fragment>
                                      ))}
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
    </div>
  );
};

export default GCResolutionPage;
