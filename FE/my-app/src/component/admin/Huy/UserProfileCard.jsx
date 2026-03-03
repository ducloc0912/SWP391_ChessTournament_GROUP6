import React from 'react';
import { resolveAssetUrl } from '../../../config/api';

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const UserProfileCard = ({ user }) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || '—';
  const avatarUrl = resolveAssetUrl(user?.avatar);
  const username = user?.username || user?.email || '—';

  return (
    <div className="erUserCard">
      <div className="erUserCardBanner" />
      <div className="erUserCardAvatarWrap">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="erUserCardAvatar"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextElementSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="erUserCardAvatar"
          style={{ display: avatarUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#64748b' }}
        >
          {(fullName || 'U').slice(0, 1).toUpperCase()}
        </div>
      </div>
      <h2 className="erUserCardName">{fullName}</h2>
      <p className="erUserCardMeta">@{username}</p>

      <div className="erUserCardRow">
        <span className="erUserCardRowLabel">User ID</span>
        <span className="erUserCardRowValue">{user?.userId ?? user?.id ?? '—'}</span>
      </div>
      <div className="erUserCardRow">
        <span className="erUserCardRowLabel">Ngày sinh</span>
        <span className="erUserCardRowValue">{formatDate(user?.birthday ?? user?.birthDate)}</span>
      </div>
      <div className="erUserCardRow">
        <span className="erUserCardRowLabel">Vai trò</span>
        <span className="erUserCardRowValue">{user?.roleName ?? user?.role ?? '—'}</span>
      </div>
    </div>
  );
};

export default UserProfileCard;
