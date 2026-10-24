const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  try {
    await connectDB();
    app.listen(port, () => console.log(`API listening on port ${port}`));
  } catch (err) {
    console.error('Failed to start the server:', err.message);
    process.exit(1);
  }
}

start();
