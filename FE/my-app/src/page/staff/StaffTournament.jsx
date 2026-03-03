import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/css/StaffDashboard.css';
import { API_BASE } from '../../config/api';
import StatusBadge from '../../component/staff/StatusBadge';
import StatsCard from '../../component/staff/StatsCard';

import {
    Trophy, Search, Users, AlertCircle, Filter,
    ChevronDown, ChevronUp, XCircle, Eye, RotateCcw, Save
} from 'lucide-react';

const StaffTournament = ({ currentUser }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Form States
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/staff/tournaments`, { withCredentials: true });
            setTournaments(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error(e);
            setTournaments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedTournament || !updateStatus) return alert("Vui lòng chọn trạng thái");

        // Logic mapping Status -> Approval Action
        let action = 'Approve';
        if (updateStatus === 'Rejected') action = 'Reject';
        else if (updateStatus === 'Delayed') action = 'Delay';
        else if (updateStatus === 'Cancelled') action = 'Cancel';
        else if (updateStatus === 'Completed') action = 'Complete';

        try {
            await axios.post(
                `${API_BASE}/api/staff/tournaments?action=updateStatus`,
                {
                    tournamentId: selectedTournament.tournamentId,
                    staffId: currentUser?.userId || 0,
                    status: updateStatus,
                    approvalAction: action,
                    note: updateNotes
                },
                { withCredentials: true }
            );

            alert("Cập nhật thành công!");
            setSelectedTournament(null);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Lỗi: " + (e.response?.data?.message || e.message));
        }
    };

    // Filter Logic
    const filteredData = tournaments.filter(item => {
        const name = (item.tournamentName || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getOptions = (status) => {
        if (status === 'Pending') return [
            { v: 'Ongoing', l: 'Duyệt (Approve)' }, 
            { v: 'Rejected', l: 'Từ chối (Reject)' }, 
            { v: 'Delayed', l: 'Hoãn (Delay)' }
        ];
        if (status === 'Ongoing') return [
            { v: 'Completed', l: 'Hoàn thành' }, 
            { v: 'Cancelled', l: 'Hủy (Cancel)' }, 
            { v: 'Delayed', l: 'Hoãn (Delay)' }
        ];
        if (status === 'Delayed') return [
            { v: 'Ongoing', l: 'Tiếp tục' }, 
            { v: 'Cancelled', l: 'Hủy' }
        ];
        return [];
    };

    const options = selectedTournament ? getOptions(selectedTournament.status) : [];

    const pendingCount = tournaments.filter(t => t.status === 'Pending').length;
    const ongoingCount = tournaments.filter(t => t.status === 'Ongoing').length;
    const issuesCount = tournaments.filter(t => ['Rejected', 'Cancelled', 'Delayed'].includes(t.status)).length;

    return (
        <div className="staff-container">
            {/* Stats */}
            <div className="stats-grid">
                <StatsCard title="Chờ duyệt" value={pendingCount} icon={<Users size={22} />} type="pending" />
                <StatsCard title="Đang diễn ra" value={ongoingCount} icon={<Trophy size={22} />} type="active" />
                <StatsCard title="Vấn đề" value={issuesCount} icon={<AlertCircle size={22} />} type="issues" />
            </div>

            {/* Toolbar */}
            <div className="controls-section">
                <div className="controls-top-bar">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            placeholder="Tìm giải đấu..." 
                        />
                    </div>
                    <div className="action-group">
                        <button className="reset-btn" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} title="Reset">
                            <RotateCcw size={18} />
                        </button>
                        <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={18} /> Bộ lọc {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">Tất cả</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Ongoing">Đang diễn ra</option>
                                <option value="Rejected">Đã từ chối</option>
                                <option value="Completed">Đã hoàn thành</option>
                                <option value="Cancelled">Đã hủy</option>
                                <option value="Delayed">Tạm hoãn</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Tên giải đấu</th>
                            <th>Địa điểm</th>
                            <th>Format</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px'}}>Đang tải...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#888'}}>Không có giải đấu nào</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.tournamentId}>
                                    <td>
                                        <div className="item-meta">
                                            <div className="item-icon"><Trophy size={18} /></div>
                                            <div className="item-info">
                                                <span className="item-title">{item.tournamentName}</span>
                                                <span className="item-sub">{item.categories}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.location}</td>
                                    <td><StatusBadge status={item.format} /></td>
                                    <td><StatusBadge status={item.status} /></td>
                                    <td>
                                        <button 
                                            className="view-btn" 
                                            onClick={() => { 
                                                setSelectedTournament(item); 
                                                setUpdateStatus(''); 
                                                setUpdateNotes(''); 
                                            }}
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedTournament && (
                <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedTournament.tournamentName}</h3>
                                <StatusBadge status={selectedTournament.status} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedTournament(null)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-section">
                                <div className="info-row">
                                    <p><strong>Format:</strong> {selectedTournament.format}</p>
                                    <p><strong>Địa điểm:</strong> {selectedTournament.location}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Phí tham gia:</strong> {selectedTournament.entryFee?.toLocaleString() || 0} VND</p>
                                    <p><strong>Giải thưởng:</strong> {selectedTournament.prizePool?.toLocaleString() || 0} VND</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Số người chơi:</strong> {selectedTournament.minPlayer} - {selectedTournament.maxPlayer}</p>
                                </div>
                                {selectedTournament.description && (
                                    <div className="content-preview" style={{marginTop: '15px'}}>
                                        <strong>Mô tả:</strong><br/>
                                        {selectedTournament.description}
                                    </div>
                                )}
                            </div>

                            {options.length > 0 && (
                                <div className="modal-section update-status-area" style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px'}}>
                                    <h4>Cập nhật trạng thái</h4>
                                    <div className="form-group">
                                        <select className="form-control" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                                            <option value="">-- Chọn trạng thái --</option>
                                            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <textarea 
                                            className="form-control" 
                                            placeholder="Ghi chú / Lý do..." 
                                            value={updateNotes} 
                                            onChange={e => setUpdateNotes(e.target.value)}
                                            style={{minHeight: '80px'}}
                                        />
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        style={{width: '100%'}} 
                                        onClick={handleUpdateStatus}
                                    >
                                        <Save size={18} /> Lưu thay đổi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTournament;
