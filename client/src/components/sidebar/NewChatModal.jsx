import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { userService } from '../../services/userService.js';
import { useChat } from '../../context/ChatContext.jsx';
import Avatar from '../common/Avatar.jsx';
import { Search, Loader2, MessageSquare, Users } from 'lucide-react';

export const NewChatModal = ({ isOpen, onClose }) => {
  const { createDirectConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startingChatId, setStartingChatId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setUsers([]);
      setError('');
      return;
    }

    const loadUsers = async (query = '') => {
      try {
        setLoading(true);
        setError('');
        const results = await userService.searchUsers(query);
        setUsers(results || []);
      } catch (err) {
        setError(err.message || 'Error searching users');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadUsers(searchTerm.trim());
    }, searchTerm ? 250 : 0);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleSelectUser = async (targetUser) => {
    try {
      setStartingChatId(targetUser._id);
      await createDirectConversation(targetUser._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not start conversation');
    } finally {
      setStartingChatId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Chat"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Search input */}
        <div className="search-input-box">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search users by name or @username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(234, 67, 53, 0.15)',
              color: 'var(--danger)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        <div style={{ minHeight: '180px', maxHeight: '360px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
              <Loader2 size={24} className="spin" color="var(--accent-green)" />
            </div>
          ) : users.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 8px' }}>
                {searchTerm ? 'SEARCH RESULTS' : 'AVAILABLE CONTACTS'}
              </div>
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
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
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      @{u.username} {u.about ? `· ${u.about}` : ''}
                    </div>
                  </div>
                  {startingChatId === u._id ? (
                    <Loader2 size={18} className="spin" color="var(--accent-green)" />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 168, 132, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-green)',
                      }}
                    >
                      <MessageSquare size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchTerm.trim().length > 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              No users found matching "{searchTerm}"
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Users size={32} opacity={0.6} />
              <span>No other registered users yet. Share this app link with your friends to chat!</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NewChatModal;
