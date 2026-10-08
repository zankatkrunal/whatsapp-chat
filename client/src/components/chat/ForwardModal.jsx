import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import Avatar from '../common/Avatar.jsx';
import { Forward } from 'lucide-react';

export const ForwardModal = ({ isOpen, message, onClose, onForwardSuccess }) => {
  const { conversations, forwardMessage } = useChat();
  const [selectedConvId, setSelectedConvId] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  if (!isOpen || !message) return null;

  const handleForward = async () => {
    if (!selectedConvId) return;
    try {
      setIsForwarding(true);
      await forwardMessage(message._id, selectedConvId);
      setIsForwarding(false);
      onClose();
      if (onForwardSuccess) onForwardSuccess();
    } catch (err) {
      setIsForwarding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forward message to"
      maxWidth="440px"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isForwarding}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleForward}
            disabled={!selectedConvId || isForwarding}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Forward size={16} /> Forward
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
        {conversations.map((c) => {
          const isSelected = selectedConvId === c._id;
          const title = c.isGroup ? c.groupName : c.participants?.find((p) => p._id !== message.senderId?._id)?.fullName || 'Chat';
          const avatar = c.isGroup ? c.groupAvatar : c.participants?.find((p) => p._id !== message.senderId?._id)?.avatar;

          return (
            <div
              key={c._id}
              onClick={() => setSelectedConvId(c._id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                border: isSelected ? '1px solid var(--accent-green)' : '1px solid transparent',
              }}
            >
              <Avatar src={avatar} name={title} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {c.isGroup ? 'Group' : 'Direct message'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default ForwardModal;
