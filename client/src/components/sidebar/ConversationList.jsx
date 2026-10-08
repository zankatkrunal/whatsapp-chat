import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { userService } from '../../services/userService.js';
import ConversationItem from './ConversationItem.jsx';
import Avatar from '../common/Avatar.jsx';
import { MessageSquare, Users, MessageSquareDashed, MessageSquarePlus, Loader2 } from 'lucide-react';

export const ConversationList = ({ searchQuery = '', onSelectConversation, onOpenNewChat }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    loadingConversations,
    createDirectConversation,
  } = useChat();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'groups'
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState(null);

  // Search registered users from database when user types in search box
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      setSearchedUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const results = await userService.searchUsers(term);
        // Exclude current user and users who already have active 1v1 conversation in the list
        const existingDirectParticipantIds = new Set(
          conversations
            .filter((c) => !c.isGroup)
            .flatMap((c) => c.participants.map((p) => (typeof p === 'object' ? p._id : p).toString()))
        );

        const newContacts = (results || []).filter(
          (u) => u._id !== user?._id && !existingDirectParticipantIds.has(u._id)
        );
        setSearchedUsers(newContacts);
      } catch (err) {
        console.error('Error searching users in conversation list:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, conversations, user]);

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((conv) => {
    // Tab filter
    if (activeTab === 'unread' && (conv.unreadCount || 0) <= 0) {
      return false;
    }
    if (activeTab === 'groups' && !conv.isGroup) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const title = conv.isGroup
        ? conv.groupName.toLowerCase()
        : conv.participants
            ?.find((p) => (typeof p === 'object' ? p._id : p).toString() !== user?._id?.toString())
            ?.fullName?.toLowerCase() || '';

      const lastMsgText = conv.lastMessage?.content?.toLowerCase() || '';
      return title.includes(term) || lastMsgText.includes(term);
    }

    return true;
  });

  const handleItemClick = (conv) => {
    selectConversation(conv);
    if (onSelectConversation) {
      onSelectConversation(conv);
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    try {
      setStartingChatUserId(targetUser._id);
      const conv = await createDirectConversation(targetUser._id);
      if (onSelectConversation) {
        onSelectConversation(conv);
      }
    } catch (err) {
      console.error('Could not start conversation:', err);
    } finally {
      setStartingChatUserId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`filter-tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread
        </button>
        <button
          type="button"
          className={`filter-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
      </div>

      {/* Conversation Scroll Container */}
      <div className="conversation-list">
        {loadingConversations ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading conversations...
          </div>
        ) : (
          <>
            {/* Existing matching conversations */}
            {filteredConversations.length > 0 && (
              <>
                {searchQuery && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, padding: '8px 16px 4px 16px', textTransform: 'uppercase' }}>
                    Chats
                  </div>
                )}
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    conversation={conv}
                    isActive={activeConversation?._id === conv._id}
                    onClick={() => handleItemClick(conv)}
                  />
                ))}
              </>
            )}

            {/* Direct User Search Results (Start New Chat with found users) */}
            {searchQuery && searchedUsers.length > 0 && (
              <div style={{ marginTop: filteredConversations.length > 0 ? '8px' : '0' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--accent-green)', fontWeight: 600, padding: '8px 16px 4px 16px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquarePlus size={13} /> Registered Users (Click to Chat)
                </div>
                {searchedUsers.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => handleStartChatWithUser(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Avatar
                      src={u.avatar}
                      name={u.fullName}
                      size="md"
                      isOnline={u.isOnline}
                      showOnlineBadge={true}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                        {u.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        @{u.username} {u.about ? `· ${u.about}` : ''}
                      </div>
                    </div>
                    {startingChatUserId === u._id ? (
                      <Loader2 size={18} className="spin" color="var(--accent-green)" />
                    ) : (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#ffffff',
                          backgroundColor: 'var(--accent-green)',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontWeight: 500,
                        }}
                      >
                        Chat
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty States */}
            {filteredConversations.length === 0 && searchedUsers.length === 0 && (
              <div
                style={{
                  padding: '50px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                {activeTab === 'groups' ? (
                  <>
                    <Users size={40} opacity={0.6} />
                    <p style={{ fontSize: '14px' }}>No groups joined yet</p>
                  </>
                ) : activeTab === 'unread' ? (
                  <>
                    <MessageSquare size={40} opacity={0.6} />
                    <p style={{ fontSize: '14px' }}>No unread messages</p>
                  </>
                ) : searchQuery ? (
                  <>
                    <MessageSquareDashed size={40} opacity={0.6} />
                    <p style={{ fontSize: '14px' }}>No chats or users found matching "{searchQuery}"</p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onOpenNewChat}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 18px',
                        fontSize: '13.5px',
                        marginTop: '4px',
                      }}
                    >
                      <MessageSquarePlus size={16} />
                      View All Users
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 168, 132, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-green)',
                      }}
                    >
                      <MessageSquarePlus size={32} />
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        No conversations yet
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '240px' }}>
                        Connect and start messaging with any registered user.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onOpenNewChat}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginTop: '6px',
                        boxShadow: '0 4px 12px rgba(0, 168, 132, 0.3)',
                      }}
                    >
                      <MessageSquarePlus size={18} />
                      Start New Chat
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
