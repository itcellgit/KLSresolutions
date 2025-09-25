const express = require("express");
const router = express.Router();
const managementTenureController = require("../controllers/managementTenureController");
const auth = require("../middlewares/auth");

// Get all management tenures (protected)
router.get("/", auth, managementTenureController.getAllManagementTenures);

// Get a single management tenure by id (protected)
router.get("/:id", auth, managementTenureController.getManagementTenureById);

// Create a new management tenure (protected)
router.post("/", auth, managementTenureController.createManagementTenure);

// Update a management tenure (protected)
router.put("/:id", auth, managementTenureController.updateManagementTenure);

// Delete a management tenure (protected)
router.delete("/:id", auth, managementTenureController.deleteManagementTenure);

module.exports = router;
