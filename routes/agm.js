const express = require("express");
const router = express.Router();
const agmController = require("../controllers/agmController");
const authMiddleware = require("../middlewares/auth");
const { uploadAGMFiles } = require("../middlewares/fileUpload");
const path = require("path");
const fs = require("fs");

router.get("/", authMiddleware, agmController.getAGMs);

// Optional: search inside uploaded AGM PDFs/text
router.get("/search-pdf", authMiddleware, agmController.searchPDFContent);

router.get("/file/:filename", authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    console.log("AGM file view requested:", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

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

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving AGM file:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error serving file" });
        }
      }
    });
  } catch (error) {
    console.error("Error in AGM file route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
      error: "File upload error: " + (err.message || err),
    });
  }
  next();
};

router.post(
  "/",
  authMiddleware,
  uploadAGMFiles,
  handleMulterError,
  agmController.createAGM
);

router.put(
  "/:id",
  authMiddleware,
  uploadAGMFiles,
  handleMulterError,
  agmController.updateAGM
);

router.delete("/:id", authMiddleware, agmController.deleteAGM);

// Get AGMs as per member's institutes
router.get("/by-member/all", authMiddleware, agmController.getAGMsByMember);

// Get AGM by id (ensure this is after more specific routes)
router.get("/:id", authMiddleware, agmController.getAGMById);

module.exports = router;
