const express = require('express');
const { updateProfile } = require('../controllers/userController');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/profile', authenticateUser, updateProfile);

module.exports = router;
