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

// View/serve file
router.get("/file/:filename", authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    console.log("File view requested:", filename);
    console.log("File path:", filePath);
    console.log("User:", req.user?.id);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }

    console.log("File exists, serving file for viewing:", filePath);

    // Get file extension to determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";

    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".doc") {
      contentType = "application/msword";
    } else if (ext === ".docx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext === ".txt") {
      contentType = "text/plain";
    }

    // Set headers for viewing (not downloading)
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", 'inline; filename="' + filename + '"');

    // Send file for viewing
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving file:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error serving file" });
        }
      } else {
        console.log("File served successfully for viewing:", filename);
      }
    });
  } catch (error) {
    console.error("Error in file download route:", error);
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
    if (err.message.includes("Invalid file type")) {
      return res.status(400).json({
        error: err.message,
      });
    }
    return res.status(400).json({
      error: "File upload error: " + err.message,
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
