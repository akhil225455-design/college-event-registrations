const router = require('express').Router();
const { myRegistrations } = require('../controllers/registrationController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/me', protect, requireRole('student'), myRegistrations);

module.exports = router;
