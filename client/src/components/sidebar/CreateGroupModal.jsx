import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { userService } from '../../services/userService.js';
import { useChat } from '../../context/ChatContext.jsx';
import Avatar from '../common/Avatar.jsx';
import { Search, X, Loader2, Users } from 'lucide-react';

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createNewGroup } = useChat();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setDescription('');
      setSearchTerm('');
      setSearchedUsers([]);
      setSelectedUsers([]);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 1) {
        try {
          const results = await userService.searchUsers(searchTerm.trim());
          setSearchedUsers(results || []);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchedUsers([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleToggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await createNewGroup({
        name: groupName.trim(),
        description: description.trim(),
        memberIds: selectedUsers.map((u) => u._id),
      });

      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Create New Group"
      maxWidth="480px"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreate}
            disabled={!groupName.trim() || isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" /> Creating...
              </>
            ) : (
              <>
                <Users size={16} /> Create Group
              </>
            )}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

        {/* Group Name */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Group Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Project Alpha Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={60}
          />
        </div>

        {/* Group Description */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Description (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Group description or purpose"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
        </div>

        {/* Selected Members Badges */}
        {selectedUsers.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Selected Members ({selectedUsers.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedUsers.map((u) => (
                <div
                  key={u._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg-header)',
                    borderRadius: '16px',
                    fontSize: '12.5px',
                  }}
                >
                  <Avatar src={u.avatar} name={u.fullName} size="xs" />
                  <span>{u.fullName}</span>
                  <X
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleUser(u)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search for participants to add */}
        <div className="search-input-box">
          <Search size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search users to add to group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Search Results */}
        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          {searchedUsers.map((u) => {
            const isSelected = selectedUsers.some((sel) => sel._id === u._id);
            return (
              <div
                key={u._id}
                onClick={() => handleToggleUser(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                <Avatar src={u.avatar} name={u.fullName} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{u.fullName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>@{u.username}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  style={{ accentColor: 'var(--accent-green)', cursor: 'pointer' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default CreateGroupModal;
