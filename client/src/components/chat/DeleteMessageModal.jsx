import React from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const DeleteMessageModal = ({ isOpen, message, onClose, onDelete }) => {
  const { user } = useAuth();

  if (!isOpen || !message) return null;

  const senderId =
    typeof message.senderId === 'object'
      ? message.senderId._id
      : message.senderId;
  const isSender = user && senderId?.toString() === user._id?.toString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete message?"
      maxWidth="420px"
      footer={
        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onDelete(message._id, 'forMe');
              onClose();
            }}
          >
            Delete for me
          </button>
          {isSender && !message.isDeletedEveryone && (
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: 'var(--danger)' }}
              onClick={() => {
                onDelete(message._id, 'forEveryone');
                onClose();
              }}
            >
              Delete for everyone
            </button>
          )}
        </div>
      }
    >
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Are you sure you want to delete this message?
      </p>
    </Modal>
  );
};

export default DeleteMessageModal;
