const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('closing because uncaught Exception💢❌');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DB_URI.replace(
  '<db_password>',
  process.env.DB_PASSWORD.trim()
);

mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;

// (app) server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  server.close(() => {
    console.log('closing because Unhandled Rejection💢❌');
    process.exit(1);
  });
});
