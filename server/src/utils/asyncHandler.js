// Forwards rejected promises to the central error handler so a failed
// database call can never crash the server.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
