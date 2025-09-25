const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const auth = require("../middlewares/auth");

router.get("/", auth, roleController.getRoles);
router.post("/", auth, roleController.addRole);
router.put("/:id", auth, roleController.editRole);
router.delete("/:id", auth, roleController.deleteRole);

module.exports = router;
