import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MessageSquare,
  Lock,
  User,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Login Submission
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide username or email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Brand Logo */}
        <div className="auth-logo">
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(0, 168, 132, 0.4)',
            }}
          >
            <MessageSquare size={26} />
          </div>
          <h1>ChatConnect</h1>
        </div>

        <h2 className="auth-title">Welcome to ChatConnect</h2>
        <p className="auth-subtitle">
          Real-time messaging on any device. Log in with your username or email.
        </p>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(234, 67, 53, 0.15)',
              color: 'var(--danger)',
              borderRadius: '8px',
              fontSize: '13.5px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="Enter username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
              <User
                size={18}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 600,
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
