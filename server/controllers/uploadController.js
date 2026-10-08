import path from 'path';
import fs from 'fs';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

// @desc    Upload media or document file
// @route   POST /api/upload
// @access  Private
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
        error: 'NO_FILE',
      });
    }

    const { originalname, mimetype, size, filename, path: localFilePath } = req.file;

    // Detect message type
    let messageType = 'document';
    if (mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (mimetype.startsWith('video/')) {
      messageType = 'video';
    } else if (mimetype.startsWith('audio/')) {
      messageType = 'audio';
    }

    let fileUrl = '';

    // If Cloudinary is configured, upload to Cloudinary
    if (isCloudinaryConfigured) {
      try {
        const resourceType = messageType === 'image' ? 'image' : messageType === 'video' || messageType === 'audio' ? 'video' : 'raw';
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
          folder: 'chatconnect',
          resource_type: resourceType,
          use_filename: true,
        });

        fileUrl = uploadResult.secure_url;

        // Clean up local file after cloud upload
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (cloudErr) {
        console.warn('[Storage] Cloudinary upload error, falling back to local storage URL:', cloudErr.message);
        // Fall back to local URL
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        fileUrl = `${protocol}://${host}/uploads/${filename}`;
      }
    } else {
      // Local storage URL
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      fileUrl = `${protocol}://${host}/uploads/${filename}`;
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      fileName: originalname,
      fileSize: size,
      mimeType: mimetype,
      messageType,
    });
  } catch (err) {
    next(err);
  }
};
