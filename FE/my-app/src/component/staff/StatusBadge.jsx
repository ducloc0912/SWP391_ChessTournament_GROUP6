import React from 'react';

const STATUS_CLASS_MAP = {
    pending: 'status-pending',
    upcoming: 'status-upcoming',
    ongoing: 'status-ongoing',
    active: 'status-active',
    approved: 'status-approved',
    rejected: 'status-rejected',
    published: 'status-published',
    public: 'status-public',
    draft: 'status-draft',
    private: 'status-private',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    delayed: 'status-delayed',
    hybrid: 'status-strategy',
    roundrobin: 'status-strategy',
    knockout: 'status-strategy',
    strategy: 'status-strategy',
    news: 'status-news',
    guide: 'status-guide',
    guides: 'status-guides',
};

const STATUS_LABEL_MAP = {
    pending: 'Cho duyet',
    upcoming: 'Sap dien ra',
    ongoing: 'Dang dien ra',
    active: 'Hoat dong',
    approved: 'Approved',
    rejected: 'Bi tu choi',
    published: 'Da dang',
    public: 'Cong khai',
    draft: 'Ban nhap',
    private: 'Rieng tu',
    completed: 'Hoan thanh',
    cancelled: 'Da huy',
    delayed: 'Tam hoan',
    hybrid: 'Hon hop',
    roundrobin: 'Vong tron',
    knockout: 'Loai truc tiep',
    strategy: 'Chien thuat',
    news: 'Tin tuc',
    guide: 'Huong dan',
    guides: 'Huong dan',
};

const StatusBadge = ({ status }) => {
    const normalizedStatus = String(status || '').toLowerCase();

    return (
        <span className={`status-badge ${STATUS_CLASS_MAP[normalizedStatus] || 'status-draft'}`}>
            {STATUS_LABEL_MAP[normalizedStatus] || status || 'N/A'}
        </span>
    );
};

export default StatusBadge;
