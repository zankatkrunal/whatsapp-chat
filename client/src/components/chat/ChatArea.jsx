import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import MediaPreviewModal from './MediaPreviewModal.jsx';
import DeleteMessageModal from './DeleteMessageModal.jsx';
import ForwardModal from './ForwardModal.jsx';
import Modal from '../common/Modal.jsx';
import { MessageSquare, Lock, ShieldCheck } from 'lucide-react';

export const ChatArea = ({
  onBackClick,
  onOpenInfo,
  onOpenBlock,
}) => {
  const {
    activeConversation,
    sendMediaMessage,
    deleteMessage,
  } = useChat();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
  const [forwardTargetMessage, setForwardTargetMessage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Handle file selected from composer
  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setShowMediaModal(true);
  };

  // When no conversation is selected
  if (!activeConversation) {
    return (
      <div className="chat-area">
        <div className="chat-wallpaper" />
        <div className="empty-chat-state">
          <div className="empty-chat-icon">
            <MessageSquare size={48} />
          </div>
          <h2 className="empty-chat-title">ChatConnect Web</h2>
          <p className="empty-chat-desc">
            Send and receive real-time messages, media, voice notes, and documents.
            Multi-device synchronized messaging inspired by WhatsApp.
          </p>
          <div className="encrypted-banner">
            <Lock size={14} />
            <span>End-to-end encrypted messaging</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area active">
      <div className="chat-wallpaper" />

      {/* Header */}
      <ChatHeader
        onBackClick={onBackClick}
        onOpenInfo={onOpenInfo}
        onOpenBlock={onOpenBlock}
      />

      {/* Messages */}
      <MessageList
        onOpenMedia={(msg) => setLightboxImage(msg.mediaUrl)}
        onDeleteClick={(msg) => setDeleteTargetMessage(msg)}
        onForwardClick={(msg) => setForwardTargetMessage(msg)}
      />

      {/* Composer Input */}
      <MessageInput onFileSelected={handleFileSelected} />

      {/* Media Upload & Preview Modal */}
      <MediaPreviewModal
        isOpen={showMediaModal}
        file={selectedFile}
        onClose={() => {
          setShowMediaModal(false);
          setSelectedFile(null);
        }}
        onSend={(uploadedData, caption) => {
          sendMediaMessage(uploadedData, caption);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={Boolean(deleteTargetMessage)}
        message={deleteTargetMessage}
        onClose={() => setDeleteTargetMessage(null)}
        onDelete={(msgId, type) => deleteMessage(msgId, type)}
      />

      {/* Forward Message Modal */}
      <ForwardModal
        isOpen={Boolean(forwardTargetMessage)}
        message={forwardTargetMessage}
        onClose={() => setForwardTargetMessage(null)}
      />

      {/* Lightbox Modal for full images */}
      <Modal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        title="Photo Preview"
        maxWidth="720px"
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src={lightboxImage}
            alt="Fullscreen preview"
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ChatArea;
