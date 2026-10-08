import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import Avatar from '../common/Avatar.jsx';
import {
  ArrowLeft,
  Search,
  MoreVertical,
  User,
  Users,
  ShieldAlert,
} from 'lucide-react';

const formatLastSeen = (date) => {
  if (!date) return 'offline';
  const d = new Date(date);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return `last seen today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `last seen on ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
};

export const ChatHeader = ({
  onBackClick,
  onOpenInfo,
  onOpenBlock,
}) => {
  const { user } = useAuth();
  const { activeConversation, typingUsers } = useChat();
  const { getUserPresence } = useSocket();
  const [showMenu, setShowMenu] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;

  // For 1v1: identify other participant
  const otherParticipant = isGroup
    ? null
    : activeConversation.participants?.find(
        (p) => (typeof p === 'object' ? p._id : p).toString() !== user?._id?.toString()
      );

  const title = isGroup
    ? activeConversation.groupName
    : otherParticipant?.fullName || 'Chat';

  const avatar = isGroup
    ? activeConversation.groupAvatar
    : otherParticipant?.avatar;

  // Real-time presence for 1v1
  const presence = !isGroup && otherParticipant
    ? getUserPresence(otherParticipant._id, {
        isOnline: otherParticipant.isOnline,
        lastSeen: otherParticipant.lastSeen,
      })
    : { isOnline: false, lastSeen: null };

  // Typing status
  const currentTyping = typingUsers[activeConversation._id] || [];
  const isTyping = currentTyping.length > 0;

  return (
    <div className="chat-header">
      {/* Left side: Back arrow (mobile) + Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Mobile back button */}
        <button
          type="button"
          className="icon-btn mobile-back-btn"
          onClick={onBackClick}
          title="Back to chats"
        >
          <ArrowLeft size={20} />
        </button>

        <div
          className="chat-header-user"
          onClick={onOpenInfo}
          title="Click to view info"
        >
          <Avatar
            src={avatar}
            name={title}
            size="md"
            isOnline={presence.isOnline}
            showOnlineBadge={!isGroup}
          />

          <div style={{ minWidth: 0 }}>
            <div className="chat-header-title">{title}</div>
            <div className="chat-header-subtitle">
              {isTyping ? (
                <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>
                  typing...
                </span>
              ) : isGroup ? (
                <span>
                  {activeConversation.participants?.length || 0} members
                </span>
              ) : presence.isOnline ? (
                <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>
                  online
                </span>
              ) : (
                <span>{formatLastSeen(presence.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Actions & Menu */}
      <div className="chat-header-actions" style={{ position: 'relative' }}>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenInfo}
          title={isGroup ? 'Group Info' : 'Contact Info'}
        >
          {isGroup ? <Users size={20} /> : <User size={20} />}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowMenu(!showMenu)}
          title="More options"
        >
          <MoreVertical size={20} />
        </button>

        {/* Header Dropdown Menu */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              backgroundColor: 'var(--bg-dropdown)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              minWidth: '180px',
              zIndex: 100,
              padding: '6px 0',
            }}
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onOpenInfo();
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isGroup ? <Users size={16} /> : <User size={16} />}
              <span>{isGroup ? 'Group info' : 'Contact info'}</span>
            </button>

            {!isGroup && onOpenBlock && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenBlock();
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ShieldAlert size={16} />
                <span>Block contact</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
