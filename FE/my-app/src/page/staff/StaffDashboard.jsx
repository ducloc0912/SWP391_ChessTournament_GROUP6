import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainHeader from '../../component/common/MainHeader';
import StaffTournament from './StaffTournament';
import { Trophy } from 'lucide-react';
import '../../assets/css/StaffDashboard.css';

const StaffDashboard = () => {
    const [activeTab] = useState('tournaments');
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy thông tin user từ localStorage
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/home');
    };

    return (
        <div className="staff-page">
            {/* Header chung */}
            <MainHeader 
                user={currentUser} 
                onLogout={handleLogout} 
                currentPath={location.pathname} 
            />

            {/* Main Content */}
            <div className="staff-main-wrapper">
                {/* Page Header */}
                <div className="staff-page-header">
                    <h1 className="staff-page-title">Staff Dashboard</h1>
                    <p className="staff-page-subtitle">Quản lý giải đấu cho hệ thống</p>
                </div>

                {/* Content Area */}
                <div className="staff-content-area">
                    <StaffTournament currentUser={currentUser} />
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
