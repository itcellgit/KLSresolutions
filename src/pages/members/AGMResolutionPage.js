import React, { useEffect, useState, useRef } from "react";
import { getAGMs } from "../../api/agm";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Header from "../../components/Header";

const AGMResolutionPage = () => {
  const [agmResolutions, setAGMResolutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const expandedContentRef = useRef(null);

  // For print
  const handlePrint = () => {
    if (!expandedContentRef.current) return;
    // Get the expanded date for heading
    let heading = "AGM Resolutions";
    let dateText = "Date: N/A";
    if (expandedId && expandedId !== "N/A") {
      heading = "AGM Resolutions";
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
    printWindow.document.write(
      "<html><head><title>Print AGM Resolutions</title>"
    );
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
      const heading = "AGM RESOLUTIONS";
      const agmDate = expandedId !== "N/A" ? expandedId : null;
      const dateText = agmDate ? `Date: ${formatDate(agmDate)}` : "Date: N/A";
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
      const filename = agmDate
        ? `AGM_Resolutions_${formatDate(agmDate).replace(/\s/g, "_")}.pdf`
        : "AGM_Resolutions.pdf";
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAGMResolutions = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getAGMs(token);
        setAGMResolutions(data);
      } catch (err) {
        console.error("Error fetching AGM resolutions:", err);
        if (err.response && err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          localStorage.removeItem("token");
        } else {
          setError("Failed to fetch AGM resolutions. Please try again later.");
        }
        setAGMResolutions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAGMResolutions();
  }, [token]);

  const handleBackClick = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    navigate("/member/dashboard", { replace: true });
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

      const currentResolution = agmResolutions.find(
        (item) => (item.id || agmResolutions.indexOf(item)) === expandedId
      );

      const heading = "AGM RESOLUTION DETAILS";
      const agmDate = currentResolution?.agm_date;
      const dateText = agmDate ? `Date: ${formatDate(agmDate)}` : "Date: N/A";

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

      const filename = currentResolution
        ? `AGM_Resolution_${
            agmDate ? formatDate(agmDate).replace(/\s/g, "_") : "Unknown_Date"
          }.pdf`
        : "AGM_Resolution_Details.pdf";

      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filter and group resolutions by date
  const filteredData = agmResolutions.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.agm_date && item.agm_date.toLowerCase().includes(searchLower)) ||
      (item.agenda && item.agenda.toLowerCase().includes(searchLower)) ||
      (item.notes && item.notes.toLowerCase().includes(searchLower))
    );
  });

  // Group by date
  const groupedByDate = filteredData.reduce((acc, item) => {
    const dateKey = item.agm_date || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});
  const groupedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b) - new Date(a)
  );

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
              Annual General Meeting Resolutions
            </h1>
            <p className="max-w-2xl mx-auto mt-2 text-gray-600">
              View and search all resolutions passed at Annual General Meetings
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
                Loading AGM Resolutions...
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
                  placeholder="Search resolutions by date, agenda, notes..."
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
              <div className="flex items-center px-4 py-3 rounded-lg bg-indigo-50">
                <span className="text-sm text-indigo-800">
                  Showing{" "}
                  <span className="font-bold">{filteredData.length}</span> of{" "}
                  <span className="font-bold">{agmResolutions.length}</span>{" "}
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
                      AGM Date
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
                              {dateKey !== "N/A" ? formatDate(dateKey) : "N/A"}
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
                                      AGM Resolutions for{" "}
                                      {dateKey !== "N/A"
                                        ? formatDate(dateKey)
                                        : "N/A"}
                                    </h3>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={generateGroupPDF}
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
                                            Resolution No:-{i + 1}
                                          </div>
                                          <div className="mb-2 text-xs text-gray-500">
                                            <span className="font-medium">
                                              Date:
                                            </span>{" "}
                                            {item.agm_date
                                              ? formatDate(item.agm_date)
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
                                            {item.notes ? (
                                              <ul className="list-disc ml-6">
                                                {item.notes
                                                  .split(/\r?\n|•|\d+\.|- /)
                                                  .filter(
                                                    (point) =>
                                                      point.trim() !== ""
                                                  )
                                                  .map((point, idx) => (
                                                    <li key={idx}>
                                                      {point.trim()}
                                                    </li>
                                                  ))}
                                              </ul>
                                            ) : (
                                              "No notes available"
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
                          {error
                            ? "Unable to load data due to authentication error."
                            : searchTerm
                            ? "No resolutions found matching your search criteria."
                            : "No AGM resolutions available."}
                        </h3>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="px-4 py-2 mt-4 text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700"
                          >
                            Clear Search
                          </button>
                        )}
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
  );
};

export default AGMResolutionPage;
