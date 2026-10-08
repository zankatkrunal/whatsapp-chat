import api from './api.js';

const BANNED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.msi', '.jar',
  '.com', '.scr', '.pif', '.gadget', '.application', '.wsf', '.hta',
  '.cpl', '.msc', '.ps1', '.reg',
]);

export const uploadService = {
  async uploadFile(file, onProgress) {
    if (!file) throw new Error('No file provided for upload.');

    // Validate dangerous file extensions on client
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (BANNED_EXTENSIONS.has(ext)) {
      throw new Error('Security policy: Executable or script files are not allowed.');
    }

    // Validate size limit (50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File exceeds the 50MB maximum upload limit.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return res.data;
  },
};
