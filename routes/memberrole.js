const express = require("express");
const router = express.Router();
const memberRoleController = require("../controllers/memberRoleController");
const auth = require("../middlewares/auth");

// Get all member roles (with optional filters)
router.get("/", auth, memberRoleController.getAllMemberRoles);

// Get a single member role by id
router.get("/:id", auth, memberRoleController.getMemberRoleById);

// Create a new member role
router.post("/", memberRoleController.createMemberRole);

// Update a member role by id
router.put("/:id", auth, memberRoleController.updateMemberRole);

// Delete a member role by id
router.delete("/:id", auth, memberRoleController.deleteMemberRole);

module.exports = router;
