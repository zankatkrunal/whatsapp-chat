import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import EmojiPicker from '../common/EmojiPicker.jsx';
import AttachmentMenu from './AttachmentMenu.jsx';
import { Smile, Paperclip, Send, Mic, X } from 'lucide-react';

export const MessageInput = ({ onFileSelected }) => {
  const { user } = useAuth();
  const { replyingTo, cancelReply, sendTextMessage, notifyTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [text]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    notifyTyping(e.target.value.length > 0);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    sendTextMessage(text);
    setText('');
    notifyTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    const enterIsSend = user?.settings?.enterIsSend !== false;
    if (e.key === 'Enter' && !e.shiftKey && enterIsSend) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="chat-composer">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="composer-reply-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
              Replying to {replyingTo.senderId?.fullName || 'User'}
            </span>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '2px 0 0 0',
              }}
            >
              {replyingTo.content || 'Media message'}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            onClick={cancelReply}
            title="Cancel reply"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Attachment Menu Popup */}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onFileSelected={onFileSelected}
      />

      {/* Emoji Button */}
      <button
        type="button"
        className={`icon-btn ${showEmojiPicker ? 'active' : ''}`}
        onClick={() => {
          setShowEmojiPicker(!showEmojiPicker);
          setShowAttachmentMenu(false);
        }}
        title="Add emoji"
      >
        <Smile size={24} />
      </button>

      {/* Attachment Button */}
      <button
        type="button"
        className={`icon-btn ${showAttachmentMenu ? 'active' : ''}`}
        onClick={() => {
          setShowAttachmentMenu(!showAttachmentMenu);
          setShowEmojiPicker(false);
        }}
        title="Attach file"
      >
        <Paperclip size={24} />
      </button>

      {/* Textarea Input Container */}
      <div className="composer-input-wrap">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="composer-textarea"
        />
      </div>

      {/* Send or Mic button */}
      {text.trim() ? (
        <button
          type="button"
          className="btn-send"
          onClick={handleSend}
          title="Send message"
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      ) : (
        <button
          type="button"
          className="icon-btn"
          style={{ width: '42px', height: '42px' }}
          onClick={() => {
            // Quick voice note simulation note
            setText('🎤 [Voice note recorded]');
          }}
          title="Voice message"
        >
          <Mic size={24} />
        </button>
      )}
    </div>
  );
};

export default MessageInput;
