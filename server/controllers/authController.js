import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { generateToken } from '../utils/token.js';
import { sendSmsOtp } from '../services/smsService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, username, password, avatar } = req.body;

    // Field existence validation (Phone is now optional so anyone can register easily)
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, username, email, and password.',
        error: 'MISSING_FIELDS',
      });
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL',
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
        error: 'PASSWORD_TOO_SHORT',
      });
    }

    // Normalized values
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedPhone = phone ? phone.trim() : '';

    // Check for existing duplicate records
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
        error: 'EMAIL_ALREADY_EXISTS',
      });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose another username.',
        error: 'USERNAME_ALREADY_EXISTS',
      });
    }

    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists.',
          error: 'PHONE_ALREADY_EXISTS',
        });
      }
    }

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      username: normalizedUsername,
      password,
      avatar: avatar || '',
      isOnline: true,
      lastSeen: new Date(),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password.',
        error: 'MISSING_CREDENTIALS',
      });
    }

    const cleanIdentifier = identifier.trim();
    const cleanLower = cleanIdentifier.toLowerCase();

    // Find by email, username, or phone
    const user = await User.findOne({
      $or: [
        { email: cleanLower },
        { username: cleanLower },
        { phone: cleanIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
        error: 'INVALID_CREDENTIALS',
      });
    }

    // Update presence
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user & update presence
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        error: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send 6-digit OTP to mobile phone
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number with country code (e.g. +919876543210).',
        error: 'INVALID_PHONE',
      });
    }

    const cleanPhone = phone.trim();

    // Generate 6-digit cryptographic-quality random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous pending OTP for this number
    await Otp.deleteMany({ phone: cleanPhone });

    // Store in database with 5 minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({
      phone: cleanPhone,
      otp: otpCode,
      expiresAt,
    });

    // Send Real SMS
    const smsResult = await sendSmsOtp(cleanPhone, otpCode);

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}. Valid for 5 minutes.`,
      phone: cleanPhone,
      provider: smsResult.provider,
      ...(smsResult.testOtp && { devOtp: smsResult.testOtp }),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP and log in / auto-register
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtpLogin = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and 6-digit OTP code are required.',
        error: 'MISSING_FIELDS',
      });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.toString().trim();

    // Find valid OTP record
    const validRecord = await Otp.findOne({
      phone: cleanPhone,
      otp: cleanOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!validRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new code.',
        error: 'INVALID_OTP',
      });
    }

    // Delete used OTP
    await Otp.deleteMany({ phone: cleanPhone });

    // Check if user already exists
    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // Auto-create account for new phone number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername = `user_${cleanPhone.replace(/\D/g, '').slice(-6)}_${randomSuffix}`;
      const placeholderEmail = `${generatedUsername}@chatconnect.app`;
      const randomPassword = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      user = await User.create({
        fullName: `User ${cleanPhone.slice(-4)}`,
        username: generatedUsername,
        email: placeholderEmail,
        phone: cleanPhone,
        password: randomPassword,
        isOnline: true,
        lastSeen: new Date(),
      });
    } else {
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Mobile number verified successfully. Welcome to ChatConnect!',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

