// Creates the first admin account and, if the database has no events yet, a few sample events.
// Run with: npm run seed   (needs ADMIN_EMAIL and ADMIN_PASSWORD in server/.env)
require('./config/env');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');

const DAY = 24 * 60 * 60 * 1000;
const at = (days, hour) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function seed() {
  const { ADMIN_NAME = 'Event Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding');
  }
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  await connectDB();

  let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: 'admin',
    });
    console.log(`Created admin account: ${admin.email}`);
  } else {
    console.log(`Admin account already exists: ${admin.email}`);
  }

  if ((await Event.countDocuments()) === 0) {
    await Event.insertMany([
      {
        title: '24-Hour Hackathon',
        description: 'Build a working prototype in teams of up to four. Mentors from the CSE department will be around all night.',
        category: 'Technical',
        venue: 'Main Seminar Hall',
        date: at(14, 9),
        registrationDeadline: at(10, 17),
        capacity: 80,
      },
      {
        title: 'Annual Cultural Evening',
        description: 'Music, dance and drama performances by students from every department, followed by an open stage.',
        category: 'Cultural',
        venue: 'Open Air Auditorium',
        date: at(21, 17),
        registrationDeadline: at(18, 17),
        capacity: 300,
      },
      {
        title: 'Inter-Department Football',
        description: 'Knockout tournament with one team per department. Each team registers 11 players and 3 substitutes.',
        category: 'Sports',
        venue: 'College Football Ground',
        date: at(9, 15),
        registrationDeadline: at(6, 12),
        capacity: 16,
      },
      {
        title: 'Git and GitHub Workshop',
        description: 'A hands-on session on branches, pull requests and resolving merge conflicts. Bring your own laptop.',
        category: 'Workshop',
        venue: 'Computer Lab 2',
        date: at(5, 10),
        registrationDeadline: at(3, 17),
        capacity: 40,
      },
      {
        title: 'Careers in Data Science',
        description: 'Two alumni working in data roles talk about how they got started and answer questions from the audience.',
        category: 'Seminar',
        venue: 'Room 204',
        date: at(30, 14),
        registrationDeadline: at(28, 17),
        capacity: 120,
      },
    ].map((event) => ({ ...event, createdBy: admin._id })));
    console.log('Added 5 sample events');
  } else {
    console.log('Events already exist, skipping sample events');
  }

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
