
import React from 'react';

const StatsCard = ({ title, value, icon, type }) => {
    return (
        <div className="stat-card">
            <div className="stat-info">
                <h3>{title}</h3>
                <p className="stat-value">{value}</p>
            </div>
            <div className={`stat-icon ${type}`}>
                {icon}
            </div>
        </div>
    );
};

export default StatsCard;
