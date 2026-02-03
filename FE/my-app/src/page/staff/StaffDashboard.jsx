
import React, { useState } from 'react';
import '../../assets/css/StaffDashboard.css';
import StaffTournament from './StaffTournament';
import StaffBlog from './StaffBlog';

import {
    Trophy,
    FileText,
    LogOut,
    Search,
    Bell,
    User
} from 'lucide-react';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState('tournaments');

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-logo">
                        <Trophy size={24} color="white" />
                    </div>
                    <span>Staff Dashboard</span>
                </div>
                <nav className="nav-menu">
                    <div
                        className={`nav-item ${activeTab === 'tournaments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tournaments')}
                        role="button"
                    >
                        <Trophy size={20} />
                        <span>Giải đấu</span>
                    </div>
                    <div
                        className={`nav-item ${activeTab === 'blog' ? 'active' : ''}`}
                        onClick={() => setActiveTab('blog')}
                        role="button"
                    >
                        <FileText size={20} />
                        <span>Bài viết của tôi</span>
                    </div>
                </nav>
                <div className="nav-footer">
                    <div className="nav-item" role="button">
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <div className="page-title">
                        <h1>{activeTab === 'tournaments' ? 'Tổng quan giải đấu' : 'Quản lý bài viết'}</h1>
                        <p>{activeTab === 'tournaments'
                            ? 'Quản lý và phê duyệt các giải đấu cờ vua do ban tổ chức gửi.'
                            : 'Xem xét, xuất bản và quản lý các bài đăng trên blog cộng đồng.'}</p>
                    </div>
                    <div className="user-profile">
                        <div className="icon-btn"><Search size={20} /></div>
                        <div className="icon-btn"><Bell size={20} /></div>
                        <div className="avatar">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                {activeTab === 'tournaments' ? <StaffTournament /> : <StaffBlog />}
            </main >
        </div >
    );
};

export default StaffDashboard;
