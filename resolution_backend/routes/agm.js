const express = require('express');
const router = express.Router();
const agmController = require('../controllers/agmController');

router.post('/', agmController.createAGM);
router.get('/', agmController.getAGMs);
router.get('/:id', agmController.getAGMById);
router.put('/:id', agmController.updateAGM);
router.delete('/:id', agmController.deleteAGM);

// Route to get AGMs as per member's institutes
router.get('/by-member/all', agmController.getAGMsByMember);

module.exports = router;
