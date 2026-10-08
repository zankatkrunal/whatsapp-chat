import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

export const socketAuth = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication failed: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication failed: Invalid or expired token'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication failed: User no longer exists'));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (err) {
    next(new Error(`Authentication failed: ${err.message}`));
  }
};
