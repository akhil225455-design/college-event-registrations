const { body, param, query } = require('express-validator');
const { CATEGORIES } = require('../models/Event');

// isString() on every text field also blocks NoSQL operator injection such as
// { "email": { "$ne": "" } } or ?search[$ne]=x, because objects are not strings.

const idParam = [param('id').isMongoId().withMessage('Invalid identifier')];

const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email')
    .isString()
    .trim()
    .toLowerCase()
    .isLength({ max: 254 })
    .isEmail()
    .withMessage('Enter a valid email address'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters'),
  body('department').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }).withMessage('Department is too long'),
  body('rollNumber').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }).withMessage('Roll number is too long'),
];

const loginRules = [
  body('email').isString().trim().toLowerCase().isEmail().withMessage('Enter a valid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const eventRules = [
  body('title').isString().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('venue').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Venue must be 2-120 characters'),
  body('date').isISO8601().withMessage('Enter a valid event date and time').toDate(),
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Enter a valid registration deadline')
    .toDate()
    .custom((deadline, { req }) => {
      if (deadline > req.body.date) {
        throw new Error('Registration deadline must be on or before the event date');
      }
      return true;
    }),
  body('capacity').isInt({ min: 1, max: 100000 }).withMessage('Capacity must be a whole number from 1 to 100000').toInt(),
];

const listEventRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search text is too long'),
  query('category').optional().isIn(CATEGORIES).withMessage('Unknown category'),
  query('upcoming').optional().isIn(['true', 'false']).withMessage('upcoming must be true or false'),
];

module.exports = { idParam, registerRules, loginRules, eventRules, listEventRules };
