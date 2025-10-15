import { API_BASE_URL } from "../../config";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  TouchableWithoutFeedback,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import HeaderMobile from "../../components/HeaderMobile";
import { WebView } from "react-native-webview";

const GCResolutionPageMobile = () => {
  const [gcResolutions, setGCResolutions] = useState([]);
  const [tenures, setTenures] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tenureDropdownVisible, setTenureDropdownVisible] = useState(false);

  // PDF viewer state
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfHtml, setPdfHtml] = useState("");
  const [currentPdfType, setCurrentPdfType] = useState("");
  const [fileError, setFileError] = useState("");
  const [viewingPDF, setViewingPDF] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [latestLog, setLatestLog] = useState("");
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [pdfHeaders, setPdfHeaders] = useState({});
  const [pdfPending, setPdfPending] = useState(null);
  const [triedPdfJsFallback, setTriedPdfJsFallback] = useState(false);
  const [pdfWebViewHeight, setPdfWebViewHeight] = useState(
    Math.round(Dimensions.get("window").height * 0.5)
  );

  // PDF search state
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuth();
  const navigation = useNavigation();
  const webviewKeyRef = useRef(0);

  const getAuthToken = async () => {
    return user?.token || (await AsyncStorage.getItem("token"));
  };

  const buildPdfJsHtml = (remoteUrl, token) => {
    const tokenJson = JSON.stringify(token || "");
    const remoteJson = JSON.stringify(remoteUrl);

    const cdnCandidates = [
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
      "https://resolutions.kisbelagavi.org/static/pdfjs/pdf.min.js",
    ];

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>PDF Viewer</title>
  <style>
    html,body{height:100%;margin:0;padding:0;background:#f3f4f6;overflow-x:hidden}
    #viewer{display:block;width:100%;height:auto;overflow:visible;padding:10px 0}
    .pageCanvas{display:block;margin:8px auto;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:100%}
    #loading{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:system-ui;color:#374151;text-align:center}
    #error{padding:16px;color:#EF4444;font-family:system-ui;text-align:center}
    body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;}
    .controls{position:fixed;bottom:10px;right:10px;z-index:100;background:rgba(255,255,255,0.8);padding:5px;border-radius:5px}
    .controls button{margin:5px;padding:5px 10px;background:#4F46E5;color:white;border:none;border-radius:3px}
  </style>
</head>
<body>
  <div id="loading">
    <div>Initializing PDF Viewer...</div>
    <div style="font-size:12px;margin-top:5px">This may take a moment for large documents</div>
  </div>
  <div id="viewer"></div>
  <div id="error" style="display:none"></div>
  <div class="controls">
    <button id="zoomIn">Zoom In</button>
    <button id="zoomOut">Zoom Out</button>
  </div>

  <script>
    (function(){
      const remote = ${remoteJson};
      const token = ${tokenJson};
      const headers = token ? { Authorization: 'Bearer ' + token } : {};
      const cdnCandidates = ${JSON.stringify(cdnCandidates)};
      let currentScale = 1.2;

      function postMessage(type, message) {
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type, message })); } catch(e) {}
      }

      function showError(msg){
        document.getElementById('loading').style.display='none';
        const errEl = document.getElementById('error');
        errEl.style.display = 'block';
        errEl.textContent = msg;
        postMessage('error', msg);
      }

      function renderPage(pdf, pageNumber) {
        pdf.getPage(pageNumber).then(page => {
          const viewport = page.getViewport({ scale: currentScale });
          
          // Create container for this page
          const container = document.createElement('div');
          container.style.marginBottom = '20px';
          container.id = 'page-container-' + pageNumber;
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.className = 'pageCanvas';
          const context = canvas.getContext('2d');
          
          // Set canvas dimensions
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          container.appendChild(canvas);
          document.getElementById('viewer').appendChild(container);
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          page.render(renderContext).promise.then(() => {
            // Notify native about height changes
            updateHeight();
            postMessage('log', 'Rendered page ' + pageNumber);
          });
        }).catch(error => {
          postMessage('error', 'Error rendering page ' + pageNumber + ': ' + error.message);
          showError('Error rendering page ' + pageNumber);
        });
      }

      function updateHeight() {
        try {
          const height = document.body.scrollHeight;
          postMessage('height', String(height));
        } catch(e) {}
      }

      function loadAndRenderPdf() {
        postMessage('log', 'PDF.js library loaded. Starting fetch for PDF.');
        document.getElementById('loading').innerHTML = '<div>Fetching PDF file...</div><div style="font-size:12px;margin-top:5px">This may take a moment</div>';
        
        fetch(remote, { method: 'GET', headers })
          .then(resp => {
            postMessage('log', 'Fetch response received. Status: ' + resp.status);
            if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
            return resp.arrayBuffer();
          })
          .then(buffer => {
            postMessage('log', 'PDF data received. Starting render.');
            document.getElementById('loading').innerHTML = '<div>Rendering PDF...</div><div style="font-size:12px;margin-top:5px">Please wait</div>';
            
            const bytes = new Uint8Array(buffer);
            const loadingTask = pdfjsLib.getDocument({ data: bytes });
            
            loadingTask.promise.then(pdf => {
              document.getElementById('loading').style.display='none';
              postMessage('log', 'PDF loaded with ' + pdf.numPages + ' pages. Rendering pages.');
              
              // Render all pages
              for (let i = 1; i <= pdf.numPages; i++) {
                renderPage(pdf, i);
              }
              
              // Add zoom controls
              document.getElementById('zoomIn').addEventListener('click', () => {
                currentScale += 0.2;
                rerenderAllPages(pdf);
              });
              
              document.getElementById('zoomOut').addEventListener('click', () => {
                currentScale = Math.max(0.5, currentScale - 0.2);
                rerenderAllPages(pdf);
              });
              
              postMessage('loaded', 'PDF rendered successfully.');
            }).catch(error => {
              postMessage('error', 'Error loading PDF: ' + error.message);
              showError('Error loading PDF: ' + error.message);
            });
          })
          .catch(err => {
            postMessage('error', 'Error in PDF processing: ' + (err && err.message ? err.message : err));
            showError('Error loading PDF: ' + (err && err.message ? err.message : err));
          });
      }
      
      function rerenderAllPages(pdf) {
        // Clear existing pages
        document.getElementById('viewer').innerHTML = '';
        
        // Re-render all pages with new scale
        for (let i = 1; i <= pdf.numPages; i++) {
          renderPage(pdf, i);
        }
      }

      function tryLoadPdfJs(cdns, idx) {
        if (idx >= cdns.length) {
          postMessage('error', 'CRITICAL: All CDN attempts failed for pdf.js');
          showError('Failed to load the PDF viewer library. Please check your internet connection or try again later.');
          return;
        }
        
        const url = cdns[idx];
        postMessage('log', 'Attempting pdf.js from: ' + url);
        
        // Load main script
        const script = document.createElement('script');
        script.src = url;
        script.onload = function() {
          postMessage('log', 'pdf.js script loaded from: ' + url);
          
          // Try to load worker
          const workerUrl = url.replace(/pdf(\\.min)?\\.js$/, 'pdf.worker.min.js');
          fetch(workerUrl)
            .then(resp => {
              if (!resp.ok) throw new Error('Worker fetch failed: ' + resp.status);
              return resp.text();
            })
            .then(workerText => {
              try {
                const blob = new Blob([workerText], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
                postMessage('log', 'pdf.worker loaded as blob, starting render.');
                loadAndRenderPdf();
              } catch (e) {
                postMessage('log', 'Failed to create worker blob, using remote worker URL as fallback.');
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
                loadAndRenderPdf();
              }
            })
            .catch(workerErr => {
              postMessage('log', 'Worker fetch failed: ' + String(workerErr) + ' — falling back to direct worker URL.');
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
              loadAndRenderPdf();
            });
        };
        
        script.onerror = function() {
          postMessage('log', 'pdf.js script failed from: ' + url + ' — trying next CDN');
          tryLoadPdfJs(cdns, idx + 1);
        };
        
        document.head.appendChild(script);
      }

      postMessage('log', 'Viewer will try multiple CDNs for pdf.js...');
      tryLoadPdfJs(cdnCandidates, 0);
      
      // Report height changes on resize
      window.addEventListener('resize', updateHeight);
    })();
  </script>
</body>
</html>
`;
  };

  const appendDebug = (msg) => {
    const text = String(msg);
    setDebugLogs((prev) => {
      const next = [...prev, text].slice(-50);
      setLatestLog(next[next.length - 1] || "");
      return next;
    });
    console.log("GC viewer:", text);
  };

  const safeParseJSON = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const fetchJsonWithLogging = async (url, options = {}) => {
    const resp = await fetch(url, options);
    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    const data = safeParseJSON(text);
    return data ?? text;
  };

  const performPdfSearch = async (searchText) => {
    if (!searchText || !searchText.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const token = await getAuthToken();
      const resp = await fetch(`${API_BASE_URL}/gc_resolutions/search-pdf`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm: searchText }),
      });
      const data = await resp.json();
      const results = data?.results || data || [];
      setSearchResults(results);
    } catch (err) {
      console.error("performPdfSearch error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getGCResolutions = async (token) => {
    const url =
      `${API_BASE_URL}/gc_resolutions` +
      (selectedTenure
        ? `?tenure_id=${encodeURIComponent(selectedTenure)}`
        : "");
    return fetchJsonWithLogging(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
    });
  };

  const getInstitutes = async (token) => {
    return fetchJsonWithLogging(`${API_BASE_URL}/institute`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
    });
  };

  const getAllManagementTenures = async (token) => {
    return fetchJsonWithLogging(`${API_BASE_URL}/management_tenures`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
    });
  };

  const fetchTenures = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getAllManagementTenures(token);
      const arr = Array.isArray(data) ? data : data?.data || [];
      setTenures(arr);
      if (!selectedTenure && arr.length > 0) {
        const today = new Date();
        const current = arr.find((t) => {
          const s = new Date(t.start_date);
          const e = new Date(t.end_date);
          return s <= today && today <= e;
        });
        setSelectedTenure(String(current?.id ?? arr[arr.length - 1].id));
      }
    } catch (err) {
      console.error("fetchTenures error:", err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      const token = await getAuthToken();
      if (!token) {
        setApiError(true);
        setGCResolutions([]);
        return;
      }
      const gcData = await getGCResolutions(token);
      const resolutions =
        gcData?.resolutions ?? (Array.isArray(gcData) ? gcData : []);
      setGCResolutions(resolutions);

      const institutesData = await getInstitutes(token);
      const instArr = Array.isArray(institutesData)
        ? institutesData
        : institutesData?.data || [];
      setInstitutes(instArr);

      const allowedInstituteIds = [
        ...new Set(resolutions.map((r) => r.institute_id).filter(Boolean)),
      ];
      const filtered = instArr.filter((inst) =>
        allowedInstituteIds.includes(inst.id)
      );
      setFilteredInstitutes(filtered);
      if (filtered.length > 0 && !selectedInstitute) {
        setSelectedInstitute(String(filtered[0].id));
      }
      setApiError(false);
    } catch (err) {
      console.error("fetchData error:", err);
      setApiError(true);
      setGCResolutions([]);
      setInstitutes([]);
      setFilteredInstitutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenures();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTenure]);

  const getInstituteName = (instituteId) => {
    if (!instituteId) return "N/A";
    const institute = institutes.find((inst) => inst.id === instituteId);
    return institute ? institute.name : "N/A";
  };

  const filteredData = (gcResolutions || []).filter((item) => {
    const searchLower = (searchTerm || "").toLowerCase();
    const instituteName = (
      getInstituteName(item.institute_id) || ""
    ).toLowerCase();
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

    const matchesInstitute = selectedInstitute
      ? String(item.institute_id) === String(selectedInstitute)
      : true;

    let matchesTenure = true;
    if (selectedTenure) {
      matchesTenure = item.tenure_id
        ? String(item.tenure_id) === String(selectedTenure)
        : false;
    }

    return matchesSearch && matchesInstitute && matchesTenure;
  });

  // Use searchResults when a global PDF search is active, otherwise use filteredData
  const dataToGroup =
    pdfSearchTerm && pdfSearchTerm.trim() ? searchResults : filteredData;

  const groupedByDate = (dataToGroup || []).reduce((acc, item) => {
    const dateKey = item.gc_date || "N/A";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const groupedByMonthYear = {};
  Object.keys(groupedByDate).forEach((dateKey) => {
    if (dateKey === "N/A") return;
    const date = new Date(dateKey);
    if (isNaN(date.getTime())) return;
    const monthYearKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    if (!groupedByMonthYear[monthYearKey])
      groupedByMonthYear[monthYearKey] = {};
    groupedByMonthYear[monthYearKey][dateKey] = groupedByDate[dateKey];
  });

  const sortedMonthYearKeys = Object.keys(groupedByMonthYear).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (monthYearKey) => {
    const [year, month] = monthYearKey.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const getDateNumber = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.getDate();
  };

  const handleBackClick = () => navigation.goBack();

  const handleDateClick = (dateKey) => {
    setSelectedDate(dateKey);
    setViewingPDF(null);
    setPdfUrl("");
    setPdfHtml("");
    setFileError("");
    appendDebug("Date selected: " + String(dateKey));
  };

  const makeFinalPdfUri = (httpUri, fileUri) => {
    return Platform.OS === "android"
      ? httpUri
        ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            httpUri
          )}`
        : fileUri
      : httpUri || fileUri;
  };

  const handlePDFView = async (type, filename) => {
    if (!filename) {
      setFileError(
        `No ${type.replace("-", " ")} file available for this meeting.`
      );
      setViewingPDF(null);
      setPdfUrl("");
      setPdfHtml("");
      return;
    }

    const remote = `${API_BASE_URL}/gc_resolutions/file/${encodeURIComponent(
      filename
    )}`;

    try {
      setCurrentPdfType(type);
      setFileError("");

      const token = await getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      setPdfHeaders(headers);

      setPdfPending({ remote, token });
      setTriedPdfJsFallback(false);

      appendDebug(`Attempting viewer for: ${remote}`);

      // Use PDF.js for both platforms when auth token is present
      if (headers && headers.Authorization) {
        appendDebug(
          "Auth token present — using pdf.js viewer for both platforms"
        );
        const html = buildPdfJsHtml(remote, token);
        setPdfHtml(html);
        setPdfUrl("");
      } else {
        // For public PDFs without auth
        const finalUri = makeFinalPdfUri(remote, null);
        setPdfHtml("");
        setPdfUrl(finalUri);
      }

      setViewingPDF(type);
      webviewKeyRef.current += 1;
    } catch (err) {
      console.error("handlePDFView error:", err);
      appendDebug(
        "handlePDFView final error: " + (err && err.message ? err.message : err)
      );
      setFileError(err.message || "Failed to open PDF");
      Alert.alert("Error", err.message || "Failed to open PDF");
      setViewingPDF(null);
      setPdfUrl("");
      setPdfHtml("");
      setPdfHeaders({});
    }
  };

  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    setFileError("");

    appendDebug("Tab clicked: " + String(tab));

    if (!selectedDate || !groupedByDate[selectedDate]) return;
    const currentData = groupedByDate[selectedDate][0];
    if (!currentData) return;

    let filename = null;
    switch (tab) {
      case "agenda":
        filename = currentData?.agenda;
        break;
      case "resolution":
        filename = currentData?.resolution;
        break;
      case "compliance":
        filename = currentData?.compliance;
        break;
      case "meeting-notes":
        filename = currentData?.meeting_notes;
        break;
      default:
        return;
    }

    const fileExistsKey = `${
      tab === "meeting-notes" ? "meeting_notes" : tab
    }_exists`;
    const fileExists = currentData?.[fileExistsKey];
    if (filename && fileExists === false) {
      setFileError(
        `The ${tab} file "${filename}" is referenced but missing from server.`
      );
      setViewingPDF(null);
      setPdfUrl("");
      setPdfHtml("");
      return;
    }

    if (filename) {
      await handlePDFView(tab, filename);
    } else {
      setFileError(
        `No ${tab.replace("-", " ")} file available for this meeting.`
      );
      setViewingPDF(null);
      setPdfUrl("");
      setPdfHtml("");
    }
  };

  const handleClosePDF = () => {
    setViewingPDF(null);
    setPdfUrl("");
    setPdfHtml("");
    setFileError("");
    setPdfHeaders({});
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderMobile />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading GC Resolutions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderMobile />
      <TouchableWithoutFeedback onPress={() => setTenureDropdownVisible(false)}>
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchData();
                await fetchTenures();
                setRefreshing(false);
              }}
            />
          }
        >
          <View style={styles.headerSection}>
            <TouchableOpacity
              onPress={handleBackClick}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#4F46E5" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Governing Council Resolutions</Text>
            <Text style={styles.pageSubtitle}>
              View and search all resolutions passed by the Governing Council
            </Text>
          </View>

          {filteredInstitutes.length > 0 && (
            <View style={styles.filtersSection}>
              <View style={styles.filtersRow}>
                <View style={styles.institutesContainer}>
                  <Text style={styles.filterLabel}>Institutes:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.instituteScroll}
                  >
                    {filteredInstitutes.map((inst) => (
                      <TouchableOpacity
                        key={inst.id}
                        style={[
                          styles.instituteButton,
                          selectedInstitute === String(inst.id) &&
                            styles.selectedInstituteButton,
                        ]}
                        onPress={() => setSelectedInstitute(String(inst.id))}
                      >
                        <Text
                          style={[
                            styles.instituteButtonText,
                            selectedInstitute === String(inst.id) &&
                              styles.selectedInstituteButtonText,
                          ]}
                        >
                          {inst.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.tenureContainer}>
                  <Text style={styles.filterLabel}>Tenure:</Text>
                  <View style={styles.tenureDropdownWrapper}>
                    <TouchableOpacity
                      style={styles.tenureDropdown}
                      onPress={() =>
                        setTenureDropdownVisible(!tenureDropdownVisible)
                      }
                    >
                      <Text style={styles.tenureDropdownText} numberOfLines={1}>
                        {selectedTenure
                          ? tenures.find((t) => String(t.id) === selectedTenure)
                              ?.tenure ?? "Selected Tenure"
                          : "All Tenures"}
                      </Text>
                      <Ionicons
                        name={
                          tenureDropdownVisible ? "chevron-up" : "chevron-down"
                        }
                        size={16}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {tenureDropdownVisible && (
                      <View style={styles.dropdownList}>
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            !selectedTenure && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedTenure("");
                            setTenureDropdownVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              !selectedTenure &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            All Tenures
                          </Text>
                          {!selectedTenure && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#7C3AED"
                            />
                          )}
                        </TouchableOpacity>

                        {tenures.map((tenure) => (
                          <TouchableOpacity
                            key={tenure.id}
                            style={[
                              styles.dropdownItem,
                              selectedTenure === String(tenure.id) &&
                                styles.dropdownItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedTenure(String(tenure.id));
                              setTenureDropdownVisible(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedTenure === String(tenure.id) &&
                                  styles.dropdownItemTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {tenure.tenure}
                            </Text>
                            {selectedTenure === String(tenure.id) && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#7C3AED"
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* PDF Search Section */}
          <View style={styles.pdfSearchSection}>
            <View style={styles.pdfSearchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search inside all resolution PDFs..."
                value={pdfSearchTerm}
                onChangeText={(text) => {
                  setPdfSearchTerm(text);
                  if (text && text.trim()) {
                    performPdfSearch(text.trim());
                  } else {
                    setSearchResults([]);
                  }
                }}
              />
              {pdfSearchTerm ? (
                <TouchableOpacity
                  onPress={() => {
                    setPdfSearchTerm("");
                    setSearchResults([]);
                  }}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
            {pdfSearchTerm && (
              <Text style={styles.searchResultsText}>
                {isSearching
                  ? "Searching across resolution content..."
                  : `Found ${searchResults.length} resolutions with matching content`}
              </Text>
            )}
          </View>

          {sortedMonthYearKeys.length > 0 ? (
            <View style={styles.scheduleContainer}>
              <LinearGradient
                colors={["#4F46E5", "#7C3AED"]}
                style={styles.scheduleHeader}
              >
                <Text style={styles.scheduleHeaderText}>
                  {pdfSearchTerm.trim()
                    ? `Search Results (${searchResults.length} meetings found)`
                    : "Meeting Schedule"}
                </Text>
              </LinearGradient>

              {sortedMonthYearKeys.map((monthYearKey) => {
                const datesInMonth = groupedByMonthYear[monthYearKey];
                const sortedDateKeys = Object.keys(datesInMonth).sort(
                  (a, b) => new Date(a) - new Date(b)
                );
                const hasSelectedDate = sortedDateKeys.includes(selectedDate);

                return (
                  <View key={monthYearKey} style={styles.monthContainer}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthText}>
                        {formatMonthYear(monthYearKey)}
                      </Text>
                    </View>

                    <View style={styles.datesContainer}>
                      {sortedDateKeys.map((dateKey) => (
                        <TouchableOpacity
                          key={dateKey}
                          onPress={() => handleDateClick(dateKey)}
                          style={[
                            styles.dateButton,
                            selectedDate === dateKey &&
                              styles.selectedDateButton,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateButtonText,
                              selectedDate === dateKey &&
                                styles.selectedDateButtonText,
                            ]}
                          >
                            {getDateNumber(dateKey)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Expanded Content */}
                    {hasSelectedDate && selectedDate && (
                      <View style={styles.expandedContent}>
                        <View style={styles.expandedHeader}>
                          <Text style={styles.expandedTitle}>
                            Meeting Details - {formatDate(selectedDate)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedDate(null);
                              setFileError("");
                            }}
                            style={styles.closeButton}
                          >
                            <Ionicons name="close" size={24} color="#FFF" />
                          </TouchableOpacity>
                        </View>

                        {/* Button Grid */}
                        <View style={styles.buttonGrid}>
                          {/* Agenda Button */}
                          <TouchableOpacity
                            onPress={() => handleTabClick("agenda")}
                            style={[
                              styles.tabButton,
                              styles.agendaTab,
                              (activeTab === "agenda" ||
                                viewingPDF === "agenda") &&
                                styles.activeTabButton,
                            ]}
                          >
                            {pdfSearchTerm.trim() &&
                              groupedByDate[selectedDate]?.[0]?.matchedField ===
                                "agenda" && (
                                <View style={styles.matchBadge}>
                                  <Text style={styles.matchBadgeText}>
                                    MATCH
                                  </Text>
                                </View>
                              )}
                            <Text style={styles.tabEmoji}>📋</Text>
                            <Text style={styles.tabText}>Agenda</Text>
                          </TouchableOpacity>

                          {/* Meeting Notes Button */}
                          <TouchableOpacity
                            onPress={() => handleTabClick("meeting-notes")}
                            style={[
                              styles.tabButton,
                              styles.meetingNotesTab,
                              (activeTab === "meeting-notes" ||
                                viewingPDF === "meeting-notes") &&
                                styles.activeTabButton,
                            ]}
                          >
                            {pdfSearchTerm.trim() &&
                              groupedByDate[selectedDate]?.[0]?.matchedField ===
                                "meeting_notes" && (
                                <View style={styles.matchBadge}>
                                  <Text style={styles.matchBadgeText}>
                                    MATCH
                                  </Text>
                                </View>
                              )}
                            <Text style={styles.tabEmoji}>📝</Text>
                            <Text style={styles.tabText}>Meeting Notes</Text>
                          </TouchableOpacity>

                          {/* Resolution Button */}
                          <TouchableOpacity
                            onPress={() => handleTabClick("resolution")}
                            style={[
                              styles.tabButton,
                              styles.resolutionTab,
                              (activeTab === "resolution" ||
                                viewingPDF === "resolution") &&
                                styles.activeTabButton,
                            ]}
                          >
                            {pdfSearchTerm.trim() &&
                              groupedByDate[selectedDate]?.[0]?.matchedField ===
                                "resolution" && (
                                <View style={styles.matchBadge}>
                                  <Text style={styles.matchBadgeText}>
                                    MATCH
                                  </Text>
                                </View>
                              )}
                            <Text style={styles.tabEmoji}>⚖️</Text>
                            <Text style={styles.tabText}>Resolution</Text>
                          </TouchableOpacity>

                          {/* Compliance Button */}
                          <TouchableOpacity
                            onPress={() => handleTabClick("compliance")}
                            style={[
                              styles.tabButton,
                              styles.complianceTab,
                              (activeTab === "compliance" ||
                                viewingPDF === "compliance") &&
                                styles.activeTabButton,
                            ]}
                          >
                            {pdfSearchTerm.trim() &&
                              groupedByDate[selectedDate]?.[0]?.matchedField ===
                                "compliance" && (
                                <View style={styles.matchBadge}>
                                  <Text style={styles.matchBadgeText}>
                                    MATCH
                                  </Text>
                                </View>
                              )}
                            <Text style={styles.tabEmoji}>✅</Text>
                            <Text style={styles.tabText}>Compliance</Text>
                          </TouchableOpacity>
                        </View>

                        {/* PDF Viewer */}
                        {viewingPDF && (pdfHtml || pdfUrl) && (
                          <View style={styles.pdfViewerContainer}>
                            <View style={styles.pdfViewerHeader}>
                              <Text style={styles.pdfViewerTitle}>
                                Viewing:{" "}
                                {viewingPDF.charAt(0).toUpperCase() +
                                  viewingPDF.slice(1)}
                              </Text>
                              <View style={styles.pdfViewerActions}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setDebugPanelVisible((s) => !s)
                                  }
                                  style={[
                                    styles.closePdfButton,
                                    {
                                      backgroundColor: debugPanelVisible
                                        ? "#374151"
                                        : "#6B7280",
                                    },
                                  ]}
                                >
                                  <Text style={styles.closePdfButtonText}>
                                    {debugPanelVisible ? "Logs" : "Show"}
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={handleClosePDF}
                                  style={[
                                    styles.closePdfButton,
                                    { marginLeft: 8 },
                                  ]}
                                >
                                  <Text style={styles.closePdfButtonText}>
                                    ✕ Close PDF
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={styles.pdfViewerWrapper}>
                              <WebView
                                key={`pdf-${webviewKeyRef.current}`}
                                originWhitelist={["*"]}
                                source={
                                  pdfHtml
                                    ? { html: pdfHtml }
                                    : pdfUrl
                                    ? { uri: pdfUrl, headers: pdfHeaders || {} }
                                    : undefined
                                }
                                style={[
                                  styles.pdfWebView,
                                  { height: pdfWebViewHeight },
                                ]}
                                startInLoadingState
                                mixedContentMode="always"
                                javaScriptEnabled
                                androidLayerType="hardware"
                                nestedScrollEnabled={true}
                                injectedJavaScript={`(function(){window.addEventListener('message',function(){},false);return true;})();`}
                                onLoadStart={(e) => {
                                  console.log("GC WebView onLoadStart", {
                                    uri: pdfUrl,
                                    event: e.nativeEvent,
                                  });
                                  appendDebug(
                                    "WebView onLoadStart: " +
                                      (pdfUrl || "inline/html")
                                  );
                                }}
                                onLoadEnd={(e) => {
                                  console.log(
                                    "GC WebView onLoadEnd",
                                    e.nativeEvent
                                  );
                                  appendDebug(
                                    "WebView onLoadEnd: " +
                                      (pdfUrl || "inline/html")
                                  );
                                }}
                                onHttpError={(e) => {
                                  console.warn(
                                    "GC WebView HTTP error loading PDF:",
                                    e.nativeEvent
                                  );
                                  setFileError(
                                    "Unable to render PDF inline on this device or server returned an error."
                                  );
                                  appendDebug(
                                    "WebView onHttpError: " +
                                      JSON.stringify(e.nativeEvent)
                                  );
                                }}
                                onMessage={(e) => {
                                  try {
                                    const msg = JSON.parse(e.nativeEvent.data);
                                    if (msg.type === "log") {
                                      setDebugLogs((prev) => {
                                        const next = [
                                          ...prev,
                                          String(msg.message),
                                        ];
                                        return next.slice(-30);
                                      });
                                      appendDebug(
                                        "Viewer message: " + String(msg.message)
                                      );
                                    } else if (msg.type === "loaded") {
                                      appendDebug(
                                        "Viewer loaded: " +
                                          String(msg.message || "loaded")
                                      );
                                    } else if (msg.type === "error") {
                                      if (pdfPending && !triedPdfJsFallback) {
                                        appendDebug(
                                          "Inline viewer failed — trying pdf.js fallback"
                                        );
                                        const fbHtml = buildPdfJsHtml(
                                          pdfPending.remote,
                                          pdfPending.token
                                        );
                                        setPdfHtml(fbHtml);
                                        setPdfUrl("");
                                        setTriedPdfJsFallback(true);
                                        return;
                                      }
                                      setFileError(
                                        msg.message ||
                                          "Unable to render PDF inline on this device."
                                      );
                                      setDebugLogs((prev) =>
                                        [
                                          ...prev,
                                          "ERROR: " + (msg.message || ""),
                                        ].slice(-30)
                                      );
                                      appendDebug(
                                        "Viewer error: " +
                                          String(msg.message || "unknown")
                                      );
                                    } else if (msg.type === "height") {
                                      const h = parseInt(msg.height, 10);
                                      if (!isNaN(h) && h > 0) {
                                        const newH = Math.max(
                                          h + 20,
                                          Math.round(
                                            Dimensions.get("window").height *
                                              0.4
                                          )
                                        );
                                        setPdfWebViewHeight(newH);
                                        appendDebug(
                                          "Viewer reported height: " + String(h)
                                        );
                                      }
                                    }
                                  } catch (ex) {
                                    console.error(
                                      "Failed to parse GC WebView message",
                                      ex
                                    );
                                    appendDebug(
                                      "Failed to parse WebView message: " +
                                        String(ex)
                                    );
                                  }
                                }}
                                allowFileAccessFromFileURLs={true}
                                allowUniversalAccessFromFileURLs={true}
                                renderLoading={() => (
                                  <View style={styles.pdfLoadingContainer}>
                                    <ActivityIndicator
                                      size="large"
                                      color="#4F46E5"
                                    />
                                    <Text style={styles.pdfLoadingText}>
                                      Loading PDF...
                                    </Text>
                                  </View>
                                )}
                                onError={(e) => {
                                  console.warn(
                                    "WebView error loading PDF:",
                                    e.nativeEvent
                                  );
                                  if (pdfPending && !triedPdfJsFallback) {
                                    appendDebug(
                                      "WebView error — attempting pdf.js fallback"
                                    );
                                    const fbHtml = buildPdfJsHtml(
                                      pdfPending.remote,
                                      pdfPending.token
                                    );
                                    setPdfHtml(fbHtml);
                                    setPdfUrl("");
                                    setTriedPdfJsFallback(true);
                                    return;
                                  }
                                  setFileError(
                                    "Unable to render PDF inline on this device. The server stream may be blocked or this device/webview cannot render PDFs inline."
                                  );
                                  appendDebug(
                                    "WebView onError: " +
                                      JSON.stringify(e.nativeEvent)
                                  );
                                }}
                              />
                            </View>
                          </View>
                        )}

                        {/* Error Message */}
                        {fileError && (
                          <View style={styles.errorContainer}>
                            <View style={styles.errorContent}>
                              <Ionicons
                                name="alert-circle"
                                size={20}
                                color="#EF4444"
                              />
                              <Text style={styles.errorTitle}>
                                File Not Available
                              </Text>
                              <Text style={styles.errorMessage}>
                                {fileError}
                              </Text>
                              <TouchableOpacity
                                onPress={() => setFileError("")}
                                style={styles.errorCloseButton}
                              >
                                <Ionicons
                                  name="close"
                                  size={16}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {/* Debug Panel */}
                        {viewingPDF && debugPanelVisible ? (
                          <View style={styles.debugPanel}>
                            <Text style={styles.debugTitle}>Viewer logs</Text>
                            <ScrollView style={styles.debugScroll}>
                              {debugLogs.length === 0 ? (
                                <Text style={styles.debugLine}>
                                  No logs yet
                                </Text>
                              ) : (
                                debugLogs.map((line, idx) => (
                                  <Text key={idx} style={styles.debugLine}>
                                    {line}
                                  </Text>
                                ))
                              )}
                            </ScrollView>
                          </View>
                        ) : null}

                        {/* Tab Content (when not viewing PDF) */}
                        {!viewingPDF && activeTab && (
                          <ScrollView style={styles.tabContentContainer}>
                            {(() => {
                              if (!selectedDate || !groupedByDate[selectedDate])
                                return null;
                              const items = groupedByDate[selectedDate];
                              switch (activeTab) {
                                case "agenda":
                                  return (
                                    <View style={styles.tabContent}>
                                      {items.map((item, i) => (
                                        <View
                                          key={item.id || i}
                                          style={styles.contentItem}
                                        >
                                          <Text style={styles.contentTitle}>
                                            Agenda Item {i + 1}
                                          </Text>
                                          <Text style={styles.contentText}>
                                            {item.agenda ||
                                              "No agenda information available"}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  );
                                case "resolution":
                                  return (
                                    <View style={styles.tabContent}>
                                      {items.map((item, i) => (
                                        <View
                                          key={item.id || i}
                                          style={styles.contentItem}
                                        >
                                          <Text style={styles.contentTitle}>
                                            Resolution {i + 1}
                                          </Text>
                                          <Text style={styles.contentText}>
                                            {item.resolution ||
                                              "No resolution information available"}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  );
                                case "compliance":
                                  return (
                                    <View style={styles.tabContent}>
                                      {items.map((item, i) => (
                                        <View
                                          key={item.id || i}
                                          style={styles.contentItem}
                                        >
                                          <Text style={styles.contentTitle}>
                                            Compliance {i + 1}
                                          </Text>
                                          <Text style={styles.contentText}>
                                            {item.compliance ||
                                              "No compliance information available"}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  );
                                case "meeting-notes":
                                  return (
                                    <View style={styles.tabContent}>
                                      <View style={styles.contentItem}>
                                        <Text style={styles.contentTitle}>
                                          Meeting Notes for{" "}
                                          {formatDate(selectedDate)}
                                        </Text>
                                        <View style={styles.meetingInfo}>
                                          <Text style={styles.meetingLabel}>
                                            Institute:{" "}
                                          </Text>
                                          <Text style={styles.meetingValue}>
                                            {getInstituteName(
                                              items[0]?.institute_id
                                            )}
                                          </Text>
                                        </View>
                                        <View style={styles.meetingInfo}>
                                          <Text style={styles.meetingLabel}>
                                            Meeting Notes:{" "}
                                          </Text>
                                          <Text style={styles.meetingValue}>
                                            {items[0]?.meeting_notes || "N/A"}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                  );
                                default:
                                  return null;
                              }
                            })()}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#D1D5DB"
              />
              <Text style={styles.noDataTitle}>
                {apiError
                  ? "Data unavailable"
                  : pdfSearchTerm.trim()
                  ? `No meetings found matching "${pdfSearchTerm}"`
                  : "No Resolutions Found For Selected Tenure"}
              </Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContainer: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  headerSection: { padding: 20, paddingBottom: 10 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  filtersSection: { padding: 20, paddingTop: 10 },
  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  institutesContainer: { flex: 1, marginRight: 16 },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  instituteScroll: { marginBottom: 20 },
  instituteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  selectedInstituteButton: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  instituteButtonText: { fontSize: 14, fontWeight: "500", color: "#4F46E5" },
  selectedInstituteButtonText: { color: "#FFF" },
  tenureContainer: { width: 160, position: "relative" },
  tenureDropdownWrapper: { position: "relative" },
  tenureDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  tenureDropdownText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: { backgroundColor: "#F3E8FF" },
  dropdownItemText: { fontSize: 14, color: "#374151", flex: 1 },
  dropdownItemTextSelected: { color: "#7C3AED", fontWeight: "500" },
  searchSection: { padding: 20, paddingTop: 0 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1F2937" },
  countContainer: {
    alignSelf: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  countText: { fontSize: 12, color: "#4F46E5", fontWeight: "500" },
  pdfSearchSection: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pdfSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  clearSearchButton: { marginLeft: 8 },
  searchResultsText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
    marginLeft: 12,
    marginBottom: 8,
  },
  scheduleContainer: {
    margin: 20,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleHeader: { padding: 16 },
  scheduleHeaderText: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  monthContainer: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  monthHeader: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  monthText: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "center",
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedDateButton: {
    backgroundColor: "#4F46E5",
    borderColor: "#FFFFFF",
    borderWidth: 3,
    elevation: 8,
  },
  dateButtonText: { fontSize: 16, fontWeight: "500", color: "#4F46E5" },
  selectedDateButtonText: { color: "#FFF" },
  expandedContent: {
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#4F46E5",
  },
  expandedTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF", flex: 1 },
  closeButton: { padding: 4 },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "space-between",
  },
  tabButton: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 16,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    position: "relative",
  },
  agendaTab: { backgroundColor: "#DBEAFE" },
  resolutionTab: { backgroundColor: "#E9D5FF" },
  complianceTab: { backgroundColor: "#D1FAE5" },
  meetingNotesTab: { backgroundColor: "#FEF3C7" },
  activeTabButton: {
    transform: [{ scale: 1.05 }],
    elevation: 4,
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  tabEmoji: { fontSize: 20, marginBottom: 4 },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    color: "#4B5563",
  },
  activeTabText: { color: "#1F2937" },
  matchBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  matchBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  pdfViewerContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  pdfViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pdfViewerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  pdfViewerActions: { flexDirection: "row", alignItems: "center" },
  closePdfButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#6B7280",
    borderRadius: 6,
  },
  closePdfButtonText: { color: "#FFF", fontWeight: "500", fontSize: 12 },
  pdfViewerWrapper: {
    flex: 1,
    position: "relative",
    height: Math.round(Dimensions.get("window").height * 0.5),
  },
  pdfLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pdfLoadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  pdfWebView: { flex: 1, width: "100%" },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorContent: { flexDirection: "row", padding: 12, alignItems: "center" },
  errorTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#991B1B",
    flex: 1,
  },
  errorMessage: { marginLeft: 8, fontSize: 12, color: "#B91C1C", flex: 1 },
  errorCloseButton: { padding: 4 },
  tabContentContainer: { flex: 1, padding: 16 },
  tabContent: { paddingVertical: 8 },
  contentItem: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  contentText: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  meetingInfo: { flexDirection: "row", marginBottom: 8 },
  meetingLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  meetingValue: { fontSize: 14, color: "#6B7280", flex: 1 },
  debugPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 8,
    maxHeight: 160,
  },
  debugTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  debugScroll: { maxHeight: 140 },
  debugLine: { color: "#E6E7EA", fontSize: 12, marginBottom: 4 },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFF",
    margin: 20,
    borderRadius: 12,
  },
  noDataTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
});

export default GCResolutionPageMobile;
