const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, memberController.getAllMembers);
router.post("/", authMiddleware, memberController.createMember);

module.exports = router;
