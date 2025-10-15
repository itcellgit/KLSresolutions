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
import { getSignedFileUrl, searchPDFContent } from "../../api/agm";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const { width, height } = Dimensions.get("window");

const AGMResolutionPageMobile = () => {
  const [agmResolutions, setAGMResolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentExpandedDate, setCurrentExpandedDate] = useState(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewingType, setViewingType] = useState(null); // 'agenda'|'notes'
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fileError, setFileError] = useState("");
  const [activeTab, setActiveTab] = useState(null); // 'agenda'|'notes'

  // PDF viewer state
  const [pdfHtml, setPdfHtml] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfRemoteUri, setPdfRemoteUri] = useState("");
  const [pdfRemoteHeaders, setPdfRemoteHeaders] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [latestLog, setLatestLog] = useState("");
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [pdfPending, setPdfPending] = useState(null);
  const [triedPdfJsFallback, setTriedPdfJsFallback] = useState(false);
  const [pdfWebViewHeight, setPdfWebViewHeight] = useState(
    Math.round(Dimensions.get("window").height * 0.5)
  );

  const { user } = useAuth();
  const navigation = useNavigation();
  const webviewKeyRef = useRef(0);

  const getAuthToken = async () => {
    return user?.token || (await AsyncStorage.getItem("token"));
  };

  // Enhanced PDF.js HTML viewer with proper script loading
  const buildPdfJsHtmlFromUrl = (remoteUrl, token) => {
    const tokenJson = JSON.stringify(token || "");
    const remoteJson = JSON.stringify(remoteUrl);

    const cdnCandidates = [
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
      "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
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
    console.log("AGM viewer:", text);
  };

  // API Functions
  const getAGMs = async (token) => {
    try {
      console.log("=== AGM RESOLUTIONS API DEBUG ===");
      console.log("Full API URL:", `${API_BASE_URL}/agm`);
      console.log("API_BASE_URL:", API_BASE_URL);
      console.log("Token (first 20 chars):", token?.substring(0, 20) + "...");

      const response = await fetch(`${API_BASE_URL}/agm`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response statusText:", response.statusText);
      console.log("Response ok:", response.ok);

      // Log the response text to see the exact error
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // Parse the response text as JSON
      const data = JSON.parse(responseText);
      console.log("Success data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching AGM resolutions:", error);
      console.error("Error type:", error.constructor.name);
      console.error("Error stack:", error.stack);
      throw error;
    }
  };

  const fetchData = async () => {
    console.log("=== FETCH DATA START ===");
    setIsLoading(true);
    try {
      // Try to get token from user context first, then AsyncStorage as backup
      let token = user?.token;
      if (!token) {
        token = await AsyncStorage.getItem("token");
      }

      console.log("Token available:", !!token);
      console.log("User data:", user);

      if (!token) {
        console.error("No token available for fetching data");
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const data = await getAGMs(token);
      setAGMResolutions(data || []); // Ensure it's always an array
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response && err.response.status === 401) {
        setError("Authentication failed. Please log in again.");
        AsyncStorage.removeItem("token");
      } else {
        // Don't set error for data fetch failures, just use empty array
        console.warn("Failed to fetch AGM resolutions, showing empty table");
      }
      setAGMResolutions([]); // Always set to empty array instead of showing error
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log("=== COMPONENT MOUNTED ===");
    fetchData();
  }, []);

  // Debounced server-side PDF search
  useEffect(() => {
    const to = setTimeout(() => {
      const term = (pdfSearchTerm || "").trim();
      if (!term) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const doSearch = async () => {
        setIsSearching(true);
        try {
          let token = user?.token || (await AsyncStorage.getItem("token"));
          const res = await searchPDFContent(term, token);
          const normalized = res?.results || res?.items || res || [];
          setSearchResults(Array.isArray(normalized) ? normalized : []);
        } catch (err) {
          console.error("PDF search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      };

      doSearch();
    }, 500);

    return () => clearTimeout(to);
  }, [pdfSearchTerm]);

  const handleBackClick = () => {
    navigation.goBack();
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setCurrentExpandedDate(null);
      setActiveTab(null);
      setViewingType(null);
      setPdfUrl("");
    } else {
      setExpandedId(id);
      setCurrentExpandedDate(id);
      setActiveTab(null);
      setViewingType(null);
      setPdfUrl("");
    }
  };

  const handleViewFile = async (type, filename) => {
    setFileError("");
    setViewingType(type);
    setPdfUrl("");
    setPdfLoading(true);
    setPdfLoaded(false);

    try {
      let token = await getAuthToken();
      if (!filename) {
        setFileError(`No ${type} file available for this meeting.`);
        setPdfLoading(false);
        return;
      }

      if (typeof filename === "object") {
        filename =
          filename.filename ||
          filename.file ||
          filename.path ||
          filename.url ||
          filename;
      }

      // Helper to cleanup previous temp file
      const cleanupOld = async () => {
        try {
          if (
            pdfUrl &&
            pdfUrl.startsWith(FileSystem.cacheDirectory || "file://")
          ) {
            await FileSystem.deleteAsync(pdfUrl, { idempotent: true }).catch(
              () => {}
            );
          }
        } catch (e) {
          // ignore
        }
      };

      // If filename is already a full URL, try to download it with auth headers first (if token), otherwise open directly
      const API_URL = API_BASE_URL || "https://resolutions.klsbelagavi.org/api";

      const tryDownload = async (url) => {
        try {
          const fileExt = (url.split(".").pop().split("?")[0] || "pdf").replace(
            /[^a-zA-Z0-9]/g,
            ""
          );
          const fileName = `agm_${type}_${Date.now()}.${fileExt}`;
          const fileUri = FileSystem.cacheDirectory + fileName;
          const options = token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {};
          const downloadRes = await FileSystem.downloadAsync(
            url,
            fileUri,
            options
          );
          // on some platforms downloadRes.status may not be present; check uri
          if (downloadRes && downloadRes.uri) {
            await cleanupOld();
            setPdfUrl(downloadRes.uri);
            setFileError("");
            return true;
          }
          return false;
        } catch (err) {
          console.warn("download candidate failed", url, err);
          return false;
        }
      };

      if (typeof filename === "string" && /^https?:\/\//i.test(filename)) {
        // Attempt download (handles token-protected files). If download fails, open URL directly in WebView where possible.
        const ok = await tryDownload(filename);
        if (ok) {
          setPdfLoading(false);
          return;
        }

        // if download failed and it's a public URL, just open it directly
        try {
          setPdfUrl(filename);
          setPdfLoading(false);
          return;
        } catch (e) {
          console.warn("Failed to open remote URL directly", e);
        }
      }

      // Build candidate URLs (mobile uses same API base)
      const enc = encodeURIComponent(String(filename));
      const candidates = [
        `${API_URL}/agm/file/${enc}`,
        `${API_URL}/uploads/${enc}`,
        `${API_URL}/files/${enc}`,
        `${API_URL}/agm/file/${filename}`,
      ];

      let success = false;
      for (const url of candidates) {
        // try each candidate
        // eslint-disable-next-line no-await-in-loop
        const ok = await tryDownload(url);
        if (ok) {
          success = true;
          break;
        }
      }

      if (!success) {
        console.error("All attempts to fetch file failed for", filename);
        setFileError(
          "File not found on server. Please contact the administrator."
        );
      }
    } catch (err) {
      console.error("Error opening file:", err);
      Alert.alert(
        "File Error",
        "Failed to open file. Try downloading from desktop or contact admin."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleTabClick = async (tab, dateKey) => {
    setActiveTab(tab);
    setPdfUrl("");
    setViewingType(tab);
    setFileError("");

    // find current items depending on server/local data
    const items =
      pdfSearchTerm &&
      pdfSearchTerm.trim() &&
      Array.isArray(searchResults) &&
      searchResults.length
        ? searchResults.filter((it) => (it.agm_date || "N/A") === dateKey)
        : groupedByDate[dateKey] || [];

    const currentData = items[0] || null;
    const filename = currentData
      ? tab === "agenda"
        ? currentData?.agenda_file ||
          currentData?.agenda_filename ||
          currentData?.agenda
        : currentData?.notes_file ||
          currentData?.notes_filename ||
          currentData?.notes
      : null;

    if (filename) {
      // delegate to handleViewFile which performs download/fallbacks
      try {
        await handleViewFile(tab, filename);
        setExpandedId(dateKey);
      } catch (err) {
        console.error("handleTabClick error", err);
      }
    } else {
      setFileError(`No ${tab} file available for this meeting.`);
    }
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

  // For print - in mobile we'll use share functionality
  const handlePrint = () => {
    // In mobile, we'll use share functionality instead of print
    if (!currentExpandedDate) return;

    // Get the expanded date for heading
    let heading = "AGM Resolutions";
    let dateText = "Date: N/A";
    if (currentExpandedDate && currentExpandedDate !== "N/A") {
      heading = "AGM Resolutions";
      const date = new Date(currentExpandedDate);
      dateText = `Date: ${formatDate(currentExpandedDate)}`;
    }

    const message = `${heading}\n${dateText}\n\nThis content is best viewed on a desktop browser for printing.`;

    Share.share({
      message: message,
      title: "AGM Resolutions",
    }).catch((err) => console.log(err));
  };

  // For PDF of group - simplified for mobile
  const generateGroupPDF = async () => {
    if (!currentExpandedDate) return;

    setIsGeneratingPDF(true);
    try {
      // For mobile, we'll create a simple text-based PDF
      const currentItems = groupedByDate[currentExpandedDate] || [];

      let pdfContent = `AGM RESOLUTIONS\n`;
      pdfContent += `Date: ${formatDate(currentExpandedDate)}\n\n`;

      currentItems.forEach((item, index) => {
        pdfContent += `Resolution No: ${index + 1}\n`;
        pdfContent += `Date: ${formatDate(item.agm_date)}\n`;
        pdfContent += `Agenda: ${item.agenda || "N/A"}\n`;
        pdfContent += `Resolution: ${item.notes || "N/A"}\n\n`;
      });

      // Create a file in the device's documents directory
      const fileName = `AGM_Resolutions_${formatDate(
        currentExpandedDate
      ).replace(/\s/g, "_")}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, pdfContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Share AGM Resolutions",
        });
      } else {
        Alert.alert(
          "Sharing not available",
          "Cannot share file on this device"
        );
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      Alert.alert("Error", "Failed to generate file. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Group and effective groups: when `pdfSearchTerm` is present use server `searchResults`, otherwise use full `agmResolutions`
  const groupedByDate =
    pdfSearchTerm &&
    pdfSearchTerm.trim() &&
    Array.isArray(searchResults) &&
    searchResults.length
      ? searchResults.reduce((acc, item) => {
          const key = item.agm_date || "N/A";
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {})
      : agmResolutions.reduce((acc, item) => {
          const dateKey = item.agm_date || "N/A";
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(item);
          return acc;
        }, {});

  // Group by month and year
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

  const renderResolutionItem = (item, index) => {
    const notes = item.notes || "No notes available";
    const notesList = notes
      .split(/\r?\n|•|\d+\.|- /)
      .filter((point) => point.trim() !== "");

    return (
      <View key={item.id || index} style={styles.resolutionItem}>
        <View style={styles.resolutionHeader}>
          <Text style={styles.resolutionNumber}>
            Resolution No:-{index + 1}
          </Text>
          <Text style={styles.resolutionDate}>
            <Text style={styles.label}>Date:</Text>{" "}
            {item.agm_date ? formatDate(item.agm_date) : "N/A"}
          </Text>
        </View>

        <View style={styles.resolutionContent}>
          <Text style={styles.resolutionLabel}>
            <Text style={styles.label}>Agenda:</Text> {item.agenda || "N/A"}
          </Text>

          <Text style={styles.resolutionLabel}>
            <Text style={styles.label}>Resolution:</Text>
          </Text>

          {notesList.length > 0 ? (
            <View style={styles.notesList}>
              {notesList.map((point, idx) => (
                <Text key={idx} style={styles.noteItem}>
                  {"\u2022 " + point.trim()}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.noNotes}>No notes available</Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderMobile />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading AGM Resolutions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderMobile />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#4F46E5" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>
            Annual General Meeting Resolutions
          </Text>
          <Text style={styles.pageSubtitle}>
            View and search all resolutions passed at Annual General Meetings
          </Text>
        </View>

        {/* Error Message */}
        {error && error.includes("Authentication") && (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
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
                  // Search will be triggered by useEffect
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

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            Showing{" "}
            <Text style={styles.statsNumber}>
              {pdfSearchTerm && pdfSearchTerm.trim()
                ? Array.isArray(searchResults)
                  ? searchResults.length
                  : 0
                : agmResolutions.length}
            </Text>{" "}
            of <Text style={styles.statsNumber}>{agmResolutions.length}</Text>{" "}
            resolutions
          </Text>
        </View>

        {/* Top stat cards similar to desktop */}
        <View style={styles.statCardsRow}>
          <View style={[styles.statCard, { borderLeftColor: "#4F46E5" }]}>
            <View style={styles.statIconWrap}>
              <Ionicons name="document-text" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Total AGM Meetings</Text>
              <Text style={styles.statNumber}>{agmResolutions.length}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: "#059669" }]}>
            <View style={styles.statIconWrap}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>With Notes</Text>
              <Text style={styles.statNumber}>
                {agmResolutions.filter((r) => r.notes || r.notes_file).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Meetings list */}
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
              const hasSelectedDate = sortedDateKeys.includes(expandedId);

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
                        onPress={() => toggleExpand(dateKey)}
                        style={[
                          styles.dateButton,
                          expandedId === dateKey && styles.selectedDateButton,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateButtonText,
                            expandedId === dateKey &&
                              styles.selectedDateButtonText,
                          ]}
                        >
                          {getDateNumber(dateKey)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Expanded Content */}
                  {hasSelectedDate && expandedId && (
                    <View style={styles.expandedContent}>
                      <View style={styles.expandedHeader}>
                        <Text style={styles.expandedTitle}>
                          Meeting Details - {formatDate(expandedId)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            toggleExpand(expandedId);
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
                          onPress={() => handleTabClick("agenda", expandedId)}
                          style={[
                            styles.tabButton,
                            styles.agendaTab,
                            (activeTab === "agenda" ||
                              viewingType === "agenda") &&
                              styles.activeTabButton,
                          ]}
                        >
                          {pdfSearchTerm.trim() &&
                            groupedByDate[expandedId]?.[0]?.matchedField ===
                              "agenda" && (
                              <View style={styles.matchBadge}>
                                <Text style={styles.matchBadgeText}>MATCH</Text>
                              </View>
                            )}
                          <Text style={styles.tabEmoji}>📋</Text>
                          <Text style={styles.tabText}>Agenda</Text>
                        </TouchableOpacity>

                        {/* Notes Button */}
                        <TouchableOpacity
                          onPress={() => handleTabClick("notes", expandedId)}
                          style={[
                            styles.tabButton,
                            styles.notesTab,
                            (activeTab === "notes" ||
                              viewingType === "notes") &&
                              styles.activeTabButton,
                          ]}
                        >
                          {pdfSearchTerm.trim() &&
                            groupedByDate[expandedId]?.[0]?.matchedField ===
                              "notes" && (
                              <View style={styles.matchBadge}>
                                <Text style={styles.matchBadgeText}>MATCH</Text>
                              </View>
                            )}
                          <Text style={styles.tabEmoji}>📝</Text>
                          <Text style={styles.tabText}>Notes</Text>
                        </TouchableOpacity>
                      </View>

                      {/* PDF Viewer */}
                      {viewingType && (pdfUrl || pdfHtml) && (
                        <View style={styles.pdfViewerContainer}>
                          <View style={styles.pdfViewerHeader}>
                            <Text style={styles.pdfViewerTitle}>
                              Viewing:{" "}
                              {viewingType.charAt(0).toUpperCase() +
                                viewingType.slice(1)}
                            </Text>
                            <View style={styles.pdfViewerActions}>
                              <TouchableOpacity
                                onPress={() => setDebugPanelVisible((s) => !s)}
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
                                onPress={() => {
                                  setPdfUrl("");
                                  setPdfHtml("");
                                  setViewingType(null);
                                  setActiveTab(null);
                                }}
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
                            {pdfLoading && !pdfLoaded ? (
                              <View style={styles.pdfLoadingContainer}>
                                <ActivityIndicator
                                  size="large"
                                  color="#4F46E5"
                                />
                                <Text style={styles.pdfLoadingText}>
                                  Loading PDF...
                                </Text>
                              </View>
                            ) : (
                              <WebView
                                key={`pdf-${webviewKeyRef.current}`}
                                originWhitelist={["*"]}
                                source={
                                  pdfHtml
                                    ? { html: pdfHtml }
                                    : pdfUrl
                                    ? {
                                        uri: pdfUrl,
                                        headers: pdfRemoteHeaders || {},
                                      }
                                    : undefined
                                }
                                style={[
                                  styles.pdfWebView,
                                  { height: pdfWebViewHeight },
                                ]}
                                startInLoadingState
                                mixedContentMode="always"
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                allowFileAccess={true}
                                allowUniversalAccessFromFileURLs={true}
                                allowFileAccessFromFileURLs={true}
                                scalesPageToFit={true}
                                onLoadStart={(e) => {
                                  console.log(
                                    "WebView onLoadStart",
                                    e.nativeEvent.url
                                  );
                                  appendDebug(
                                    "WebView onLoadStart: " +
                                      (pdfUrl || "inline/html")
                                  );
                                }}
                                onLoadEnd={(e) => {
                                  console.log(
                                    "WebView onLoadEnd",
                                    e.nativeEvent.url
                                  );
                                  setPdfLoaded(true);
                                  setPdfLoading(false);
                                  appendDebug(
                                    "WebView onLoadEnd: " +
                                      (pdfUrl || "inline/html")
                                  );
                                }}
                                onHttpError={(e) => {
                                  console.warn(
                                    "WebView HTTP error:",
                                    e.nativeEvent
                                  );
                                  setFileError(
                                    "HTTP Error: " + e.nativeEvent.description
                                  );
                                  appendDebug(
                                    "WebView onHttpError: " +
                                      JSON.stringify(e.nativeEvent)
                                  );
                                }}
                                onError={(e) => {
                                  console.warn("WebView error:", e.nativeEvent);
                                  if (pdfPending && !triedPdfJsFallback) {
                                    appendDebug(
                                      "WebView error — attempting pdf.js fallback"
                                    );
                                    const fbHtml = buildPdfJsHtmlFromUrl(
                                      pdfPending.remote,
                                      pdfPending.token
                                    );
                                    setPdfHtml(fbHtml);
                                    setPdfUrl("");
                                    setTriedPdfJsFallback(true);
                                    return;
                                  }
                                  setFileError(
                                    "Error loading PDF: " +
                                      e.nativeEvent.description
                                  );
                                  appendDebug(
                                    "WebView onError: " +
                                      JSON.stringify(e.nativeEvent)
                                  );
                                }}
                                onMessage={(e) => {
                                  try {
                                    const msg = JSON.parse(e.nativeEvent.data);
                                    if (msg.type === "log") {
                                      console.log("WebView Log:", msg.message);
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
                                      console.log("PDF fully rendered");
                                      setPdfLoaded(true);
                                      setPdfLoading(false);
                                      appendDebug(
                                        "Viewer loaded: " +
                                          String(msg.message || "loaded")
                                      );
                                    } else if (msg.type === "error") {
                                      console.error(
                                        "WebView Error:",
                                        msg.message
                                      );
                                      if (pdfPending && !triedPdfJsFallback) {
                                        appendDebug(
                                          "Inline viewer failed — trying pdf.js fallback"
                                        );
                                        const fbHtml = buildPdfJsHtmlFromUrl(
                                          pdfPending.remote,
                                          pdfPending.token
                                        );
                                        setPdfHtml(fbHtml);
                                        setPdfUrl("");
                                        setTriedPdfJsFallback(true);
                                        return;
                                      }
                                      setFileError(msg.message);
                                      setPdfLoading(false);
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
                                      "Failed to parse WebView message:",
                                      ex
                                    );
                                    appendDebug(
                                      "Failed to parse WebView message: " +
                                        String(ex)
                                    );
                                  }
                                }}
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
                              />
                            )}
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
                            <Text style={styles.errorMessage}>{fileError}</Text>
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
                      {viewingType && debugPanelVisible ? (
                        <View style={styles.debugPanel}>
                          <Text style={styles.debugTitle}>Viewer logs</Text>
                          <ScrollView style={styles.debugScroll}>
                            {debugLogs.length === 0 ? (
                              <Text style={styles.debugLine}>No logs yet</Text>
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
                      {!viewingType && activeTab && (
                        <ScrollView style={styles.tabContentContainer}>
                          {(() => {
                            if (!expandedId || !groupedByDate[expandedId])
                              return null;
                            const items = groupedByDate[expandedId];
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
                              case "notes":
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
                                          {item.notes ||
                                            "No resolution information available"}
                                        </Text>
                                      </View>
                                    ))}
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
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.noDataTitle}>
              {error
                ? "Data unavailable"
                : pdfSearchTerm.trim()
                ? `No meetings found matching "${pdfSearchTerm}"`
                : "No Resolutions Found"}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Karnatak Law Society © {new Date().getFullYear()}
          </Text>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
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
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorContent: { flexDirection: "row", padding: 12, alignItems: "center" },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#991B1B",
    flex: 1,
  },
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1F2937" },
  clearSearchButton: { marginLeft: 8 },
  searchResultsText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
    marginLeft: 12,
    marginBottom: 8,
  },
  statsSection: { padding: 20, paddingTop: 0 },
  statsText: {
    alignSelf: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  statsNumber: { fontWeight: "bold" },
  statCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 6,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#111827" },
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
  notesTab: { backgroundColor: "#FEF3C7" },
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
  footer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  resolutionItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resolutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resolutionNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  resolutionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  label: {
    fontWeight: "bold",
  },
  resolutionContent: {
    marginTop: 8,
  },
  resolutionLabel: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 4,
  },
  notesList: {
    marginLeft: 16,
  },
  noteItem: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  noNotes: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
});

export default AGMResolutionPageMobile;
