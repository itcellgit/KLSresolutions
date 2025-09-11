const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const auth = require("../middlewares/auth");

// Create member (protected)
router.post("/", auth, memberController.createMember);

// Get all members (protected)
router.get("/", auth, memberController.getAllMembers);

// Update member (protected) - ADD THIS ROUTE
router.put("/:id", auth, memberController.updateMember);

// Delete member (protected) - ADD THIS ROUTE
router.delete("/:id", auth, memberController.deleteMember);

module.exports = router;
