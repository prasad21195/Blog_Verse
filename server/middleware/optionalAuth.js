const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Like authenticateUser, but never blocks the request. If a valid token
// is present, req.user is set; if not, the request just proceeds as
// anonymous. Used on public routes that behave slightly differently
// for logged-in users (e.g. not counting the author's own views).
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) req.user = user;
    }
  } catch (err) {
    // invalid/expired token on a public route -- just treat as anonymous
  }
  next();
};

module.exports = optionalAuth;
