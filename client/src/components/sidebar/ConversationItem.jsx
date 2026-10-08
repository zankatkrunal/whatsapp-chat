import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import Avatar from '../common/Avatar.jsx';
import MessageStatusIcon from '../common/MessageStatusIcon.jsx';
import { Image, FileText, Music } from 'lucide-react';

const formatConversationTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
};

export const ConversationItem = ({ conversation, isActive, onClick }) => {
  const { user } = useAuth();
  const { getUserPresence } = useSocket();

  const isGroup = conversation.isGroup;

  // Identify recipient in 1-on-1 chats
  const otherParticipant = isGroup
    ? null
    : conversation.participants?.find(
        (p) => (typeof p === 'object' ? p._id : p).toString() !== user?._id?.toString()
      );

  const title = isGroup
    ? conversation.groupName
    : otherParticipant?.fullName || 'User';

  const avatar = isGroup
    ? conversation.groupAvatar
    : otherParticipant?.avatar;

  const presence = !isGroup && otherParticipant
    ? getUserPresence(otherParticipant._id, {
        isOnline: otherParticipant.isOnline,
        lastSeen: otherParticipant.lastSeen,
      })
    : { isOnline: false };

  // Last message formatting
  const lastMsg = conversation.lastMessage;
  const lastSenderId =
    typeof lastMsg?.senderId === 'object'
      ? lastMsg.senderId._id
      : lastMsg?.senderId;
  const isOutgoing = user && lastSenderId?.toString() === user._id?.toString();

  const renderLastMessageSnippet = () => {
    if (!lastMsg) return 'No messages yet';

    if (lastMsg.isDeletedEveryone) {
      return <em>This message was deleted</em>;
    }

    if (lastMsg.messageType === 'image') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Image size={14} /> Photo {lastMsg.content ? `· ${lastMsg.content}` : ''}
        </span>
      );
    }

    if (lastMsg.messageType === 'document') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={14} /> {lastMsg.fileName || 'Document'}
        </span>
      );
    }

    if (lastMsg.messageType === 'audio') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Music size={14} /> Voice note
        </span>
      );
    }

    return lastMsg.content;
  };

  const unreadCount = conversation.unreadCount || 0;

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar-wrap">
        <Avatar
          src={avatar}
          name={title}
          size="md"
          isOnline={presence.isOnline}
          showOnlineBadge={!isGroup}
        />
      </div>

      <div className="conversation-info">
        <div className="conversation-top-row">
          <span className="conversation-name">{title}</span>
          <span className="conversation-time">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>

        <div className="conversation-bottom-row">
          <div className="conversation-last-msg">
            {isOutgoing && lastMsg && (
              <span style={{ display: 'inline-flex', marginRight: '2px' }}>
                <MessageStatusIcon status={lastMsg.status} size={14} />
              </span>
            )}
            {renderLastMessageSnippet()}
          </div>

          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
