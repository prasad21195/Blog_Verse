const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getMyPosts,
} = require('../controllers/postController');
const { getComments, addComment } = require('../controllers/commentController');
const { summarizePost } = require('../controllers/aiController');
const authenticateUser = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { CATEGORIES } = require('../models/Post');

const router = express.Router();

const postValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
];

// AI summarization calls a paid/quota-limited external API, so this needs
// a tighter limit than normal routes to prevent quota exhaustion or abuse.
const summarizeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { success: false, message: 'Too many summary requests. Please try again later.' },
});

router.get('/', getPosts);
router.get('/dashboard/mine', authenticateUser, getMyPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

router.post('/', authenticateUser, postValidation, createPost);
router.put('/:id', authenticateUser, updatePost);
router.delete('/:id', authenticateUser, deletePost);

router.post('/:id/like', authenticateUser, toggleLike);

router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateUser, addComment);

router.post('/:id/summarize', authenticateUser, summarizeLimiter, summarizePost);

module.exports = router;