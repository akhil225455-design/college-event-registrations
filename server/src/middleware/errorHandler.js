const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, 'Route not found'));

// One place that turns every error into the same JSON shape: { message }.
// Technical details go to the server log, never to the client.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = Object.values(err.errors)[0].message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message =
      field === 'email' ? 'An account with this email already exists' : 'You are already registered for this event';
  } else if (!err.isOperational) {
    status = 500;
    message = 'Something went wrong. Please try again.';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
