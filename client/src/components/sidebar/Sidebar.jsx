import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import SidebarHeader from './SidebarHeader.jsx';
import SearchBar from './SearchBar.jsx';
import ConversationList from './ConversationList.jsx';
import NewChatModal from './NewChatModal.jsx';
import CreateGroupModal from './CreateGroupModal.jsx';
import { MessageSquarePlus } from 'lucide-react';

export const Sidebar = ({
  onOpenProfile,
  onOpenSettings,
  onSelectChatMobile,
}) => {
  const { activeConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  return (
    <div className={`sidebar ${activeConversation ? 'has-active-chat' : ''}`}>
      {/* Sidebar Header */}
      <SidebarHeader
        onOpenProfile={onOpenProfile}
        onOpenNewChat={() => setShowNewChatModal(true)}
        onOpenCreateGroup={() => setShowCreateGroupModal(true)}
        onOpenSettings={onOpenSettings}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Conversation List with integrated user search & start chat */}
      <ConversationList
        searchQuery={searchQuery}
        onSelectConversation={onSelectChatMobile}
        onOpenNewChat={() => setShowNewChatModal(true)}
      />

      {/* Floating WhatsApp-Style New Chat Button */}
      <button
        type="button"
        className="fab-new-chat"
        onClick={() => setShowNewChatModal(true)}
        title="Start New Chat"
      >
        <MessageSquarePlus size={24} />
      </button>

      {/* New Direct Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </div>
  );
};

export default Sidebar;
