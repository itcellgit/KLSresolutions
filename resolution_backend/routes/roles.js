const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.get("/roles", roleController.getRoles);
router.post("/roles", roleController.addRole);
router.put("/roles/:id", roleController.editRole);
router.delete("/roles/:id", roleController.deleteRole);

module.exports = router;
