const express = require('express');
const router = express.Router();
const agmMemberController = require('../controllers/agmMemberController');

router.get('/', agmMemberController.getAllAGMs);

module.exports = router;
