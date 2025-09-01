const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");

// Public routes
router.post("/register", userController.register);
router.post("/validateUser", userController.validateUser);

// Protected routes
router.get("/", authMiddleware, userController.getAllUsers);

//when creating the institute we are registering a user for the institute admin
router.post(
  "/addInstituteWithUser",
  authMiddleware,
  userController.addInstituteWithUser
);

module.exports = router;
