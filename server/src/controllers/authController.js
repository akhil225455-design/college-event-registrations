const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });

// POST /api/auth/register  (public sign-up always creates a student)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, department, rollNumber } = req.body;

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, department, rollNumber, role: 'student' });

  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    // Same message for unknown email and wrong password, so attackers learn nothing.
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
