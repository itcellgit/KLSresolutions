const express = require("express");
const router = express.Router();
const gcResolutionController = require("../controllers/gcResolutionController");
const authMiddleware = require("../middlewares/auth");
const { uploadGCFiles } = require("../middlewares/fileUpload");
const path = require("path");
const fs = require("fs");

// Get all GC resolutions (admin sees all, institute admin sees only their own)
router.get("/", authMiddleware, gcResolutionController.getAllGCResolutions);

// Search PDF content - must be before /:id route
router.get(
  "/search-pdf",
  authMiddleware,
  gcResolutionController.searchPDFContent
);

// Respond to preflight for file requests to help previews (OPTIONS)
router.options("/file/:filename", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Range, Accept"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges"
  );
  return res.sendStatus(204);
});

// View/serve file (sanitized, streams, supports range requests for iOS/Android previews)
router.get("/file/:filename", authMiddleware, (req, res) => {
  try {
    const raw = req.params.filename || "";
    let filename;
    try {
      filename = decodeURIComponent(raw);
    } catch (e) {
      filename = raw;
    }

    // sanitize: basename to avoid directory traversal
    filename = path.basename(filename);
    const uploadsDir = path.resolve(__dirname, "../uploads");
    const filePath = path.resolve(uploadsDir, filename);

    // Prevent path traversal - ensure filePath inside uploadsDir
    if (
      !(filePath === uploadsDir || filePath.startsWith(uploadsDir + path.sep))
    ) {
      console.error("Invalid file path (possible path traversal):", filePath);
      return res.status(400).json({ error: "Invalid file path" });
    }

    console.log("File view requested:", filename);
    console.log("File path:", filePath);
    console.log("User:", req.user?.id);

    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const ext = path.extname(filename).toLowerCase();

    // Determine content type
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx")
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".txt") contentType = "text/plain";

    // CORS & helper headers for previews (iOS WebView, Quick Look)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Range, Accept"
    );
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges"
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", contentType);

    // Safe Content-Disposition with UTF-8 filename* fallback
    const safeFilename = filename.replace(/["\\]/g, "");
    const disposition = `inline; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(
      filename
    )}`;
    res.setHeader("Content-Disposition", disposition);

    // Quick response to HEAD
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", totalSize);
      return res.end();
    }

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      // Parse range header (supports "bytes=START-END" variants)
      const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!matches) {
        res
          .status(416)
          .setHeader("Content-Range", `bytes */${totalSize}`)
          .end();
        return;
      }

      const start = matches[1] ? parseInt(matches[1], 10) : 0;
      const end = matches[2] ? parseInt(matches[2], 10) : totalSize - 1;

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < 0 ||
        start > end ||
        start >= totalSize
      ) {
        res
          .status(416)
          .setHeader("Content-Range", `bytes */${totalSize}`)
          .end();
        return;
      }

      const safeEnd = Math.min(end, totalSize - 1);
      const chunkSize = safeEnd - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${totalSize}`);
      res.setHeader("Content-Length", chunkSize);

      const stream = fs.createReadStream(filePath, { start, end: safeEnd });

      // Clean up if client aborts
      req.on("close", () => {
        if (!stream.destroyed) {
          stream.destroy();
        }
      });

      stream.on("open", () => {
        stream.pipe(res);
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        } else {
          try {
            res.destroy();
          } catch (e) {}
        }
      });
    } else {
      // No range: stream entire file
      res.setHeader("Content-Length", totalSize);
      const stream = fs.createReadStream(filePath);

      req.on("close", () => {
        if (!stream.destroyed) {
          stream.destroy();
        }
      });

      stream.on("open", () => {
        stream.pipe(res);
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent)
          res.status(500).json({ error: "Error sending file" });
        else {
          try {
            res.destroy();
          } catch (e) {}
        }
      });
    }
  } catch (error) {
    console.error("Error in file download route:", error);
    if (!res.headersSent)
      res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error("Multer error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large. Maximum file size is 50MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Too many files or unexpected file field.",
      });
    }
    if (err.message && err.message.includes("Invalid file type")) {
      return res.status(400).json({
        error: err.message,
      });
    }
    return res.status(400).json({
      error: "File upload error: " + (err.message || String(err)),
    });
  }
  next();
};

// Institute admin can add GC resolution (with file upload)
router.post(
  "/",
  authMiddleware,
  uploadGCFiles,
  handleMulterError,
  gcResolutionController.createGCResolution
);

// Update a GC resolution (with file upload)
router.put(
  "/:id",
  authMiddleware,
  uploadGCFiles,
  handleMulterError,
  gcResolutionController.updateGCResolution
);

// Delete a GC resolution
router.delete(
  "/:id",
  authMiddleware,
  gcResolutionController.deleteGCResolution
);

module.exports = router;
