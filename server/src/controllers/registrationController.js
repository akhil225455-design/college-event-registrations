const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/events/:id/register  (student)
exports.registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  const status = event.registrationStatus;
  if (status === 'ended') throw new ApiError(400, 'This event has already started');
  if (status === 'closed') throw new ApiError(400, 'Registration for this event has closed');

  if (await Registration.exists({ user: req.user._id, event: event._id })) {
    throw new ApiError(409, 'You are already registered for this event');
  }

  // Reserve a seat atomically: the filter only matches while seats remain, so two
  // students racing for the last seat cannot both succeed.
  const reserved = await Event.findOneAndUpdate(
    { _id: event._id, $expr: { $lt: ['$registeredCount', '$capacity'] } },
    { $inc: { registeredCount: 1 } },
    { new: true }
  );
  if (!reserved) throw new ApiError(409, 'Sorry, this event is full');

  try {
    await Registration.create({ user: req.user._id, event: event._id });
  } catch (err) {
    // Give the seat back if saving the registration failed (for example a duplicate click).
    await Event.updateOne({ _id: event._id }, { $inc: { registeredCount: -1 } });
    throw err;
  }

  res.status(201).json({ message: 'You are registered for this event', data: reserved });
});

// DELETE /api/events/:id/register  (student)
exports.cancelRegistration = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.registrationStatus === 'ended') {
    throw new ApiError(400, 'This event has already started, so the registration cannot be cancelled');
  }

  const removed = await Registration.findOneAndDelete({ user: req.user._id, event: event._id });
  if (!removed) throw new ApiError(404, 'You are not registered for this event');

  const updated = await Event.findOneAndUpdate(
    { _id: event._id, registeredCount: { $gt: 0 } },
    { $inc: { registeredCount: -1 } },
    { new: true }
  );

  res.json({ message: 'Your registration has been cancelled', data: updated || event });
});

// GET /api/registrations/me  (student: only ever their own records)
exports.myRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id }).populate('event').sort({ createdAt: -1 });
  res.json({ data: registrations.filter((r) => r.event) });
});

// GET /api/events/:id/registrations  (admin)
exports.listEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  const registrations = await Registration.find({ event: event._id })
    .populate('user', 'name email department rollNumber')
    .sort({ createdAt: 1 });

  res.json({ event, data: registrations.filter((r) => r.user) });
});
