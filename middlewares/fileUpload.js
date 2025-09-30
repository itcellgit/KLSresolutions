const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + "-" + uniqueSuffix + fileExtension;
    console.log(
      "Generated filename:",
      fileName,
      "for original:",
      file.originalname
    );
    cb(null, fileName);
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    fieldSize: 50 * 1024 * 1024, // 50MB limit for form fields
  },
});

// Middleware for handling multiple file fields
const uploadGCFiles = upload.fields([
  { name: "agenda", maxCount: 1 },
  { name: "resolution", maxCount: 1 },
  { name: "compliance", maxCount: 1 },
  { name: "meeting_notes", maxCount: 1 },
]);

// Middleware for handling BOM file fields
const uploadBOMFiles = upload.fields([
  { name: "agenda", maxCount: 1 },
  { name: "resolution", maxCount: 1 },
  { name: "compliance", maxCount: 1 },
]);

//module.exports = uploadGCFiles;

module.exports = {
  uploadGCFiles,
  uploadBOMFiles: uploadGCFiles, // Same middleware, different name
};
