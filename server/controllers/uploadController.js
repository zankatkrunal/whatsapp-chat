import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import streamifier from 'streamifier';

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

    const { originalname, mimetype, size, buffer } = req.file;

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

    // If Cloudinary is configured, upload stream to Cloudinary
    if (isCloudinaryConfigured && cloudinary) {
      try {
        const resourceType =
          messageType === 'image'
            ? 'image'
            : messageType === 'video' || messageType === 'audio'
            ? 'video'
            : 'raw';

        const uploadStream = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'chatconnect',
                resource_type: resourceType,
                filename_override: originalname,
              },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
            streamifier.createReadStream(buffer).pipe(stream);
          });

        const uploadResult = await uploadStream();
        fileUrl = uploadResult.secure_url;
      } catch (cloudErr) {
        console.warn('[Storage] Cloudinary upload error, using Data URI fallback:', cloudErr.message);
        fileUrl = `data:${mimetype};base64,${buffer.toString('base64')}`;
      }
    } else {
      // Direct Data URI format: 100% serverless compatible, zero disk dependencies
      fileUrl = `data:${mimetype};base64,${buffer.toString('base64')}`;
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
