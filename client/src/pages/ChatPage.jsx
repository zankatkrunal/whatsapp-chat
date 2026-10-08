import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import Sidebar from '../components/sidebar/Sidebar.jsx';
import ChatArea from '../components/chat/ChatArea.jsx';
import ProfileDrawer from '../components/profile/ProfileDrawer.jsx';
import SettingsDrawer from '../components/settings/SettingsDrawer.jsx';
import GroupInfoDrawer from '../components/group/GroupInfoDrawer.jsx';
import BlockedUsersModal from '../components/settings/BlockedUsersModal.jsx';
import { blockService } from '../services/blockService.js';

export const ChatPage = () => {
  const { activeConversation, selectConversation } = useChat();

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showGroupInfoDrawer, setShowGroupInfoDrawer] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Request browser notification permission once on initial mount (Requirement 16)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const handleOpenInfo = () => {
    if (activeConversation?.isGroup) {
      setShowGroupInfoDrawer(true);
    } else {
      setShowProfileDrawer(true);
    }
  };

  const handleBlockUser = async () => {
    if (!activeConversation || activeConversation.isGroup) return;
    const otherParticipant = activeConversation.participants?.find((p) => p._id);
    if (!otherParticipant) return;

    if (window.confirm(`Block ${otherParticipant.fullName}? You will no longer receive messages from this contact.`)) {
      try {
        await blockService.blockUser(otherParticipant._id);
        alert(`${otherParticipant.fullName} has been blocked.`);
        selectConversation(null);
      } catch (err) {
        alert(err.message || 'Error blocking user');
      }
    }
  };

  return (
    <div className="app-container">
      <div className="main-layout">
        {/* Left Sidebar */}
        <Sidebar
          onOpenProfile={() => setShowProfileDrawer(true)}
          onOpenSettings={() => setShowSettingsDrawer(true)}
          onSelectChatMobile={() => {
            // Handled automatically through CSS responsive classes
          }}
        />

        {/* Right Chat Area */}
        <ChatArea
          onBackClick={() => selectConversation(null)}
          onOpenInfo={handleOpenInfo}
          onOpenBlock={handleBlockUser}
        />

        {/* Drawers / Panels */}
        <ProfileDrawer
          isOpen={showProfileDrawer}
          onClose={() => setShowProfileDrawer(false)}
        />

        <SettingsDrawer
          isOpen={showSettingsDrawer}
          onClose={() => setShowSettingsDrawer(false)}
          onOpenProfile={() => {
            setShowSettingsDrawer(false);
            setShowProfileDrawer(true);
          }}
        />

        <GroupInfoDrawer
          isOpen={showGroupInfoDrawer}
          onClose={() => setShowGroupInfoDrawer(false)}
        />
      </div>
    </div>
  );
};

export default ChatPage;
