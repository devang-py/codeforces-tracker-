const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.post('/search', profileController.searchUser);
router.get('/:handle', profileController.getProfile);

module.exports = router;
