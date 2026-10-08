import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { groupService } from '../../services/groupService.js';
import { userService } from '../../services/userService.js';
import Avatar from '../common/Avatar.jsx';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Loader2,
} from 'lucide-react';

export const GroupInfoDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { activeConversation, refreshConversations, selectConversation } = useChat();

  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCandidates, setSearchCandidates] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isGroup = activeConversation?.isGroup;
  const groupId = activeConversation?.group;

  useEffect(() => {
    if (!isOpen || !isGroup || !groupId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await groupService.getGroupDetails(groupId);
        setGroupDetails(data);
        setDescription(data.description || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, isGroup, groupId]);

  // Search new members to add
  useEffect(() => {
    if (!showAddMembers) {
      setSearchCandidates([]);
      setSearchTerm('');
      return;
    }

    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 1) {
        try {
          const results = await userService.searchUsers(searchTerm.trim());
          // Filter out existing members
          const currentMemberIds = groupDetails?.members?.map((m) => m._id) || [];
          const eligible = results.filter((u) => !currentMemberIds.includes(u._id));
          setSearchCandidates(eligible);
        } catch (e) {
          console.error(e);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, showAddMembers, groupDetails]);

  if (!isOpen || !activeConversation || !isGroup) return null;

  const isAdmin = groupDetails?.admins?.some(
    (a) => (typeof a === 'object' ? a._id : a).toString() === user._id.toString()
  );

  const handleSaveDescription = async () => {
    try {
      setIsActionLoading(true);
      const updated = await groupService.updateGroup(groupId, { description });
      setGroupDetails(updated);
      setIsEditingDesc(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setIsActionLoading(true);
      await groupService.addMembers(groupId, [userId]);
      const data = await groupService.getGroupDetails(groupId);
      setGroupDetails(data);
      setShowAddMembers(false);
      await refreshConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setIsActionLoading(true);
      await groupService.removeMember(groupId, memberId);
      const data = await groupService.getGroupDetails(groupId);
      setGroupDetails(data);
      await refreshConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      setIsActionLoading(true);
      await groupService.leaveGroup(groupId);
      await refreshConversations();
      selectConversation(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
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
        <span className="drawer-title">Group Info</span>
      </div>

      {/* Body */}
      <div className="drawer-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="spin" color="var(--accent-green)" />
          </div>
        ) : (
          <>
            {/* Group Avatar and Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Avatar
                src={groupDetails?.avatar || activeConversation.groupAvatar}
                name={groupDetails?.name || activeConversation.groupName}
                size="xxl"
              />
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                {groupDetails?.name || activeConversation.groupName}
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Group · {groupDetails?.members?.length || 0} participants
              </span>
            </div>

            {/* Description */}
            <div style={{ backgroundColor: 'var(--bg-panel-secondary)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-label" style={{ fontSize: '12px' }}>Description</span>
                {isAdmin && !isEditingDesc && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => setIsEditingDesc(true)}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', resize: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => setIsEditingDesc(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={handleSaveDescription}
                      disabled={isActionLoading}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {groupDetails?.description || 'No description provided.'}
                </p>
              )}
            </div>

            {/* Add Participant Trigger (Admins only) */}
            {isAdmin && (
              <div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderColor: 'var(--accent-green)',
                    color: 'var(--accent-green)',
                  }}
                  onClick={() => setShowAddMembers(!showAddMembers)}
                >
                  <UserPlus size={16} /> Add Member
                </button>

                {showAddMembers && (
                  <div style={{ marginTop: '10px', backgroundColor: 'var(--bg-panel-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search users to add..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ marginBottom: '8px', width: '100%' }}
                    />
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {searchCandidates.map((c) => (
                        <div
                          key={c._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar src={c.avatar} name={c.fullName} size="xs" />
                            <span style={{ fontSize: '13px' }}>{c.fullName}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleAddMember(c._id)}
                            disabled={isActionLoading}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="form-label" style={{ fontSize: '13px' }}>
                Participants ({groupDetails?.members?.length || 0})
              </span>

              {groupDetails?.members?.map((m) => {
                const memberIsAdmin = groupDetails?.admins?.some(
                  (a) => (typeof a === 'object' ? a._id : a).toString() === m._id.toString()
                );
                const isMe = m._id.toString() === user._id.toString();

                return (
                  <div
                    key={m._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-panel-secondary)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Avatar src={m.avatar} name={m.fullName} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>
                          {isMe ? 'You' : m.fullName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {m.about || 'Available'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {memberIsAdmin && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--accent-green)',
                            border: '1px solid var(--accent-green)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Group Admin
                        </span>
                      )}

                      {isAdmin && !isMe && (
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: '26px', height: '26px', color: 'var(--danger)' }}
                          onClick={() => handleRemoveMember(m._id)}
                          title="Remove from group"
                          disabled={isActionLoading}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave Group Action */}
            <div style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--danger)',
                  borderColor: 'rgba(234, 67, 53, 0.3)',
                }}
                onClick={handleLeaveGroup}
                disabled={isActionLoading}
              >
                <LogOut size={16} /> Exit Group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupInfoDrawer;
