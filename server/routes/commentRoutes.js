const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

router.delete('/:id', authenticateUser, deleteComment);

module.exports = router;
