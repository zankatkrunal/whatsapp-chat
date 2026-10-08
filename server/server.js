import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeSocket } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Create HTTP Server
    const httpServer = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = initializeSocket(httpServer);
    app.set('io', io);

    // 4. Listen
    httpServer.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` ChatConnect Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(` Port: ${PORT}`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(` Socket.IO: Ready for real-time connections`);
      console.log(`===============================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Process] Unhandled Rejection:', err);
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error('[Process] Uncaught Exception:', err);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize server:', err);
    process.exit(1);
  }
};

startServer();
