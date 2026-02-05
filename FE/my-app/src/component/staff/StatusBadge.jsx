import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'pending': return 'status-pending';
            case 'ongoing': return 'status-ongoing';
            case 'active': return 'status-active';
            case 'rejected': return 'status-rejected';
            case 'published': return 'status-published';
            case 'public': return 'status-public';
            case 'draft': return 'status-draft';
            case 'private': return 'status-private';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'delayed': return 'status-delayed';
            // Format types
            case 'hybrid': return 'status-strategy';
            case 'roundrobin': return 'status-strategy';
            case 'knockout': return 'status-strategy';
            // Categories
            case 'strategy': return 'status-strategy';
            case 'news': return 'status-news';
            case 'guide': return 'status-guide';
            case 'guides': return 'status-guides';
            default: return 'status-draft';
        }
    };

    const getStatusLabel = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'pending': return 'Chờ duyệt';
            case 'ongoing': return 'Đang diễn ra';
            case 'active': return 'Hoạt động';
            case 'rejected': return 'Bị từ chối';
            case 'published': return 'Đã đăng';
            case 'public': return 'Công khai';
            case 'draft': return 'Bản nháp';
            case 'private': return 'Riêng tư';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            case 'delayed': return 'Tạm hoãn';
            // Format types
            case 'hybrid': return 'Hỗn hợp';
            case 'roundrobin': return 'Vòng tròn';
            case 'knockout': return 'Loại trực tiếp';
            // Categories
            case 'strategy': return 'Chiến thuật';
            case 'news': return 'Tin tức';
            case 'guide': return 'Hướng dẫn';
            case 'guides': return 'Hướng dẫn';
            default: return status || 'N/A';
        }
    };

    return (
        <span className={`status-badge ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
        </span>
    );
};

export default StatusBadge;
