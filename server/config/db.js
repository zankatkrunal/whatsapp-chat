import mongoose from 'mongoose';

let cachedConn = null;

export const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (cachedConn) {
    return cachedConn;
  }

  const defaultAtlasUri =
    'mongodb+srv://zankatkrunal33_db_user:t9GpEA2%402iWBhm_@cluster0.s8xqova.mongodb.net/chat?retryWrites=true&w=majority';
  const uri = process.env.MONGODB_URI || defaultAtlasUri;

  try {
    cachedConn = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    const conn = await cachedConn;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    cachedConn = null;
    console.warn(`[MongoDB] Could not connect to primary URI: ${err.message}`);

    if (process.env.NODE_ENV === 'production') {
      throw err;
    }

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
      throw err;
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
