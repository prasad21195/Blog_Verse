const express = require('express');
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
const authenticateUser = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { CATEGORIES } = require('../models/Post');

const router = express.Router();

const postValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
];

router.get('/', getPosts);
router.get('/dashboard/mine', authenticateUser, getMyPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

router.post('/', authenticateUser, postValidation, createPost);
router.put('/:id', authenticateUser, updatePost);
router.delete('/:id', authenticateUser, deletePost);

router.post('/:id/like', authenticateUser, toggleLike);

router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateUser, addComment);

module.exports = router;
