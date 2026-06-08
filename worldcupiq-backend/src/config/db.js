const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        console.error('Max MongoDB retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
};

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

module.exports = connectDB;
