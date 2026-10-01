const express = require('express');
const { getStats, getAllUsers, deleteUser, getAllPostsForAdmin } = require('../controllers/adminController');
const authenticateUser = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticateUser, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/posts', getAllPostsForAdmin);

module.exports = router;