const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, memberController.createMember);
router.get("/", authMiddleware, memberController.getAllMembers);


module.exports = router;
