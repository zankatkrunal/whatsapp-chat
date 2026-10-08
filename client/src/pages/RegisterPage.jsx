import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MessageSquare, Lock, User, Mail, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
];

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    avatar: AVATAR_PRESETS[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectAvatar = (avatarUrl) => {
    setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        avatar: formData.avatar.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
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

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">
          Join ChatConnect and start chatting instantly with anyone!
        </p>

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

        <form onSubmit={handleSubmit}>
          {/* Avatar Preset Selector */}
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Choose Profile Avatar
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {AVATAR_PRESETS.map((avatarUrl, idx) => {
                const isSelected = formData.avatar === avatarUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAvatar(avatarUrl)}
                    style={{
                      position: 'relative',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      padding: 0,
                      border: isSelected ? '3px solid var(--accent-green)' : '2px solid transparent',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      backgroundColor: 'var(--bg-panel-secondary)',
                    }}
                    title="Select avatar"
                  >
                    <img
                      src={avatarUrl}
                      alt="Avatar preset"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 168, 132, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                        }}
                      >
                        <Check size={18} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="form-row-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                placeholder="Your Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Mail
                size={18}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password * (min 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
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
                <Loader2 size={18} className="spin" /> Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
