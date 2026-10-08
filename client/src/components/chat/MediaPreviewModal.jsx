import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { uploadService } from '../../services/uploadService.js';
import { Send, FileText, Loader2 } from 'lucide-react';

export const MediaPreviewModal = ({ isOpen, file, onClose, onSend }) => {
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const previewUrl = (isImage || isVideo || isAudio) ? URL.createObjectURL(file) : null;

  const handleSend = async () => {
    try {
      setIsUploading(true);
      setErrorMsg('');

      const uploadedData = await uploadService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      onSend(uploadedData, caption);
      setCaption('');
      setIsUploading(false);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'File upload failed');
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isUploading && onClose()}
      title="Send Attachment"
      maxWidth="500px"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSend}
            disabled={isUploading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="spin" /> Sending... {uploadProgress}%
              </>
            ) : (
              <>
                <Send size={16} /> Send
              </>
            )}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Preview Container */}
        <div
          style={{
            minHeight: '200px',
            maxHeight: '320px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isImage && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain' }}
            />
          )}

          {isVideo && (
            <video
              src={previewUrl}
              controls
              style={{ maxHeight: '300px', maxWidth: '100%' }}
            />
          )}

          {isAudio && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <audio src={previewUrl} controls style={{ width: '100%' }} />
              <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {file.name}
              </p>
            </div>
          )}

          {!isImage && !isVideo && !isAudio && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <FileText size={48} color="var(--accent-green)" />
              <p style={{ marginTop: '12px', fontWeight: 500, fontSize: '15px' }}>
                {file.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(234, 67, 53, 0.15)',
              color: 'var(--danger)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Caption Input */}
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isUploading}
          className="form-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isUploading) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </div>
    </Modal>
  );
};

export default MediaPreviewModal;
