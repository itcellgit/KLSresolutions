const express = require("express");
const router = express.Router();
const instituteController = require("../controllers/instituteController");
const authMiddleware = require("../middlewares/auth");

// Get all institutes (protected)
router.get("/", authMiddleware, instituteController.getAllInstitutes);

// Get institute by ID (protected)
router.get("/:id", authMiddleware, instituteController.getInstituteById);

// Create institute (protected)
router.post("/", authMiddleware, instituteController.createInstitute);

// Update institute (protected)
router.put("/:id", authMiddleware, instituteController.updateInstitute);

// Delete institute (protected)
router.delete("/:id", authMiddleware, instituteController.deleteInstitute);

module.exports = router;
