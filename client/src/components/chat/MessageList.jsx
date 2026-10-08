import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Loader2 } from 'lucide-react';

const getDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const MessageList = ({ onOpenMedia, onDeleteClick, onForwardClick }) => {
  const { messages, loadingMessages, hasMoreMessages, loadMoreMessages } = useChat();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);

  // Auto-scroll to bottom on new message if messages appended
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      // If we just loaded more historical messages at the top, don't jump to bottom
      const isNewMessageAtBottom =
        messages[messages.length - 1]?._id !== prevMessagesLength.current;
      if (isNewMessageAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Group messages by date
  let lastDateLabel = '';

  return (
    <div className="messages-container" ref={containerRef}>
      {/* Pagination button at top */}
      {hasMoreMessages && (
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadMoreMessages}
            disabled={loadingMessages}
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '16px' }}
          >
            {loadingMessages ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={14} className="spin" /> Loading older messages...
              </span>
            ) : (
              'Load earlier messages'
            )}
          </button>
        </div>
      )}

      {/* Message items with date separators */}
      {messages.map((message) => {
        const currentDateLabel = getDateLabel(message.createdAt);
        const showSeparator = currentDateLabel !== lastDateLabel;
        if (showSeparator) {
          lastDateLabel = currentDateLabel;
        }

        return (
          <React.Fragment key={message._id || message.clientTempId}>
            {showSeparator && (
              <div className="date-separator">{currentDateLabel}</div>
            )}
            <MessageBubble
              message={message}
              onOpenMedia={onOpenMedia}
              onDeleteClick={onDeleteClick}
              onForwardClick={onForwardClick}
            />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  );
};

export default MessageList;
