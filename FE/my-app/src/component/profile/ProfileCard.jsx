import React, { useState } from 'react';
import { MapPin, Mail, Calendar, Wallet, Edit2, Save, X } from 'lucide-react';


const ProfileCard = ({ user, role }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    birthday: user.birthday,
    address: user.address,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving data:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      address: user.address,
    });
    setIsEditing(false);
  };

  const InputField = ({ name, value, icon: Icon }) => (
    <div className="detail-row" style={{ width: '100%' }}>
      <Icon />
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '0.25rem 0.5rem',
          border: '1px solid #e2e8f0',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          color: 'var(--text-main)',
          outline: 'none'
        }}
      />
    </div>
  );

  return (
    <div className="card profile-card">
      <div className="profile-bg-decor"></div>
      
      <div className="pro-badge">
        {role === ROLES.PLAYER ? 'PRO PLAYER' : role === ROLES.LEADER ? 'TOURNAMENT LEADER' : 'REFEREE'}
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button onClick={handleSave} style={{ border: 'none', background: '#22c55e', color: 'white', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <Save size={14} />
             </button>
             <button onClick={handleCancel} style={{ border: 'none', background: '#ef4444', color: 'white', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <X size={14} />
             </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ border: 'none', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Edit2 size={14} color="#4f46e5" />
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="avatar-wrapper">
          <img src={user.avatarUrl} alt={user.name} className="avatar-img" />
        </div>
        
        {isEditing ? (
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange}
            style={{ marginTop: '1rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '0.25rem', padding: '0.25rem', width: '80%', fontSize: '1.25rem' }} 
          />
        ) : (
          <h2 className="text-xl font-bold" style={{ marginTop: '1rem', color: 'var(--text-main)' }}>{formData.name}</h2>
        )}
        
        <p className="profile-id">{user.id}</p>
        
        <div className="profile-details">
          {isEditing ? (
            <>
              <InputField name="email" value={formData.email} icon={Mail} />
              <InputField name="birthday" value={formData.birthday} icon={Calendar} />
              <InputField name="address" value={formData.address} icon={MapPin} />
            </>
          ) : (
            <>
              <div className="detail-row">
                <Mail />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="detail-row">
                <Calendar />
                <span>Birthday: {formData.birthday}</span>
              </div>
              <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                <MapPin style={{ marginTop: '0.25rem' }} />
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{formData.address}</span>
              </div>
            </>
          )}

          {/* Visibility Rule: Wallet is Player Only */}
          {role === ROLES.PLAYER && (
            <div className="detail-row">
              <Wallet style={{ color: 'var(--secondary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.walletBalance)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-box blue">
          <span className="stat-label">Total Joined</span>
          <span className="stat-value">{user.stats.totalEvents}</span>
          <span className="stat-sub">Events</span>
        </div>
        
        {/* Visibility Rule: Avg Rank is Player Only */}
        {role === ROLES.PLAYER && (
          <div className="stat-box orange">
            <span className="stat-label">Avg Rank</span>
            <span className="stat-value">#{user.stats.averageRank}</span>
            <span className="stat-sub">Top Player</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;