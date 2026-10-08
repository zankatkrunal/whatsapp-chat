import mongoose from 'mongoose';

let mongoMemoryServer = null;

export const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatconnect';

  try {
    // Attempt connecting to the configured MongoDB URI with a short timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to primary URI (${uri}): ${err.message}`);
    console.log('[MongoDB] Initializing in-memory MongoDB fallback (zero-config mode)...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB] In-memory database running at: ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error('[MongoDB] In-memory database failed to start:', memErr.message);
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
