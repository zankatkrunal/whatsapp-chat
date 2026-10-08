import React, { useRef } from 'react';
import { Image, FileText, Music } from 'lucide-react';

export const AttachmentMenu = ({ isOpen, onClose, onFileSelected }) => {
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file, type);
    }
    e.target.value = '';
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '65px',
        left: '52px',
        backgroundColor: 'var(--bg-modal)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100,
        minWidth: '200px',
      }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={photoInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        onChange={(e) => handleFileChange(e, 'media')}
      />
      <input
        type="file"
        ref={docInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        onChange={(e) => handleFileChange(e, 'document')}
      />
      <input
        type="file"
        ref={audioInputRef}
        style={{ display: 'none' }}
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
      />

      <button
        type="button"
        onClick={() => photoInputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          padding: '8px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#bf59cf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Image size={18} />
        </div>
        <span>Photos & Videos</span>
      </button>

      <button
        type="button"
        onClick={() => docInputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          padding: '8px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#5157ae',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <FileText size={18} />
        </div>
        <span>Document</span>
      </button>

      <button
        type="button"
        onClick={() => audioInputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          padding: '8px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#e67e22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Music size={18} />
        </div>
        <span>Audio</span>
      </button>
    </div>
  );
};

export default AttachmentMenu;
