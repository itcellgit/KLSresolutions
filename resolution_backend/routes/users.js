const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.post("/register", userController.register);
router.post("/validateUser", userController.validateUser);

// Protected routes
router.get("/", authMiddleware, userController.getAllUsers);

module.exports = router;
