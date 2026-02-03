
import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Ongoing': return 'status-ongoing';
      case 'Active': return 'status-active';
      case 'Rejected': return 'status-rejected';
      case 'Published': return 'status-published';
      case 'Draft': return 'status-draft';
      case 'Hybrid': return 'status-hybrid';
      case 'RoundRobin': return 'status-roundrobin';
      case 'KnockOut': return 'status-knockout';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ duyệt';
      case 'Ongoing': return 'Đang diễn ra';
      case 'Active': return 'Hoạt động';
      case 'Rejected': return 'Bị từ chối';
      case 'Published': return 'Đã đăng';
      case 'Draft': return 'Bản nháp';
      case 'Hybrid': return 'Hỗn hợp';
      case 'RoundRobin': return 'Vòng tròn';
      case 'KnockOut': return 'Loại trực tiếp';
      default: return status;
    }
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
