const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.get("/", roleController.getRoles);
router.post("/", roleController.addRole);
router.put("/:id", roleController.editRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
