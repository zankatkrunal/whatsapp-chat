import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

export const MessageStatusIcon = ({ status, size = 15 }) => {
  if (status === 'read') {
    return (
      <span title="Read" style={{ color: '#53bdeb', display: 'inline-flex' }}>
        <CheckCheck size={size} strokeWidth={2.5} />
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span title="Delivered" style={{ color: 'rgba(233, 237, 239, 0.7)', display: 'inline-flex' }}>
        <CheckCheck size={size} strokeWidth={2.5} />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span title="Sent" style={{ color: 'rgba(233, 237, 239, 0.7)', display: 'inline-flex' }}>
        <Check size={size} strokeWidth={2.5} />
      </span>
    );
  }

  // Pending / sending
  return (
    <span title="Sending..." style={{ color: 'rgba(233, 237, 239, 0.5)', display: 'inline-flex' }}>
      <Clock size={size - 2} />
    </span>
  );
};

export default MessageStatusIcon;
