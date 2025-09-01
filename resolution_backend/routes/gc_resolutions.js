const express = require("express");
const router = express.Router();
const gcResolutionController = require("../controllers/gcResolutionController");
const authMiddleware = require("../middlewares/auth");

// Get all GC resolutions (admin sees all, institute admin sees only their own)
router.get("/", authMiddleware, gcResolutionController.getAllGCResolutions);

// Institute admin can add GC resolution
router.post("/", authMiddleware, gcResolutionController.createGCResolution);

module.exports = router;
