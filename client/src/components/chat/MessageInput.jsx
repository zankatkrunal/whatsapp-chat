import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { uploadService } from '../../services/uploadService.js';
import EmojiPicker from '../common/EmojiPicker.jsx';
import AttachmentMenu from './AttachmentMenu.jsx';
import { Smile, Paperclip, Send, Mic, X, Trash2, Loader2 } from 'lucide-react';

export const MessageInput = ({ onFileSelected }) => {
  const { user } = useAuth();
  const { replyingTo, cancelReply, sendTextMessage, sendMediaMessage, notifyTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Real voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);

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

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  // --- Voice Note Recording Handlers ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[Voice Recording Error]', err);
      alert('Microphone access is required to record voice notes. Please allow microphone permission.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || isUploadingVoice) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      try {
        setIsUploadingVoice(true);
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });

        const uploadedData = await uploadService.uploadFile(audioFile);
        uploadedData.messageType = 'audio';

        sendMediaMessage(uploadedData, '');
      } catch (err) {
        console.error('[Voice Upload Error]', err);
        alert('Failed to send voice note: ' + err.message);
      } finally {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setIsUploadingVoice(false);
        setRecordingDuration(0);
      }
    };

    recorder.stop();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

      {isRecording ? (
        /* Real-Time Voice Recording Mode UI */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '12px',
            padding: '4px 6px',
            backgroundColor: 'var(--bg-input, #202c33)',
            borderRadius: '10px',
          }}
        >
          <button
            type="button"
            className="icon-btn"
            style={{ color: '#ef4444', width: '36px', height: '36px' }}
            onClick={cancelRecording}
            title="Cancel voice recording"
            disabled={isUploadingVoice}
          >
            <Trash2 size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                animation: 'pulse 1s infinite alternate',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>
              {isUploadingVoice ? 'Sending voice note...' : `Recording: ${formatDuration(recordingDuration)}`}
            </span>
          </div>

          <button
            type="button"
            className="btn-send"
            style={{ backgroundColor: 'var(--accent-green, #00a884)', width: '38px', height: '38px' }}
            onClick={stopAndSendRecording}
            title="Send voice note"
            disabled={isUploadingVoice}
          >
            {isUploadingVoice ? <Loader2 size={18} className="spin" /> : <Send size={18} style={{ marginLeft: '2px' }} />}
          </button>
        </div>
      ) : (
        /* Standard Composer Input UI */
        <>
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
              style={{ width: '42px', height: '42px', color: 'var(--accent-green)' }}
              onClick={startRecording}
              title="Record voice note"
            >
              <Mic size={24} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default MessageInput;
