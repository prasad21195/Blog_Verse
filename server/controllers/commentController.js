const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// GET /api/posts/:id/comments
const getComments = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'name avatar') // only safe fields, never email/password
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: 'Comments fetched successfully', data: comments });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/comments (protected)
const addComment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }
    if (text.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Comment is too long (max 500 characters)' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text.trim(),
    });

    const populated = await comment.populate('user', 'name avatar');

    res.status(201).json({ success: true, message: 'Comment added successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id (protected, owner or admin)
const deleteComment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.status(200).json({ success: true, message: 'Comment deleted successfully', data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, deleteComment };