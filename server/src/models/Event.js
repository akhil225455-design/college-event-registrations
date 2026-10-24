const mongoose = require('mongoose');

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3, maxlength: 120 },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    venue: { type: String, required: [true, 'Venue is required'], trim: true, minlength: 2, maxlength: 120 },
    date: { type: Date, required: [true, 'Event date is required'] },
    registrationDeadline: { type: Date, required: [true, 'Registration deadline is required'] },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Capacity must be a whole number' },
    },
    // Changed only through atomic updates in the registration controller.
    registeredCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

eventSchema.index({ date: 1 });
eventSchema.index({ category: 1, date: 1 });

eventSchema.virtual('seatsLeft').get(function seatsLeft() {
  return Math.max(this.capacity - this.registeredCount, 0);
});

// open | full | closed (deadline passed) | ended (event already started)
eventSchema.virtual('registrationStatus').get(function registrationStatus() {
  const now = Date.now();
  if (this.date.getTime() < now) return 'ended';
  if (this.registrationDeadline.getTime() < now) return 'closed';
  if (this.registeredCount >= this.capacity) return 'full';
  return 'open';
});

module.exports = mongoose.model('Event', eventSchema);
module.exports.CATEGORIES = CATEGORIES;
