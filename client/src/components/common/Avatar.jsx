import React from 'react';

const COLORS = [
  '#00a884', '#128c7e', '#25d366', '#34b7f1',
  '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c',
];

const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getBgColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

const SIZES = {
  xs: { size: 24, fontSize: 11 },
  sm: { size: 34, fontSize: 13 },
  md: { size: 44, fontSize: 16 },
  lg: { size: 54, fontSize: 19 },
  xl: { size: 76, fontSize: 26 },
  xxl: { size: 110, fontSize: 38 },
};

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showOnlineBadge = false,
  onClick,
}) => {
  const { size: dim, fontSize } = SIZES[size] || SIZES.md;
  const initials = getInitials(name);
  const bgColor = getBgColor(name);

  return (
    <div
      onClick={onClick}
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: bgColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          {initials}
        </div>
      )}

      {showOnlineBadge && isOnline && (
        <span
          className="presence-dot"
          title="Online"
          style={{
            width: dim > 44 ? '13px' : '10px',
            height: dim > 44 ? '13px' : '10px',
          }}
        />
      )}
    </div>
  );
};

export default Avatar;
