import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import MessageStatusIcon from '../common/MessageStatusIcon.jsx';
import AudioPlayer from '../common/AudioPlayer.jsx';
import {
  MoreVertical,
  Reply,
  Share2,
  Copy,
  Trash2,
  FileText,
  Download,
  Forward,
} from 'lucide-react';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatFileSize = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const MessageBubble = ({
  message,
  onOpenMedia,
  onDeleteClick,
  onForwardClick,
}) => {
  const { user } = useAuth();
  const { setReplyingTo, activeConversation } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const senderId =
    typeof message.senderId === 'object'
      ? message.senderId._id
      : message.senderId;
  const isOutgoing = user && senderId?.toString() === user._id?.toString();

  // Handle system message
  if (message.messageType === 'system') {
    return (
      <div className="message-bubble-row system">
        <div className="system-message-bubble">{message.content}</div>
      </div>
    );
  }

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowMenu(false);
  };

  const handleReply = () => {
    setReplyingTo(message);
    setShowMenu(false);
  };

  const handleForward = () => {
    if (onForwardClick) onForwardClick(message);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (onDeleteClick) onDeleteClick(message);
    setShowMenu(false);
  };

  return (
    <div
      className={`message-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      <div
        className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}
        style={{ paddingRight: (isHovered || showMenu) ? '24px' : '10px' }}
      >
        {/* Hover action menu trigger */}
        {(isHovered || showMenu) && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              display: 'inline-block',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              className="icon-btn"
              style={{
                width: '20px',
                height: '20px',
                opacity: 0.8,
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              title="Message options"
            >
              <MoreVertical size={13} />
            </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: isOutgoing ? 'auto' : '0',
                left: isOutgoing ? '0' : 'auto',
                backgroundColor: 'var(--bg-dropdown)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                zIndex: 100,
                minWidth: '150px',
                padding: '4px 0',
              }}
            >
              <button
                type="button"
                onClick={handleReply}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Reply size={15} /> Reply
              </button>
              <button
                type="button"
                onClick={handleForward}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Forward size={15} /> Forward
              </button>
              {message.content && !message.isDeletedEveryone && (
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Copy size={15} /> Copy
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      )}

        {/* Sender Name in group for incoming messages */}
        {activeConversation?.isGroup && !isOutgoing && typeof message.senderId === 'object' && message.senderId?.fullName && (
          <div className="message-sender-name">
            {message.senderId.fullName}
          </div>
        )}

        {/* Forwarded Tag */}
        {message.isForwarded && (
          <div className="message-forwarded-tag">
            <Share2 size={12} /> Forwarded
          </div>
        )}

        {/* Quoted Reply Preview */}
        {message.replyTo && (
          <div className="reply-preview-box">
            <div className="reply-preview-sender">
              {message.replyTo.senderId?.fullName || 'Replying to message'}
            </div>
            <div className="reply-preview-content">
              {message.replyTo.content ||
                (message.replyTo.messageType === 'image' && '📷 Photo') ||
                (message.replyTo.messageType === 'document' && '📄 Document') ||
                'Media'}
            </div>
          </div>
        )}

        {/* Media rendering */}
        {message.messageType === 'image' && message.mediaUrl && (
          <div style={{ marginBottom: '6px' }}>
            <img
              src={message.mediaUrl}
              alt={message.fileName || 'Photo'}
              className="bubble-image"
              onClick={() => onOpenMedia && onOpenMedia(message)}
            />
          </div>
        )}

        {message.messageType === 'video' && message.mediaUrl && (
          <div style={{ marginBottom: '6px' }}>
            <video
              src={message.mediaUrl}
              controls
              className="bubble-video"
            />
          </div>
        )}

        {message.messageType === 'audio' && message.mediaUrl && (
          <div style={{ marginBottom: '6px' }}>
            <AudioPlayer src={message.mediaUrl} />
          </div>
        )}

        {message.messageType === 'document' && message.mediaUrl && (
          <div
            className="bubble-document"
            onClick={() => window.open(message.mediaUrl, '_blank')}
            title="Download document"
          >
            <FileText size={32} color="var(--accent-green)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {message.fileName || 'Attachment'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatFileSize(message.fileSize)}
              </div>
            </div>
            <Download size={18} color="var(--text-secondary)" />
          </div>
        )}

        {/* Message Content Text */}
        {message.content && (
          <div
            className={`message-content ${
              message.isDeletedEveryone ? 'deleted' : ''
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp and Status Icons */}
        <div className="message-meta">
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing && !message.isDeletedEveryone && (
            <MessageStatusIcon status={message.status} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
