import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate blocks
blockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
export default BlockedUser;
