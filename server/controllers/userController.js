import User from '../models/User.js';
import BlockedUser from '../models/BlockedUser.js';

// @desc    Search users by name, username, email, or phone
// @route   GET /api/users/search?q=query
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const searchTerm = q ? q.trim() : '';

    // Get list of users blocked by or who blocked the current user
    const blockedList = await BlockedUser.find({
      $or: [{ userId: req.user._id }, { blockedUserId: req.user._id }],
    });
    const excludedIds = new Set([
      req.user._id.toString(),
      ...blockedList.map((b) =>
        b.userId.toString() === req.user._id.toString()
          ? b.blockedUserId.toString()
          : b.userId.toString()
      ),
    ]);

    const queryFilter = {
      _id: { $nin: Array.from(excludedIds) },
    };

    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      queryFilter.$or = [
        { fullName: regex },
        { username: regex },
        { email: regex },
      ];
    }

    const users = await User.find(queryFilter)
      .select('_id fullName username email avatar about isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1, updatedAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('_id fullName username email phone avatar about isOnline lastSeen privacy createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        error: 'USER_NOT_FOUND',
      });
    }

    // Check if blocked
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { userId: req.user._id, blockedUserId: user._id },
        { userId: user._id, blockedUserId: req.user._id },
      ],
    });

    res.status(200).json({
      success: true,
      user: {
        ...user,
        isBlocked: Boolean(isBlocked),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile (fullName, about, avatar, phone)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, about, avatar, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        error: 'USER_NOT_FOUND',
      });
    }

    if (fullName) user.fullName = fullName.trim();
    if (about !== undefined) user.about = about.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (phone && phone.trim() !== user.phone) {
      const existingPhone = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: user._id },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered to another account.',
          error: 'PHONE_EXISTS',
        });
      }
      user.phone = phone.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
        error: 'MISSING_FIELDS',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
        error: 'PASSWORD_TOO_SHORT',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
        error: 'INCORRECT_PASSWORD',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update privacy settings
// @route   PUT /api/users/privacy
// @access  Private
export const updatePrivacySettings = async (req, res, next) => {
  try {
    const { lastSeen, online, profilePhoto } = req.body;
    const user = await User.findById(req.user._id);

    if (lastSeen) user.privacy.lastSeen = lastSeen;
    if (online) user.privacy.online = online;
    if (profilePhoto) user.privacy.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully.',
      privacy: user.privacy,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user app preferences (theme, enterIsSend, notificationSound)
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  try {
    const { enterIsSend, notificationSound, theme } = req.body;
    const user = await User.findById(req.user._id);

    if (enterIsSend !== undefined) user.settings.enterIsSend = enterIsSend;
    if (notificationSound !== undefined) user.settings.notificationSound = notificationSound;
    if (theme) user.settings.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      settings: user.settings,
    });
  } catch (err) {
    next(err);
  }
};
