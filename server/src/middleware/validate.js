const { validationResult } = require('express-validator');

// Runs after a chain of express-validator checks and stops the request
// with a 400 and a consistent JSON shape if any check failed.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ message: errors[0].message, errors });
};
