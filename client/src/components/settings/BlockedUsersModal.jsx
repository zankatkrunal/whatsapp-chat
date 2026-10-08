import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { blockService } from '../../services/blockService.js';
import Avatar from '../common/Avatar.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const BlockedUsersModal = ({ isOpen, onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBlocked = async () => {
      try {
        setLoading(true);
        const list = await blockService.getBlockedUsers();
        setBlockedUsers(list || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocked();
  }, [isOpen]);

  const handleUnblock = async (targetUserId) => {
    try {
      setUnblockingId(targetUserId);
      await blockService.unblockUser(targetUserId);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== targetUserId));
    } catch (err) {
      console.error(err);
    } finally {
      setUnblockingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Blocked Contacts"
      maxWidth="460px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="spin" color="var(--accent-green)" />
          </div>
        ) : blockedUsers.length > 0 ? (
          blockedUsers.map((u) => (
            <div
              key={u._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: 'var(--bg-panel-secondary)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar src={u.avatar} name={u.fullName} size="sm" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{u.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{u.username}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '4px 12px' }}
                onClick={() => handleUnblock(u._id)}
                disabled={unblockingId === u._id}
              >
                {unblockingId === u._id ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={36} opacity={0.6} style={{ marginBottom: '8px' }} />
            <p>You have not blocked any contacts.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BlockedUsersModal;
