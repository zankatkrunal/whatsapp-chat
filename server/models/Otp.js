import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '5m' }, // Automatically deleted from MongoDB after 5 minutes
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ phone: 1, createdAt: -1 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
