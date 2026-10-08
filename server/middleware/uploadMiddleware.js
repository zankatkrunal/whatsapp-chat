import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Banned executable extensions for security
const BANNED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.msi', '.jar',
  '.com', '.scr', '.pif', '.gadget', '.application', '.wsf', '.hta',
  '.cpl', '.msc', '.ps1', '.reg',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject dangerous executables
  if (BANNED_EXTENSIONS.has(ext)) {
    const error = new Error('Security Alert: Executable or script files are not allowed.');
    error.code = 'EXECUTABLE_REJECTED';
    return cb(error, false);
  }

  // Allowed mime types categories:
  // Images, Videos, Audios, Documents, Archives
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');
  const isDoc = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/octet-stream',
  ].includes(file.mimetype);

  if (isImage || isVideo || isAudio || isDoc) {
    cb(null, true);
  } else {
    cb(null, true); // Still accept general user attachments while executables are strictly rejected
  }
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800; // 50MB

export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
});
