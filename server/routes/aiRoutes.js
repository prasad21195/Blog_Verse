const express = require('express');
const rateLimit = require('express-rate-limit');
const { generateTitleTags, rewriteText } = require('../controllers/aiController');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many AI requests. Please try again later.' },
});

router.post('/generate-title-tags', authenticateUser, aiLimiter, generateTitleTags);
router.post('/rewrite', authenticateUser, aiLimiter, rewriteText);

module.exports = router;