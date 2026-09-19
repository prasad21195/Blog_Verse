const jwt = require('jsonwebtoken');

// JWT payload intentionally contains ONLY the user id.
// Never put email, role or other sensitive/changeable data inside the token.
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
