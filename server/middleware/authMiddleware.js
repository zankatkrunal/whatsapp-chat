import User from '../models/User.js';
import { verifyToken } from '../utils/token.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
      error: 'NO_TOKEN',
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: 'INVALID_TOKEN',
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
        error: 'USER_NOT_FOUND',
      });
    }

    req.user = user;
    // Update presence timestamp periodically on active requests
    User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() }).catch(() => {});
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
      error: 'UNAUTHORIZED',
    });
  }
};
