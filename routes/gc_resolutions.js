const express = require("express");
const router = express.Router();
const gcResolutionController = require("../controllers/gcResolutionController");
const authMiddleware = require("../middlewares/auth");

// Get all GC resolutions (admin sees all, institute admin sees only their own)
router.get("/", authMiddleware, gcResolutionController.getAllGCResolutions);

// Institute admin can add GC resolution
router.post("/", authMiddleware, gcResolutionController.createGCResolution);

// Update a GC resolution
router.put("/:id", authMiddleware, gcResolutionController.updateGCResolution);

// Delete a GC resolution
router.delete(
  "/:id",
  authMiddleware,
  gcResolutionController.deleteGCResolution
);

module.exports = router;
