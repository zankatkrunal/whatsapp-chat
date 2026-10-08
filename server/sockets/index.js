import { Server } from 'socket.io';
import { socketAuth } from './socketAuth.js';
import { handleUserConnect, handleUserDisconnect } from './presenceHandler.js';
import { registerChatHandlers } from './chatHandler.js';
import { registerGroupHandlers } from './groupHandler.js';

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authenticate socket connections using JWT
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    // Handle presence & join user's notification room
    await handleUserConnect(io, socket);

    // Register Chat and Group events
    registerChatHandlers(io, socket);
    registerGroupHandlers(io, socket);

    // Socket disconnection
    socket.on('disconnect', async () => {
      await handleUserDisconnect(io, socket);
    });
  });

  return io;
};
