import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import Avatar from '../common/Avatar.jsx';
import {
  MessageSquarePlus,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const SidebarHeader = ({
  onOpenProfile,
  onOpenNewChat,
  onOpenCreateGroup,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isConnected, connectionStatus } = useSocket();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="sidebar-header">
      {/* Current user avatar and info */}
      <div
        className="sidebar-header-user"
        onClick={onOpenProfile}
        title="View Profile"
      >
        <Avatar
          src={user?.avatar}
          name={user?.fullName || 'Me'}
          size="sm"
          isOnline={true}
          showOnlineBadge={true}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.fullName || 'My Profile'}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: isConnected ? 'var(--accent-green)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Header action buttons */}
      <div className="sidebar-header-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenNewChat}
          title="New direct chat"
        >
          <MessageSquarePlus size={20} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenCreateGroup}
          title="Create new group"
        >
          <Users size={20} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={logout}
          title="Log out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
