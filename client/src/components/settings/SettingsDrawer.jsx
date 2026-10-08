import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { userService } from '../../services/userService.js';
import BlockedUsersModal from './BlockedUsersModal.jsx';
import {
  ArrowLeft,
  Moon,
  Sun,
  Shield,
  Bell,
  MessageSquare,
  UserX,
  LogOut,
  Monitor,
} from 'lucide-react';

export const SettingsDrawer = ({ isOpen, onClose, onOpenProfile }) => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [enterIsSend, setEnterIsSend] = useState(user?.settings?.enterIsSend !== false);
  const [notificationSound, setNotificationSound] = useState(user?.settings?.notificationSound !== false);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(user?.privacy?.lastSeen || 'everyone');

  if (!isOpen || !user) return null;

  const handleToggleEnter = async () => {
    const newVal = !enterIsSend;
    setEnterIsSend(newVal);
    try {
      const updatedSettings = await userService.updateSettings({ enterIsSend: newVal });
      updateUser({ settings: updatedSettings });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSound = async () => {
    const newVal = !notificationSound;
    setNotificationSound(newVal);
    try {
      const updatedSettings = await userService.updateSettings({ notificationSound: newVal });
      updateUser({ settings: updatedSettings });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLastSeenChange = async (e) => {
    const val = e.target.value;
    setLastSeenPrivacy(val);
    try {
      const updatedPrivacy = await userService.updatePrivacy({ lastSeen: val });
      updateUser({ privacy: updatedPrivacy });
    } catch (err) {
      console.error(err);
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
        <span className="drawer-title">Settings</span>
      </div>

      {/* Body */}
      <div className="drawer-body">
        {/* Appearance / Theme */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {theme === 'dark' ? <Moon size={20} color="var(--accent-green)" /> : <Sun size={20} color="var(--accent-green)" />}
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Theme</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`filter-tab ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              style={{ flex: 1, padding: '8px' }}
            >
              Dark
            </button>
            <button
              type="button"
              className={`filter-tab ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              style={{ flex: 1, padding: '8px' }}
            >
              Light
            </button>
            <button
              type="button"
              className={`filter-tab ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
              style={{ flex: 1, padding: '8px' }}
            >
              System
            </button>
          </div>
        </div>

        {/* Chat Settings */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <MessageSquare size={20} color="var(--accent-green)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Chats</span>
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Enter is send</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Pressing Enter will send your message
              </div>
            </div>
            <input
              type="checkbox"
              checked={enterIsSend}
              onChange={handleToggleEnter}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
            />
          </label>
        </div>

        {/* Notifications */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Bell size={20} color="var(--accent-green)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Notifications</span>
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Message audio sound</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Play sounds for incoming messages
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSound}
              onChange={handleToggleSound}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
            />
          </label>
        </div>

        {/* Privacy */}
        <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Shield size={20} color="var(--accent-green)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Privacy</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Who can see my last seen</div>
            <select
              value={lastSeenPrivacy}
              onChange={handleLastSeenChange}
              className="form-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>

        {/* Blocked Users */}
        <div
          onClick={() => setShowBlockedModal(true)}
          style={{
            backgroundColor: 'var(--bg-panel-secondary)',
            padding: '16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserX size={20} color="var(--danger)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Blocked contacts</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage</span>
        </div>

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--danger)',
              borderColor: 'rgba(234, 67, 53, 0.3)',
            }}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>

      {/* Blocked Users Modal */}
      <BlockedUsersModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
      />
    </div>
  );
};

export default SettingsDrawer;
