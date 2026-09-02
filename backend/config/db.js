const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 30, // Tuned for t3.micro 1GB RAM limits
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 10, // Pre-warmed socket connections
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 30000
    };

    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiz_db',
      options
    );
    console.log(`[MongoDB Connected]: Host -> ${conn.connection.host}, Database -> ${conn.connection.name} (Pool: Min ${options.minPoolSize} / Max ${options.maxPoolSize})`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

