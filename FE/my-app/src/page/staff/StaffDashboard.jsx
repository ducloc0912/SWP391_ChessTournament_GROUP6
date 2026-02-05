import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainHeader from '../../component/common/MainHeader';
import StaffTournament from './StaffTournament';
import StaffBlog from './StaffBlog';
import { Trophy, FileText } from 'lucide-react';
import '../../assets/css/StaffDashboard.css';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState('tournaments');
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
                    <p className="staff-page-subtitle">Quản lý giải đấu và bài viết cho hệ thống</p>
                </div>

                {/* Tab Navigation */}
                <div className="staff-tab-nav">
                    <button 
                        className={`staff-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tournaments')}
                    >
                        <Trophy size={18} />
                        Quản lý giải đấu
                    </button>
                    <button 
                        className={`staff-tab-btn ${activeTab === 'blog' ? 'active' : ''}`}
                        onClick={() => setActiveTab('blog')}
                    >
                        <FileText size={18} />
                        Quản lý bài viết
                    </button>
                </div>

                {/* Content Area */}
                <div className="staff-content-area">
                    {activeTab === 'tournaments' 
                        ? <StaffTournament currentUser={currentUser} /> 
                        : <StaffBlog currentUser={currentUser} />
                    }
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
