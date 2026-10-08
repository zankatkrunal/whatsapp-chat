import multer from 'multer';
import path from 'path';

// Banned executable extensions for security
const BANNED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.msi', '.jar',
  '.com', '.scr', '.pif', '.gadget', '.application', '.wsf', '.hta',
  '.cpl', '.msc', '.ps1', '.reg',
]);

// Memory storage is 100% compatible with Serverless / Vercel (no read-only filesystem issues)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject dangerous executables
  if (BANNED_EXTENSIONS.has(ext)) {
    const error = new Error('Security Alert: Executable or script files are not allowed.');
    error.code = 'EXECUTABLE_REJECTED';
    return cb(error, false);
  }

  cb(null, true);
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800; // 50MB

export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
});
