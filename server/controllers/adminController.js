const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalPosts, totalComments, posts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Post.find().select('views likes'),
    ]);

    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);

    res.status(200).json({
      success: true,
      message: 'Site stats fetched successfully',
      data: { totalUsers, totalPosts, totalComments, totalViews, totalLikes },
    });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Users fetched successfully', data: users });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account here' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userPosts = await Post.find({ author: user._id }).select('_id');
    const postIds = userPosts.map((p) => p._id);

    await Promise.all([
      Post.deleteMany({ author: user._id }),
      Comment.deleteMany({ $or: [{ user: user._id }, { post: { $in: postIds } }] }),
      user.deleteOne(),
    ]);

    res.status(200).json({ success: true, message: 'User and their content deleted successfully', data: {} });
  } catch (err) {
    next(err);
  }
};

const getAllPostsForAdmin = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('author', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'All posts fetched successfully', data: posts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getAllUsers, deleteUser, getAllPostsForAdmin };