import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainHeader from '../../component/common/MainHeader';
import StaffTournament from './StaffTournament';
import '../../assets/css/StaffDashboard.css';

const StaffDashboard = () => {
    const [activeTab] = useState('tournaments');
    const navigate = useNavigate();
    const location = useLocation();

    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/home');
    };

    return (
        <div className="staff-page">
            <MainHeader
                user={currentUser}
                onLogout={handleLogout}
                currentPath={location.pathname}
            />

            <div className="staff-main-wrapper">
                <div className="staff-page-hero">
                    <p className="staff-page-kicker">Staff Operations</p>
                    <div className="staff-page-header">
                        <h1 className="staff-page-title">Tournament Control Center</h1>
                        <p className="staff-page-subtitle">
                            Theo doi giai dau, tim nhanh thong tin va cap nhat trang thai
                            trong mot giao dien dong bo voi home page.
                        </p>
                    </div>
                </div>

                <div className="staff-content-area">
                    <StaffTournament currentUser={currentUser} activeTab={activeTab} />
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
