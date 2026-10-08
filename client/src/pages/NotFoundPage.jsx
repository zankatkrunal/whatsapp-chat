import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <MessageSquare size={24} />
          </div>
          <h1>ChatConnect</h1>
        </div>
        <h2 style={{ fontSize: '24px', margin: '16px 0 8px 0' }}>404 - Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Back to Messages
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
