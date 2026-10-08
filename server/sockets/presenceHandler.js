import User from '../models/User.js';

// Global map: userId (string) -> Set of socketIds
export const onlineUsers = new Map();

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

export const getUserSocketIds = (userId) => {
  const sockets = onlineUsers.get(userId.toString());
  return sockets ? Array.from(sockets) : [];
};

export const handleUserConnect = async (io, socket) => {
  const userId = socket.userId;

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // User's private notification room
  socket.join(`user_${userId}`);

  // If this is the user's first connected socket/tab
  if (onlineUsers.get(userId).size === 1) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Broadcast presence update
      io.emit('userOnline', {
        userId,
        isOnline: true,
      });

      io.emit('userStatusChanged', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (err) {
      console.error('[Socket Presence] Error updating online status:', err.message);
    }
  }
};

export const handleUserDisconnect = async (io, socket) => {
  const userId = socket.userId;

  if (onlineUsers.has(userId)) {
    const userSockets = onlineUsers.get(userId);
    userSockets.delete(socket.id);

    if (userSockets.size === 0) {
      onlineUsers.delete(userId);

      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });

        // Broadcast presence update
        io.emit('userOffline', {
          userId,
          isOnline: false,
          lastSeen,
        });

        io.emit('userStatusChanged', {
          userId,
          isOnline: false,
          lastSeen,
        });
      } catch (err) {
        console.error('[Socket Presence] Error updating offline status:', err.message);
      }
    }
  }
};
