import React, { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
      '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
    ],
  },
  {
    name: 'Gestures & People',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '👂', '👃', '👀', '👁️', '🧠', '🫀',
    ],
  },
  {
    name: 'Hearts & Emotions',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💤', '💢', '💣', '💥', '💫', '💨', '🔥', '✨',
    ],
  },
  {
    name: 'Objects & Fun',
    emojis: [
      '🎉', '🎊', '🎁', '🎂', '🎈', '🍾', '🥂', '🍻', '☕', '🍕',
      '🍔', '🍟', '🌮', '🍣', '🍦', '🍩', '🍫', '🍿', '🚀', '✈️',
      '🚗', '🚲', '⚡', '💡', '📱', '💻', '📷', '🎧', '🎮', '🏆',
    ],
  },
];

export const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');

  const filteredEmojis = searchTerm.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES.find((c) => c.name === activeCategory)?.emojis || [];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '65px',
        left: '16px',
        width: '320px',
        height: '350px',
        backgroundColor: 'var(--bg-modal)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Search Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-header)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Search size={16} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            width: '100%',
          }}
        />
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-header)',
          }}
        >
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                background: 'transparent',
                color:
                  activeCategory === cat.name
                    ? 'var(--accent-green)'
                    : 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom:
                  activeCategory === cat.name
                    ? '2px solid var(--accent-green)'
                    : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '4px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
