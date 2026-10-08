import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import BlockedUser from '../models/BlockedUser.js';
import Notification from '../models/Notification.js';
import { connectDB } from '../config/db.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Group.deleteMany({}),
      BlockedUser.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');

    // 1. Create Users
    const users = await User.create([
      {
        fullName: 'Alex Johnson',
        username: 'alex_j',
        email: 'alex@example.com',
        phone: '+12025550143',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        about: 'Available for chats and project updates!',
        isOnline: true,
      },
      {
        fullName: 'Sarah Connor',
        username: 'sarah_c',
        email: 'sarah@example.com',
        phone: '+12025550189',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        about: 'Building cool things with React and Node.',
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        fullName: 'David Miller',
        username: 'david_m',
        email: 'david@example.com',
        phone: '+12025550199',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        about: 'Design & Code Enthusiast 🚀',
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 120),
      },
      {
        fullName: 'Priya Sharma',
        username: 'priya_s',
        email: 'priya@example.com',
        phone: '+919876543210',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
        about: 'Hey! ChatConnect is awesome.',
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    ]);

    const [alex, sarah, david, priya] = users;

    console.log('[Seed] Creating direct conversation between Alex and Sarah...');

    // 2. Direct Conversation: Alex & Sarah
    const directConv = await Conversation.create({
      participants: [alex._id, sarah._id],
      isGroup: false,
      unreadCounts: {
        [alex._id.toString()]: 0,
        [sarah._id.toString()]: 1,
      },
    });

    const m1 = await Message.create({
      conversationId: directConv._id,
      senderId: alex._id,
      receiverId: sarah._id,
      content: 'Hey Sarah! Did you check out the new ChatConnect updates?',
      messageType: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    });

    const m2 = await Message.create({
      conversationId: directConv._id,
      senderId: sarah._id,
      receiverId: alex._id,
      content: 'Yes! Real-time Socket.IO messaging is super responsive!',
      messageType: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 40),
    });

    const m3 = await Message.create({
      conversationId: directConv._id,
      senderId: alex._id,
      receiverId: sarah._id,
      content: 'Awesome! Let me know if you need any media files or testing documents.',
      messageType: 'text',
      status: 'delivered',
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    });

    directConv.lastMessage = m3._id;
    directConv.lastMessageAt = m3.createdAt;
    await directConv.save();

    // 3. Direct Conversation: Alex & David
    console.log('[Seed] Creating direct conversation between Alex and David...');
    const davidConv = await Conversation.create({
      participants: [alex._id, david._id],
      isGroup: false,
      unreadCounts: {
        [alex._id.toString()]: 0,
        [david._id.toString()]: 0,
      },
    });

    const md1 = await Message.create({
      conversationId: davidConv._id,
      senderId: david._id,
      receiverId: alex._id,
      content: 'Hey Alex, do you have the UI specifications ready?',
      messageType: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
    });

    davidConv.lastMessage = md1._id;
    davidConv.lastMessageAt = md1.createdAt;
    await davidConv.save();

    // 4. Group Conversation: "Project Alpha Team"
    console.log('[Seed] Creating group conversation "Project Alpha Team"...');
    const groupDoc = await Group.create({
      name: 'Project Alpha Team',
      description: 'Official group for ChatConnect development & release team.',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80',
      creator: alex._id,
      admins: [alex._id],
      members: [alex._id, sarah._id, david._id, priya._id],
    });

    const groupConv = await Conversation.create({
      participants: [alex._id, sarah._id, david._id, priya._id],
      isGroup: true,
      group: groupDoc._id,
      groupName: groupDoc.name,
      groupAvatar: groupDoc.avatar,
      groupDescription: groupDoc.description,
      groupAdmin: [alex._id],
      unreadCounts: {
        [alex._id.toString()]: 0,
        [sarah._id.toString()]: 0,
        [david._id.toString()]: 0,
        [priya._id.toString()]: 0,
      },
    });

    groupDoc.conversationId = groupConv._id;
    await groupDoc.save();

    const gm1 = await Message.create({
      conversationId: groupConv._id,
      senderId: alex._id,
      content: 'Alex Johnson created group "Project Alpha Team"',
      messageType: 'system',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 300),
    });

    const gm2 = await Message.create({
      conversationId: groupConv._id,
      senderId: alex._id,
      content: 'Welcome team! Let us test group messages and media attachments here.',
      messageType: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 250),
    });

    const gm3 = await Message.create({
      conversationId: groupConv._id,
      senderId: priya._id,
      content: 'Sounds great! I will test sending images and documents.',
      messageType: 'text',
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 100),
    });

    groupConv.lastMessage = gm3._id;
    groupConv.lastMessageAt = gm3.createdAt;
    await groupConv.save();

    console.log('====================================================');
    console.log('✅ Demo Seed Data successfully created in MongoDB!');
    console.log('Accounts available for testing:');
    console.log('1. alex@example.com   / password123 (Alex Johnson)');
    console.log('2. sarah@example.com  / password123 (Sarah Connor)');
    console.log('3. david@example.com  / password123 (David Miller)');
    console.log('4. priya@example.com  / password123 (Priya Sharma)');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
