const express = require("express");
const router = express.Router();
const bomResolutionController = require("../controllers/bomResolutionController");
const authMiddleware = require("../middlewares/auth");

// Admin can see all BOM resolutions
router.get("/", authMiddleware, bomResolutionController.getAllBOMResolutions);

// Admin can create BOM agenda
router.post("/", authMiddleware, bomResolutionController.createBOMResolution);

module.exports = router;
