const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const generateSlug = require('../utils/generateSlug');
const { sanitize, stripHtml } = require('../utils/sanitizeHtml');

// GET /api/posts?search=&category=&page=&limit=
const getPosts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 9 } = req.query;

    const query = {};

    if (search) {
      // Search across title, excerpt and category -- done in MongoDB, not
      // by fetching everything and filtering in React.
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { excerpt: regex }, { category: regex }];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 9, 1);
    const skip = (pageNum - 1) * limitNum;

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Post.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: 'Posts fetched successfully',
      data: posts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalPosts / limitNum) || 1,
        totalPosts,
        limit: limitNum,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:slug
const getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name avatar email createdAt');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    
    const viewerId = req.user ? req.user._id.toString() : req.ip;
const isAuthorViewing = req.user && post.author._id.toString() === req.user._id.toString();

if (!isAuthorViewing && !post.viewedBy.includes(viewerId)) {
  post.views += 1;
  post.viewedBy.push(viewerId);
  await post.save();
}

    res.status(200).json({ success: true, message: 'Post fetched successfully', data: post });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts (protected)
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
const { title, category, content, excerpt, coverImage, tags } = req.body;

    const cleanContent = sanitize(content);

    let finalExcerpt = excerpt && excerpt.trim();
    if (!finalExcerpt) {
      finalExcerpt = stripHtml(cleanContent).slice(0, 150);
    }

    const post = await Post.create({
      title,
      slug: generateSlug(title),
      content: cleanContent,
      excerpt: finalExcerpt,
      category,
      coverImage: coverImage || '',
      author: req.user._id, // NEVER trust an author id from the frontend
      tags: Array.isArray(tags) ? tags : []
    });

    const populated = await post.populate('author', 'name avatar');

    res.status(201).json({ success: true, message: 'Post created successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/posts/:id (protected, owner only)
const updatePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this post' });
    }
const { title, category, content, excerpt, coverImage, tags } = req.body;

    if (title) post.title = title;
    if (category) post.category = category;
    if (content) post.content = sanitize(content);
    if (coverImage) post.coverImage = coverImage;
    if (Array.isArray(tags)) post.tags = tags;

    if (excerpt && excerpt.trim()) {
      post.excerpt = excerpt.trim();
    } else if (content) {
      post.excerpt = stripHtml(post.content).slice(0, 150);
    }

    await post.save();
    const populated = await post.populate('author', 'name avatar');

    res.status(200).json({ success: true, message: 'Post updated successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id (protected, owner only)
const deletePost = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this post' });
    }

    await post.deleteOne();
    await Comment.deleteMany({ post: post._id }); // clean up related comments

    res.status(200).json({ success: true, message: 'Post deleted successfully', data: {} });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/like (protected, toggle)
const toggleLike = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: { isLiked: !alreadyLiked, likesCount: post.likes.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/dashboard/mine (protected) -- posts + stats for current user
const getMyPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });

    const totalPosts = posts.length;
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);

    res.status(200).json({
      success: true,
      message: 'Your posts fetched successfully',
      data: { posts, stats: { totalPosts, totalViews, totalLikes } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getMyPosts,
};
