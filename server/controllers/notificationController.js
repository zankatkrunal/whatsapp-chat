import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .populate('senderId', '_id fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a notification or all notifications as read
// @route   PUT /api/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true }
      );
    } else {
      await Notification.updateMany({ userId }, { isRead: true });
    }

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};
