import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { userService } from '../../services/userService.js';
import { uploadService } from '../../services/uploadService.js';
import Avatar from '../common/Avatar.jsx';
import { ArrowLeft, Camera, Check, Edit2, Key, Loader2 } from 'lucide-react';

export const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, updateUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [about, setAbout] = useState(user?.about || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (field) => {
    try {
      setIsSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const updated = await userService.updateProfile({
        fullName,
        about,
        phone,
      });

      updateUser(updated);
      setSuccessMsg('Profile updated successfully');
      if (field === 'name') setIsEditingName(false);
      if (field === 'about') setIsEditingAbout(false);
      if (field === 'phone') setIsEditingPhone(false);
    } catch (err) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      setErrorMsg('');
      const uploaded = await uploadService.uploadFile(file);
      const updated = await userService.updateProfile({ avatar: uploaded.fileUrl });
      updateUser(updated);
      setSuccessMsg('Avatar updated successfully');
    } catch (err) {
      setErrorMsg(err.message || 'Error updating avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMsg('');
      await userService.changePassword(currentPassword, newPassword);
      setSuccessMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
    } catch (err) {
      setErrorMsg(err.message || 'Error changing password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="drawer-panel">
      {/* Header */}
      <div className="drawer-header">
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          style={{ color: '#ffffff' }}
          title="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="drawer-title">Profile</span>
      </div>

      {/* Body */}
      <div className="drawer-body">
        {/* Alerts */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(234, 67, 53, 0.15)',
              color: 'var(--danger)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(0, 168, 132, 0.15)',
              color: 'var(--accent-green)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Profile Picture Center */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
          <div style={{ position: 'relative' }}>
            <Avatar src={user.avatar} name={user.fullName} size="xxl" />
            <label
              htmlFor="profile-pic-upload"
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-green)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
              }}
              title="Change profile picture"
            >
              <Camera size={18} />
            </label>
            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Full Name */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>Your Name</label>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '6px 10px' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <button
                type="button"
                className="btn-send"
                style={{ width: '32px', height: '32px' }}
                onClick={() => handleSaveProfile('name')}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 500 }}>{user.fullName}</span>
              <button
                type="button"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* About */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>About</label>
          {isEditingAbout ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '6px 10px' }}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={150}
              />
              <button
                type="button"
                className="btn-send"
                style={{ width: '32px', height: '32px' }}
                onClick={() => handleSaveProfile('about')}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user.about}</span>
              <button
                type="button"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setIsEditingAbout(true)}
              >
                <Edit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Username */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>Username</label>
          <div style={{ marginTop: '4px', fontSize: '14.5px', color: 'var(--text-primary)' }}>
            @{user.username}
          </div>
        </div>

        {/* Email */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>Email</label>
          <div style={{ marginTop: '4px', fontSize: '14.5px', color: 'var(--text-primary)' }}>
            {user.email}
          </div>
        </div>

        {/* Phone */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
          <label className="form-label" style={{ fontSize: '12px' }}>Phone Number (Optional)</label>
          {isEditingPhone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '6px 10px' }}
                value={phone}
                placeholder="+1234567890"
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="button"
                className="btn-send"
                style={{ width: '32px', height: '32px' }}
                onClick={() => handleSaveProfile('phone')}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '14.5px', color: user.phone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {user.phone || 'Not specified'}
              </span>
              <button
                type="button"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setIsEditingPhone(true)}
              >
                <Edit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Change Password Trigger */}
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setShowPasswordChange(!showPasswordChange)}
          >
            <Key size={16} /> Change Password
          </button>

          {showPasswordChange && (
            <form onSubmit={handleChangePassword} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="Current Password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* Member since date */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Member since {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
