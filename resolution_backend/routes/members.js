const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const auth = require("../middlewares/auth");

// Create member (protected)
router.post("/", auth, memberController.createMember);

// Get all members (protected)
router.get("/", auth, memberController.getAllMembers);



module.exports = router;
