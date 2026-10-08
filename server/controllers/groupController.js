import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { name, description = '', avatar = '', memberIds = [] } = req.body;
    const creatorId = req.user._id;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.',
        error: 'MISSING_NAME',
      });
    }

    // Ensure creator is in members and admins list
    const uniqueMembers = Array.from(
      new Set([creatorId.toString(), ...memberIds.map((id) => id.toString())])
    );

    // Create Group document
    const group = await Group.create({
      name: name.trim(),
      description: description.trim(),
      avatar,
      creator: creatorId,
      admins: [creatorId],
      members: uniqueMembers,
    });

    // Create corresponding Conversation document
    const conversation = await Conversation.create({
      participants: uniqueMembers,
      isGroup: true,
      group: group._id,
      groupName: group.name,
      groupAvatar: group.avatar,
      groupDescription: group.description,
      groupAdmin: [creatorId],
      unreadCounts: {},
    });

    // Link conversation to group
    group.conversationId = conversation._id;
    await group.save();

    // Create initial system message
    const systemMsg = await Message.create({
      conversationId: conversation._id,
      senderId: creatorId,
      content: `${req.user.fullName} created group "${group.name}"`,
      messageType: 'system',
      status: 'read',
    });

    conversation.lastMessage = systemMsg._id;
    conversation.lastMessageAt = systemMsg.createdAt;
    await conversation.save();

    const populatedConv = await Conversation.findById(conversation._id)
      .populate('participants', '_id fullName username email phone avatar about isOnline lastSeen')
      .populate('groupAdmin', '_id fullName username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: '_id fullName username avatar',
        },
      });

    res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      group,
      conversation: populatedConv,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get group details
// @route   GET /api/groups/:id
// @access  Private
export const getGroupDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate('members', '_id fullName username avatar about isOnline lastSeen')
      .populate('admins', '_id fullName username avatar')
      .populate('creator', '_id fullName username avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
        error: 'GROUP_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update group information (name, description, avatar)
// @route   PUT /api/groups/:id
// @access  Private (Admins only)
export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
        error: 'GROUP_NOT_FOUND',
      });
    }

    const isAdmin = group.admins.some((a) => a.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update group info.',
        error: 'ADMIN_ONLY',
      });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    // Also update conversation mirror fields
    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(group.conversationId, {
        groupName: group.name,
        groupDescription: group.description,
        groupAvatar: group.avatar,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add members to group
// @route   POST /api/groups/:id/members
// @access  Private (Admins only)
export const addMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds = [] } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
        error: 'GROUP_NOT_FOUND',
      });
    }

    const isAdmin = group.admins.some((a) => a.toString() === requesterId.toString());
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add members.',
        error: 'ADMIN_ONLY',
      });
    }

    // Add new members
    const currentMemberStrs = group.members.map((m) => m.toString());
    const newlyAdded = userIds.filter((uId) => !currentMemberStrs.includes(uId.toString()));

    group.members.push(...newlyAdded);
    await group.save();

    // Update conversation participants
    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(group.conversationId, {
        $addToSet: { participants: { $each: newlyAdded } },
      });

      // Post system message
      const addedUsers = await User.find({ _id: { $in: newlyAdded } }).select('fullName');
      const names = addedUsers.map((u) => u.fullName).join(', ');
      await Message.create({
        conversationId: group.conversationId,
        senderId: requesterId,
        content: `${req.user.fullName} added ${names}`,
        messageType: 'system',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Members added successfully.',
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (Admins only)
export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const requesterId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
        error: 'GROUP_NOT_FOUND',
      });
    }

    const isAdmin = group.admins.some((a) => a.toString() === requesterId.toString());
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members.',
        error: 'ADMIN_ONLY',
      });
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    group.admins = group.admins.filter((a) => a.toString() !== userId);
    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(group.conversationId, {
        $pull: { participants: userId, groupAdmin: userId },
      });

      const removedUser = await User.findById(userId).select('fullName');
      await Message.create({
        conversationId: group.conversationId,
        senderId: requesterId,
        content: `${req.user.fullName} removed ${removedUser ? removedUser.fullName : 'a member'}`,
        messageType: 'system',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully.',
      group,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Leave group
// @route   POST /api/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found.',
        error: 'GROUP_NOT_FOUND',
      });
    }

    group.members = group.members.filter((m) => m.toString() !== userId.toString());
    group.admins = group.admins.filter((a) => a.toString() !== userId.toString());

    // If no admins left and members exist, make first member an admin
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }

    await group.save();

    if (group.conversationId) {
      await Conversation.findByIdAndUpdate(group.conversationId, {
        $pull: { participants: userId, groupAdmin: userId },
      });

      await Message.create({
        conversationId: group.conversationId,
        senderId: userId,
        content: `${req.user.fullName} left the group`,
        messageType: 'system',
      });
    }

    res.status(200).json({
      success: true,
      message: 'You have left the group.',
    });
  } catch (err) {
    next(err);
  }
};
