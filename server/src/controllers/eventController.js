const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EDITABLE_FIELDS = ['title', 'description', 'category', 'venue', 'date', 'registrationDeadline', 'capacity'];

// Copy only the fields an admin may set. registeredCount and createdBy are never read from the body.
const pickEditable = (body) =>
  EDITABLE_FIELDS.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/events?page=1&limit=8&search=&category=&upcoming=true
exports.listEvents = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 8;

  const filter = {};
  if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.upcoming === 'true') filter.date = { $gte: new Date() };

  const [data, total] = await Promise.all([
    Event.find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/events/:id
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  res.json({ data: event });
});

// POST /api/events  (admin)
exports.createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...pickEditable(req.body), createdBy: req.user._id });
  res.status(201).json({ data: event });
});

// PUT /api/events/:id  (admin)
exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  const changes = pickEditable(req.body);
  if (changes.capacity !== undefined && changes.capacity < event.registeredCount) {
    throw new ApiError(400, `Capacity cannot be lower than the ${event.registeredCount} students already registered`);
  }

  event.set(changes);
  await event.save();
  res.json({ data: event });
});

// DELETE /api/events/:id  (admin)
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');

  await Registration.deleteMany({ event: event._id });
  await event.deleteOne();
  res.status(204).end();
});
