import React from 'react';
import { Trophy, User, Wallet } from 'lucide-react';
const StatCards = ({ user, role }) => {
  const levelPercentage = (user.level.currentXp / user.level.requiredXp) * 100;

  // Rule: Only Players have Level, Wallet, and Championship stats shown here.
  // Leaders/Referees only see "Total Tournaments" which is in ProfileCard.
  if (role !== ROLES.PLAYER) {
    return null;
  }

  return (
    <>
      {/* Championships */}
      <div className="card stat-card-row">
        <div className="icon-box green">
          <Trophy style={{ width: '1.5rem', height: '1.5rem' }} />
        </div>
        <div className="stat-card-content">
          <p className="text-xs" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Championships</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
             <h3 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{String(user.stats.championships).padStart(2, '0')}</h3>
             <span style={{ fontSize: '0.625rem', color: 'var(--success)', fontWeight: 500 }}>+1 this month</span>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="icon-box indigo" style={{ width: '2.5rem', height: '2.5rem' }}>
            <User style={{ width: '1.25rem', height: '1.25rem' }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Player Level</p>
            <h3 className="text-lg font-bold" style={{ color: '#312e81' }}>{user.level.current}</h3>
          </div>
        </div>
        <div className="progress-track">
          <div 
            className="progress-bar" 
            style={{ width: `${levelPercentage}%` }}
          ></div>
        </div>
        <p className="text-right" style={{ fontSize: '0.625rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
          {user.level.currentXp} / {user.level.requiredXp} EXP
        </p>
      </div>

      {/* Wallet */}
      <div className="card stat-card-row">
        <div className="icon-box orange">
           <Wallet style={{ width: '1.5rem', height: '1.5rem' }} />
        </div>
        <div className="stat-card-content">
           <p className="text-xs" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Wallet Balance</p>
           <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
             {new Intl.NumberFormat('vi-VN').format(user.walletBalance)}
           </h3>
           <p style={{ fontSize: '0.625rem', color: 'var(--success)', fontWeight: 500 }}>Available</p>
        </div>
      </div>
    </>
  );
};

export default StatCards;