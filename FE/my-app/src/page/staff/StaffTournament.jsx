
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/css/StaffDashboard.css';
import StatusBadge from '../../component/staff/StatusBadge';
import StatsCard from '../../component/staff/StatsCard';

import {
    Trophy, Search, Users, AlertCircle, Filter,
    ChevronDown, ChevronUp, XCircle, Eye, RotateCcw
} from 'lucide-react';

const StaffTournament = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Update Status States
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');

    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [formatFilter, setFormatFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (selectedTournament) {
            setUpdateStatus('');
            setUpdateNotes('');
        }
    }, [selectedTournament]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:8080/ctms/api/staff/tournaments",
                { withCredentials: true }
            );
            setTournaments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            setTournaments([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Hàm Reset Filter ---
    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setFormatFilter('All');
        setStartDate('');
        setEndDate('');
        setSortOrder('asc');
    };

    const handleUpdateStatus = async () => {
        if (!selectedTournament) return;
        if (!updateStatus) {
            alert("Vui lòng chọn trạng thái mới.");
            return;
        }

        const requiresReason = ['Rejected', 'Delayed', 'Cancelled'].includes(updateStatus);
        if (requiresReason && !updateNotes.trim()) {
            alert("Vui lòng nhập lý do.");
            return;
        }

        try {
            await axios.post(
                `http://localhost:8080/ctms/api/staff/tournaments/${selectedTournament.tournament_id}/status`,
                { status: updateStatus, notes: updateNotes },
                { withCredentials: true }
            );
            alert("Cập nhật thành công!");
            setSelectedTournament(null);
            fetchTournaments();
        } catch (error) {
            console.error("Update failed", error);
            alert("Cập nhật thất bại.");
        }
    };

    const filteredData = tournaments.filter(item => {
        const matchesSearch = (item.tournament_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
        const matchesFormat = formatFilter === 'All' ? true : item.format === formatFilter;
        const matchesDate = startDate && endDate
            ? new Date(item.start_date) >= new Date(startDate) && new Date(item.end_date || item.start_date) <= new Date(endDate)
            : true;

        return matchesSearch && matchesStatus && matchesFormat && matchesDate;
    }).sort((a, b) => {
        const nameA = a.tournament_name || '';
        const nameB = b.tournament_name || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    const getAvailableStatuses = (currentStatus) => {
        switch (currentStatus) {
            case 'Pending':
                return [
                    { value: 'Ongoing', label: 'Approved (Duyệt)' },
                    { value: 'Delayed', label: 'Delayed (Hoãn)' },
                    { value: 'Rejected', label: 'Rejected (Từ chối)' }
                ];
            case 'Ongoing':
                return [
                    { value: 'Delayed', label: 'Delayed (Hoãn)' },
                    { value: 'Cancelled', label: 'Cancelled (Hủy)' }
                ];
            case 'Delayed':
                return [
                    { value: 'Ongoing', label: 'Approved (Tiếp tục)' },
                    { value: 'Cancelled', label: 'Cancelled (Hủy)' }
                ];
            default:
                return [];
        }
    };

    const availableOptions = selectedTournament ? getAvailableStatuses(selectedTournament.status) : [];
    const isReasonRequired = ['Rejected', 'Delayed', 'Cancelled'].includes(updateStatus);

    return (
        <div className="staff-tournament-wrapper">
            {/* Stats Cards - Cập nhật logic đếm gộp */}
            <div className="stats-grid">
                <StatsCard title="Chờ duyệt" value={tournaments.filter(t => t.status === 'Pending').length} icon={<Users size={22} />} type="pending" />
                <StatsCard title="Đang diễn ra" value={tournaments.filter(t => t.status === 'Ongoing').length} icon={<Trophy size={22} />} type="active" />
                <StatsCard 
                    title="Bị từ chối / Vấn đề" 
                    value={tournaments.filter(t => ['Rejected', 'Cancelled', 'Delayed'].includes(t.status)).length} 
                    icon={<AlertCircle size={22} />} 
                    type="issues" 
                />
            </div>

            {/* Controls & Filters */}
            <div className="controls-section">
                <div className="controls-top-bar">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm giải đấu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="action-group" style={{ display: 'flex', gap: '10px' }}>
                        {/* Nút Reset Filter */}
                        <button className="reset-filter-btn" onClick={handleResetFilters} title="Đặt lại bộ lọc">
                            <RotateCcw size={18} />
                            <span>Reset</span>
                        </button>

                        <button
                            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                            <span>Bộ lọc</span>
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <select className="sort-select" onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                            <option value="asc">Tên (A-Z)</option>
                            <option value="desc">Tên (Z-A)</option>
                        </select>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
                                <option value="All">Tất cả</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Ongoing">Đang diễn ra</option>
                                <option value="Rejected">Đã từ chối</option>
                                <option value="Cancelled">Đã hủy</option>
                                <option value="Delayed">Hoãn</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Hình thức</label>
                            <select onChange={(e) => setFormatFilter(e.target.value)} value={formatFilter}>
                                <option value="All">Tất cả</option>
                                <option value="RoundRobin">Vòng tròn (Round Robin)</option>
                                <option value="KnockOut">Loại trực tiếp (Knockout)</option>
                                <option value="Hybrid">Hỗn hợp (Hybrid)</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Từ ngày</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Đến ngày</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Danh sách - Thêm cột Hình thức */}
            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Tên giải đấu</th>
                            <th>Hình thức</th>
                            <th>Địa điểm</th>
                            <th>Trạng thái</th>
                            <th>Ngày bắt đầu</th>
                            <th>Số lượng</th>
                            <th style={{ width: '80px' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => (
                            <tr key={item.tournament_id}>
                                <td>
                                    <div className="item-meta">
                                        <div className="item-icon"><Trophy size={18} /></div>
                                        <div className="item-info">
                                            <span className="item-title">{item.tournament_name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-muted">{item.format}</td>
                                <td>{item.location}</td>
                                <td><StatusBadge status={item.status} /></td>
                                <td>{new Date(item.start_date).toLocaleDateString()}</td>
                                <td>
                                    <span className="player-count">
                                        <Users size={14} /> {item.registered_players || 0}/{item.max_player}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="view-btn" title="Xem chi tiết" onClick={() => setSelectedTournament(item)}>
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tournament Modal */}
            {selectedTournament && (
                <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{selectedTournament.tournament_name}</h2>
                                <StatusBadge status={selectedTournament.status} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedTournament(null)}><XCircle size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="modal-section">
                                <h3>Thông tin chung</h3>
                                <p><strong>Định dạng:</strong> {selectedTournament.format}</p>
                                <p><strong>Địa điểm:</strong> {selectedTournament.location}</p>
                                <p><strong>Mô tả:</strong> {selectedTournament.description}</p>
                                <p><strong>Ghi chú cũ:</strong> {selectedTournament.notes || 'Không có'}</p>
                            </div>
                            <div className="modal-section">
                                <h3>Thống kê</h3>
                                <div className="stats-row">
                                    <div className="stat-item">
                                        <span className="label">Số người tham gia</span>
                                        <span className="value">{selectedTournament.registered_players || 0}/{selectedTournament.max_player}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="label">Phí tham gia</span>
                                        <span className="value">${selectedTournament.entry_fee}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="label">Tổng giải thưởng</span>
                                        <span className="value">${selectedTournament.prize_pool}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Update Status Section */}
                            {availableOptions.length > 0 ? (
                                <div className="modal-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                    <h3>Cập nhật trạng thái</h3>
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Chọn trạng thái mới:</label>
                                        <select
                                            className="form-control"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                            value={updateStatus}
                                            onChange={(e) => setUpdateStatus(e.target.value)}
                                        >
                                            <option value="">-- Chọn trạng thái --</option>
                                            {availableOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Lý do / Ghi chú {isReasonRequired && <span style={{ color: 'red' }}>*</span>}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
                                            placeholder={isReasonRequired ? "Nhập lý do tại đây (Bắt buộc)..." : "Ghi chú thêm (Tùy chọn)..."}
                                            value={updateNotes}
                                            onChange={(e) => setUpdateNotes(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={handleUpdateStatus}
                                    >
                                        Cập nhật trạng thái
                                    </button>
                                </div>
                            ) : (
                                <div className="modal-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', color: '#666' }}>
                                    <em>Không thể cập nhật trạng thái cho giải đấu này (Đã kết thúc hoặc bị hủy).</em>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedTournament(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTournament;
