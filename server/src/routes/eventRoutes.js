const router = require('express').Router();
const events = require('../controllers/eventController');
const registrations = require('../controllers/registrationController');
const { protect, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, eventRules, listEventRules } = require('../validators');

const adminOnly = [protect, requireRole('admin')];
const studentOnly = [protect, requireRole('student')];

// Public
router.get('/', listEventRules, validate, events.listEvents);
router.get('/:id', idParam, validate, events.getEvent);

// Admin: manage events and see who registered
router.post('/', adminOnly, eventRules, validate, events.createEvent);
router.put('/:id', adminOnly, idParam, eventRules, validate, events.updateEvent);
router.delete('/:id', adminOnly, idParam, validate, events.deleteEvent);
router.get('/:id/registrations', adminOnly, idParam, validate, registrations.listEventRegistrations);

// Student: register for or cancel an event
router.post('/:id/register', studentOnly, idParam, validate, registrations.registerForEvent);
router.delete('/:id/register', studentOnly, idParam, validate, registrations.cancelRegistration);

module.exports = router;
