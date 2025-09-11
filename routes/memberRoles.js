const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const auth = require("../middlewares/auth");

// Create member role (protected)
router.post("/", auth, memberController.assignRole);
