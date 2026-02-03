import React from 'react';
import { Trophy, Medal, ChevronRight, Filter } from 'lucide-react';


const TournamentList = ({ tournaments, role }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy style={{ width: '1.25rem', height: '1.25rem', color: '#eab308' }} />;
    if (rank === 2) return <Medal style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />;
    if (rank === 3) return <Medal style={{ width: '1.25rem', height: '1.25rem', color: '#f97316' }} />;
    return <Medal style={{ width: '1.25rem', height: '1.25rem', color: '#c7d2fe' }} />;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return "rank-tag rank-1";
    if (rank === 2) return "rank-tag rank-2";
    if (rank === 3) return "rank-tag rank-3";
    return "rank-tag rank-other";
  };

  return (
    <div className="card tournament-list-container">
      <div className="list-header">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Match History</h2>
          <p className="text-xs" style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>List of tournaments participated</p>
        </div>
        
        <div className="list-header-cols">
          {/* Rank Column: Player Only */}
          {role === ROLES.PLAYER && <div style={{ width: '6rem', textAlign: 'center' }}>Rank</div>}
          
          {/* Date Column: Player & Leader (Referee excluded) */}
          {role !== ROLES.REFEREE && <div style={{ width: '6rem', textAlign: 'right' }}>Date</div>}
        </div>

        <button className="filter-btn md-hidden" style={{ padding: '0.5rem' }}>
          <Filter style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>
      </div>

      <div className="scroll-area">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-item">
            <div className="item-info">
              {/* Rank Icon: Player Only */}
              {role === ROLES.PLAYER ? (
                <div className={`rank-circle ${tournament.rank === 1 ? 'top-1' : 'default'}`}>
                  {getRankIcon(tournament.rank)}
                </div>
              ) : (
                // Generic Icon for others
                <div className="rank-circle default">
                   <Trophy style={{ width: '1.25rem', height: '1.25rem', color: '#94a3b8' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="item-name">{tournament.name}</span>
                <span className="item-meta-mobile">
                  {role !== ROLES.REFEREE && tournament.date}
                  {role === ROLES.PLAYER && ` • Rank #${tournament.rank}`}
                </span>
              </div>
            </div>

            <div className="item-meta-desktop">
              {/* Rank Tag: Player Only */}
              {role === ROLES.PLAYER && (
                <div className={getRankClass(tournament.rank)}>
                  Rank {tournament.rank}
                </div>
              )}
              
              {/* Date Text: Player & Leader */}
              {role !== ROLES.REFEREE && (
                <div className="date-text">
                  {tournament.date}
                </div>
              )}
              
              <ChevronRight style={{ width: '1rem', height: '1rem', color: '#d1d5db' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="list-footer">
        <button className="view-all-btn">
          View all match history &rarr;
        </button>
      </div>
    </div>
  );
};

export default TournamentList;