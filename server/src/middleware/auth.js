const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret } = require('../config/env');

// Authentication: who are you?
const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Please log in to continue');
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'This account no longer exists');
  }

  req.user = user;
  next();
});

// Authorization: what may you do?
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do that'));
    }
    return next();
  };

module.exports = { protect, requireRole };
