import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import StatusBadge from '../../component/staff/StatusBadge';
import '../../assets/css/StaffDashboard.css';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Eye,
    Filter,
    Landmark,
    ListChecks,
    Play,
    Receipt,
    RotateCcw,
    Save,
    Search,
    SendHorizontal,
    Settings,
    Trophy,
    Wallet,
    XCircle
} from 'lucide-react';

const TAB_OPTIONS = [
    {
        id: 'approvals',
        title: 'Duyệt giải',
        description: 'Tải lên các giải đang chờ duyệt và xử lý accept / reject.',
        icon: <CheckCircle2 size={18} />
    },
    {
        id: 'management',
        title: 'Quản lý giải',
        description: 'Xem tất cả giải đấu và cập nhật trạng thái (bao gồm hủy giải).',
        icon: <Settings size={18} />
    },
    {
        id: 'withdrawals',
        title: 'Rút tiền',
        description: 'Xử lý yêu cầu rút tiền và cập nhật ảnh chuyển khoản thành công.',
        icon: <Wallet size={18} />
    }
];

const currency = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} VNĐ`;
};

const formatDateTime = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
};

const fullName = (item) => {
    const name = `${item?.firstName || ''} ${item?.lastName || ''}`.trim();
    return name || item?.username || 'User';
};

/* Các trạng thái tiếp theo mà staff có thể chuyển, tùy theo status hiện tại */
const ALLOWED_TRANSITIONS = {
    'Upcoming': [
        { status: 'Cancelled', action: 'Cancel', label: 'Hủy giải', icon: <XCircle size={16} />, color: '#dc2626', isCancel: true }
    ],
    'Ongoing': [
        { status: 'Completed', action: 'Complete', label: 'Kết thúc giải', icon: <Trophy size={16} />, color: '#16a34a' },
        { status: 'Cancelled', action: 'Cancel', label: 'Hủy giải', icon: <XCircle size={16} />, color: '#dc2626', isCancel: true }
    ],
    'Delayed': [
        { status: 'Cancelled', action: 'Cancel', label: 'Hủy giải', icon: <XCircle size={16} />, color: '#dc2626', isCancel: true }
    ],
    'Rejected': [],
    'Completed': [],
    'Cancelled': []
};

const StaffTournament = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('approvals');
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [pendingTournaments, setPendingTournaments] = useState([]);
    const [allTournaments, setAllTournaments] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);

    const [selectedTournament, setSelectedTournament] = useState(null);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

    const [approvalNote, setApprovalNote] = useState('');
    const [managementNote, setManagementNote] = useState('');
    const [withdrawalProof, setWithdrawalProof] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTabData(activeTab);
    }, [activeTab]);

    const fetchTabData = async (tab) => {
        setLoading(true);
        try {
            if (tab === 'approvals') {
                const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=pending`, { withCredentials: true });
                setPendingTournaments(Array.isArray(response.data) ? response.data : []);
            }

            if (tab === 'management') {
                const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=allNonPending`, { withCredentials: true });
                setAllTournaments(Array.isArray(response.data) ? response.data : []);
            }

            if (tab === 'withdrawals') {
                const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=withdrawals`, { withCredentials: true });
                setWithdrawals(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error(error);
            if (tab === 'approvals') setPendingTournaments([]);
            if (tab === 'management') setAllTournaments([]);
            if (tab === 'withdrawals') setWithdrawals([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredRows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (activeTab === 'approvals') {
            return pendingTournaments.filter((item) => {
                const matchesSearch = !term || (item.tournamentName || '').toLowerCase().includes(term);
                return matchesSearch;
            });
        }

        if (activeTab === 'management') {
            return allTournaments.filter((item) => {
                const matchesSearch = !term || (item.tournamentName || '').toLowerCase().includes(term);
                const status = item.status?.name || item.status || '';
                const matchesStatus = statusFilter === 'All' || status === statusFilter;
                return matchesSearch && matchesStatus;
            });
        }

        return withdrawals.filter((item) => {
            const matchesSearch =
                !term ||
                fullName(item).toLowerCase().includes(term) ||
                (item.username || '').toLowerCase().includes(term) ||
                (item.bankName || '').toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [activeTab, pendingTournaments, allTournaments, withdrawals, searchTerm, statusFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
    };

    const openTournamentDetail = async (tournament) => {
        try {
            const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=detail&id=${tournament.tournamentId}`, {
                withCredentials: true
            });
            setSelectedTournament(response.data?.tournament || tournament);
            setApprovalNote('');
            setManagementNote('');
        } catch (error) {
            console.error(error);
            setSelectedTournament(tournament);
            setApprovalNote('');
            setManagementNote('');
        }
    };

    const submitApproval = async (nextStatus) => {
        if (!selectedTournament) return;

        const approvalAction = nextStatus === 'Upcoming' ? 'Approve' : 'Reject';
        try {
            await axios.post(
                `${API_BASE}/api/staff/tournaments?action=updateStatus`,
                {
                    tournamentId: selectedTournament.tournamentId,
                    staffId: currentUser?.userId || 0,
                    status: nextStatus,
                    approvalAction,
                    note: approvalNote
                },
                { withCredentials: true }
            );

            setSelectedTournament(null);
            setApprovalNote('');
            fetchTabData('approvals');
        } catch (error) {
            console.error(error);
            alert(`Lỗi cập nhật: ${error.response?.data?.message || error.message}`);
        }
    };

    const submitStatusChange = async (transition) => {
        if (!selectedTournament) return;
        if (!managementNote.trim()) {
            alert('Vui lòng nhập ghi chú / lý do.');
            return;
        }

        setSubmitting(true);
        try {
            if (transition.isCancel) {
                // Gọi API cancelTournament (kèm hoàn tiền)
                await axios.post(
                    `${API_BASE}/api/staff/tournaments?action=cancelTournament`,
                    {
                        tournamentId: selectedTournament.tournamentId,
                        staffId: currentUser?.userId || 0,
                        note: managementNote
                    },
                    { withCredentials: true }
                );
                alert('Đã hủy giải đấu và hoàn tiền thành công!');
            } else {
                // Gọi API updateStatus bình thường
                await axios.post(
                    `${API_BASE}/api/staff/tournaments?action=updateStatus`,
                    {
                        tournamentId: selectedTournament.tournamentId,
                        staffId: currentUser?.userId || 0,
                        status: transition.status,
                        approvalAction: transition.action,
                        note: managementNote
                    },
                    { withCredentials: true }
                );
            }

            setSelectedTournament(null);
            setManagementNote('');
            fetchTabData('management');
        } catch (error) {
            console.error(error);
            alert(`Lỗi cập nhật: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const submitWithdrawalDone = async () => {
        if (!selectedWithdrawal || !withdrawalProof) {
            alert('Vui lòng chọn ảnh thanh toán thành công');
            return;
        }

        const formData = new FormData();
        formData.append('withdrawalId', selectedWithdrawal.withdrawalId);
        formData.append('staffId', currentUser?.userId || 0);
        formData.append('proofImage', withdrawalProof);

        setSubmitting(true);
        try {
            await axios.post(
                `${API_BASE}/api/staff/tournaments?action=completeWithdrawal`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            setSelectedWithdrawal(null);
            setWithdrawalProof(null);
            setPreviewImage(null);
            setRejectReason('');
            fetchTabData('withdrawals');
        } catch (error) {
            console.error(error);
            alert(`Lỗi cập nhật yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const submitWithdrawalReject = async () => {
        if (!selectedWithdrawal) return;
        if (!rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new URLSearchParams();
            formData.append('withdrawalId', selectedWithdrawal.withdrawalId);
            formData.append('staffId', currentUser?.userId || 0);
            formData.append('reason', rejectReason);

            await axios.post(
                `${API_BASE}/api/staff/tournaments?action=rejectWithdrawal`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
            setSelectedWithdrawal(null);
            setWithdrawalProof(null);
            setPreviewImage(null);
            setRejectReason('');
            fetchTabData('withdrawals');
        } catch (error) {
            console.error(error);
            alert(`Lỗi từ chối yêu cầu rút tiền: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleProofChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setWithdrawalProof(file);
            setPreviewImage(URL.createObjectURL(file));
        } else {
            setWithdrawalProof(null);
            setPreviewImage(null);
        }
    };

    const getStatusStr = (t) => t?.status?.name || t?.status || '';

    return (
        <div className="staff-container">
            <div className="staff-feature-nav">
                {TAB_OPTIONS.map((tab) => (
                    <button
                        key={tab.id}
                        className={`staff-feature-card ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowFilters(false);
                            resetFilters();
                        }}
                    >
                        <span className="staff-feature-icon">{tab.icon}</span>
                        <strong>{tab.title}</strong>
                        <small>{tab.description}</small>
                    </button>
                ))}
            </div>

            <div className="staff-section-intro">
                <div>
                    <p className="staff-section-label">
                        {activeTab === 'approvals' && 'Approval Queue'}
                        {activeTab === 'management' && 'Tournament Management'}
                        {activeTab === 'withdrawals' && 'Withdrawal Requests'}
                    </p>
                    <h2>
                        {activeTab === 'approvals' && 'Danh sách giải chờ duyệt'}
                        {activeTab === 'management' && 'Quản lý tất cả giải đấu'}
                        {activeTab === 'withdrawals' && 'Danh sách yêu cầu rút tiền'}
                    </h2>
                </div>
            </div>

            <div className="controls-section">
                <div className="controls-top-bar">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                activeTab === 'withdrawals'
                                    ? 'Tìm người rút tiền...'
                                    : 'Tìm giải đấu...'
                            }
                        />
                    </div>
                    <div className="action-group">
                        <button className="reset-btn" onClick={resetFilters} title="Reset">
                            <RotateCcw size={18} />
                        </button>
                        {(activeTab === 'management' || activeTab === 'withdrawals') && (
                            <button
                                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={18} /> Bộ lọc {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">Tất cả</option>
                                {activeTab === 'management' && (
                                    <>
                                        <option value="Upcoming">Sắp diễn ra</option>
                                        <option value="Ongoing">Đang diễn ra</option>
                                        <option value="Delayed">Tạm hoãn</option>
                                        <option value="Completed">Hoàn thành</option>
                                        <option value="Rejected">Từ chối</option>
                                        <option value="Cancelled">Đã hủy</option>
                                    </>
                                )}
                                {activeTab === 'withdrawals' && (
                                    <>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Completed">Completed</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ===================== TAB: APPROVALS ===================== */}
            {activeTab === 'approvals' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Tên giải đấu</th>
                                <th>Địa điểm</th>
                                <th>Format</th>
                                <th>Phí tham gia</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="staff-table-empty">Đang tải...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={5} className="staff-table-empty">Không có giải pending nào</td></tr>
                            ) : (
                                filteredRows.map((item) => (
                                    <tr key={item.tournamentId}>
                                        <td>
                                            <div className="item-meta">
                                                <div className="item-icon"><CheckCircle2 size={18} /></div>
                                                <div className="item-info">
                                                    <span className="item-title">{item.tournamentName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.location}</td>
                                        <td><StatusBadge status={item.format?.name || item.format} /></td>
                                        <td>{currency(item.entryFee)}</td>
                                        <td>
                                            <button className="view-btn" onClick={() => openTournamentDetail(item)} title="Xem chi tiết">
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===================== TAB: MANAGEMENT ===================== */}
            {activeTab === 'management' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Tên giải đấu</th>
                                <th>Trạng thái</th>
                                <th>Format</th>
                                <th>Phí / Prize</th>
                                <th>Ngày bắt đầu</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="staff-table-empty">Đang tải...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={6} className="staff-table-empty">Không có giải đấu nào</td></tr>
                            ) : (
                                filteredRows.map((item) => {
                                    const statusStr = getStatusStr(item);
                                    const transitions = ALLOWED_TRANSITIONS[statusStr] || [];
                                    return (
                                        <tr key={item.tournamentId}>
                                            <td>
                                                <div className="item-meta">
                                                    <div className="item-icon"><ListChecks size={18} /></div>
                                                    <div className="item-info">
                                                        <span className="item-title">{item.tournamentName}</span>
                                                        <span className="item-sub">{item.location}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><StatusBadge status={statusStr} /></td>
                                            <td><StatusBadge status={item.format?.name || item.format} /></td>
                                            <td>
                                                <div style={{ fontSize: '13px' }}>
                                                    <div>Phí: {currency(item.entryFee)}</div>
                                                    <div style={{ color: '#16a34a', fontWeight: 600 }}>Prize: {currency(item.prizePool)}</div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{formatDateTime(item.startDate)}</td>
                                            <td>
                                                {transitions.length > 0 ? (
                                                    <button className="view-btn" onClick={() => openTournamentDetail(item)} title="Cập nhật trạng thái">
                                                        <Settings size={16} />
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===================== TAB: WITHDRAWALS ===================== */}
            {activeTab === 'withdrawals' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Người rút</th>
                                <th>Bank</th>
                                <th>Số tài khoản</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="staff-table-empty">Đang tải...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={6} className="staff-table-empty">Không có yêu cầu rút tiền nào</td></tr>
                            ) : (
                                filteredRows.map((item) => (
                                    <tr key={item.withdrawalId}>
                                        <td>
                                            <div className="item-meta">
                                                <div className="item-icon"><Landmark size={18} /></div>
                                                <div className="item-info">
                                                    <span className="item-title">{fullName(item)}</span>
                                                    <span className="item-sub">{item.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.bankName}</td>
                                        <td>{item.bankAccountNumber}</td>
                                        <td>{currency(item.amount)}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                        <td>
                                            <button className="view-btn" onClick={() => { setSelectedWithdrawal(item); setWithdrawalProof(null); setPreviewImage(null); setRejectReason(''); }} title="Xử lý rút tiền">
                                                <SendHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===================== MODAL: APPROVAL DETAIL ===================== */}
            {selectedTournament && activeTab === 'approvals' && (
                <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedTournament.tournamentName}</h3>
                                <StatusBadge status={getStatusStr(selectedTournament)} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedTournament(null)}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* ── Thông tin cơ bản ── */}
                            <p className="approval-section-title">Thông tin giải đấu</p>
                            <div className="approval-info-grid">
                                <div className="approval-info-card">
                                    <span className="approval-info-label">Thể thức</span>
                                    <span className="approval-info-value">{selectedTournament.format?.name || selectedTournament.format || '--'}</span>
                                </div>
                                <div className="approval-info-card">
                                    <span className="approval-info-label">Địa điểm</span>
                                    <span className="approval-info-value">{selectedTournament.location || '--'}</span>
                                </div>
                                <div className="approval-info-card highlight">
                                    <span className="approval-info-label">Phí tham gia</span>
                                    <span className="approval-info-value">{currency(selectedTournament.entryFee)}</span>
                                </div>
                                <div className="approval-info-card highlight">
                                    <span className="approval-info-label">Quỹ thưởng</span>
                                    <span className="approval-info-value">{currency(selectedTournament.prizePool)}</span>
                                </div>
                                <div className="approval-info-card">
                                    <span className="approval-info-label">Số người chơi</span>
                                    <span className="approval-info-value">
                                        {selectedTournament.minPlayer} &mdash; {selectedTournament.maxPlayer} người
                                    </span>
                                </div>
                            </div>

                            {/* ── Lịch trình ── */}
                            <p className="approval-section-title">Lịch trình</p>
                            <div className="approval-timeline">
                                <div className="timeline-item">
                                    <span className="timeline-dot dot-reg" />
                                    <span className="timeline-label">Đóng đăng ký</span>
                                    <span className="timeline-value">{formatDateTime(selectedTournament.registrationDeadline)}</span>
                                </div>
                                <div className="timeline-connector" />
                                <div className="timeline-item">
                                    <span className="timeline-dot dot-start" />
                                    <span className="timeline-label">Bắt đầu giải</span>
                                    <span className="timeline-value">{formatDateTime(selectedTournament.startDate)}</span>
                                </div>
                                <div className="timeline-connector" />
                                <div className="timeline-item">
                                    <span className="timeline-dot dot-end" />
                                    <span className="timeline-label">Kết thúc giải</span>
                                    <span className="timeline-value">{formatDateTime(selectedTournament.endDate)}</span>
                                </div>
                            </div>

                            {/* ── Mô tả & Luật ── */}
                            {(selectedTournament.description || selectedTournament.rules) && (
                                <>
                                    <p className="approval-section-title">Mô tả &amp; Luật thi đấu</p>
                                    {selectedTournament.description && (
                                        <div className="content-preview" style={{ marginBottom: 10 }}>
                                            <p style={{ margin: 0 }}>{selectedTournament.description}</p>
                                        </div>
                                    )}
                                    {selectedTournament.rules && (
                                        <div className="content-preview">
                                            <strong style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Luật thi đấu</strong>
                                            <p style={{ margin: 0 }}>{selectedTournament.rules}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── Ghi chú leader ── */}
                            {selectedTournament.notes && (
                                <>
                                    <p className="approval-section-title">Ghi chú từ leader</p>
                                    <div className="content-preview">
                                        <p style={{ margin: 0 }}>{selectedTournament.notes}</p>
                                    </div>
                                </>
                            )}

                            {/* ── Hành động staff ── */}
                            <div className="approval-action-area">
                                <p className="approval-section-title" style={{ margin: '0 0 12px', borderBottom: 'none' }}>Ghi chú staff</p>
                                <div className="form-group">
                                    <textarea
                                        className="form-control"
                                        value={approvalNote}
                                        onChange={(e) => setApprovalNote(e.target.value)}
                                        placeholder="Nhập ghi chú hoặc lý do xử lý..."
                                        style={{ minHeight: '90px' }}
                                    />
                                </div>
                                <div className="staff-modal-actions">
                                    <button className="btn-secondary danger" onClick={() => submitApproval('Rejected')} disabled={submitting}>
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button className="btn-primary" onClick={() => submitApproval('Upcoming')} disabled={submitting}>
                                        <Save size={18} /> Accept và chuyển Upcoming
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== MODAL: MANAGEMENT DETAIL ===================== */}
            {selectedTournament && activeTab === 'management' && (() => {
                const statusStr = getStatusStr(selectedTournament);
                const transitions = ALLOWED_TRANSITIONS[statusStr] || [];
                return (
                    <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
                        <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h3 className="modal-title">{selectedTournament.tournamentName}</h3>
                                    <StatusBadge status={statusStr} />
                                </div>
                                <button className="close-btn" onClick={() => setSelectedTournament(null)}>
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="modal-body">
                                {/* ── Thông tin cơ bản ── */}
                                <p className="approval-section-title">Thông tin giải đấu</p>
                                <div className="approval-info-grid">
                                    <div className="approval-info-card">
                                        <span className="approval-info-label">Thể thức</span>
                                        <span className="approval-info-value">{selectedTournament.format?.name || selectedTournament.format || '--'}</span>
                                    </div>
                                    <div className="approval-info-card">
                                        <span className="approval-info-label">Địa điểm</span>
                                        <span className="approval-info-value">{selectedTournament.location || '--'}</span>
                                    </div>
                                    <div className="approval-info-card highlight">
                                        <span className="approval-info-label">Phí tham gia</span>
                                        <span className="approval-info-value">{currency(selectedTournament.entryFee)}</span>
                                    </div>
                                    <div className="approval-info-card highlight">
                                        <span className="approval-info-label">Quỹ thưởng</span>
                                        <span className="approval-info-value">{currency(selectedTournament.prizePool)}</span>
                                    </div>
                                    <div className="approval-info-card">
                                        <span className="approval-info-label">Số người chơi</span>
                                        <span className="approval-info-value">
                                            {selectedTournament.minPlayer} &mdash; {selectedTournament.maxPlayer} người
                                        </span>
                                    </div>
                                </div>

                                {/* ── Lịch trình ── */}
                                <p className="approval-section-title">Lịch trình</p>
                                <div className="approval-timeline">
                                    <div className="timeline-item">
                                        <span className="timeline-dot dot-reg" />
                                        <span className="timeline-label">Đóng đăng ký</span>
                                        <span className="timeline-value">{formatDateTime(selectedTournament.registrationDeadline)}</span>
                                    </div>
                                    <div className="timeline-connector" />
                                    <div className="timeline-item">
                                        <span className="timeline-dot dot-start" />
                                        <span className="timeline-label">Bắt đầu giải</span>
                                        <span className="timeline-value">{formatDateTime(selectedTournament.startDate)}</span>
                                    </div>
                                    <div className="timeline-connector" />
                                    <div className="timeline-item">
                                        <span className="timeline-dot dot-end" />
                                        <span className="timeline-label">Kết thúc giải</span>
                                        <span className="timeline-value">{formatDateTime(selectedTournament.endDate)}</span>
                                    </div>
                                </div>

                                {/* ── Mô tả & Luật ── */}
                                {(selectedTournament.description || selectedTournament.rules) && (
                                    <>
                                        <p className="approval-section-title">Mô tả &amp; Luật thi đấu</p>
                                        {selectedTournament.description && (
                                            <div className="content-preview" style={{ marginBottom: 10 }}>
                                                <p style={{ margin: 0 }}>{selectedTournament.description}</p>
                                            </div>
                                        )}
                                        {selectedTournament.rules && (
                                            <div className="content-preview">
                                                <strong style={{ display: 'block', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Luật thi đấu</strong>
                                                <p style={{ margin: 0 }}>{selectedTournament.rules}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ── Ghi chú leader ── */}
                                {selectedTournament.notes && (
                                    <>
                                        <p className="approval-section-title">Ghi chú từ leader</p>
                                        <div className="content-preview">
                                            <p style={{ margin: 0 }}>{selectedTournament.notes}</p>
                                        </div>
                                    </>
                                )}

                                {/* ── Cập nhật trạng thái ── */}
                                {transitions.length > 0 && (
                                    <div className="approval-action-area">
                                        <p className="approval-section-title" style={{ margin: '0 0 12px', borderBottom: 'none' }}>Cập nhật trạng thái giải đấu</p>
                                        <div className="form-group">
                                            <textarea
                                                className="form-control"
                                                value={managementNote}
                                                onChange={(e) => setManagementNote(e.target.value)}
                                                placeholder="Nhập ghi chú / lý do cập nhật trạng thái..."
                                                style={{ minHeight: '80px' }}
                                            />
                                        </div>
                                        <div className="mgmt-action-buttons">
                                            {transitions.map((tr) => (
                                                <button
                                                    key={tr.status}
                                                    className={tr.isCancel ? 'btn-secondary danger' : 'btn-primary'}
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: tr.isCancel ? undefined : tr.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                    onClick={() => {
                                                        if (tr.isCancel) {
                                                            if (!window.confirm('Bạn chắc chắn muốn HỦY giải đấu này? Nếu giải có phí, hệ thống sẽ tự động hoàn tiền cho leader và người chơi.')) return;
                                                        }
                                                        submitStatusChange(tr);
                                                    }}
                                                    disabled={submitting}
                                                >
                                                    {tr.icon} {submitting ? 'Đang xử lý...' : tr.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {transitions.length === 0 && (
                                    <div className="approval-action-area" style={{ textAlign: 'center', color: '#94a3b8' }}>
                                        Giải đấu ở trạng thái <strong>{statusStr}</strong> — không thể cập nhật thêm.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ===================== MODAL: WITHDRAWAL DETAIL ===================== */}
            {selectedWithdrawal && activeTab === 'withdrawals' && (
                <div className="modal-overlay" onClick={() => { setSelectedWithdrawal(null); setWithdrawalProof(null); setPreviewImage(null); setRejectReason(''); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Chi tiết rút tiền</h3>
                                <StatusBadge status={selectedWithdrawal.status} />
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedWithdrawal(null); setWithdrawalProof(null); setPreviewImage(null); setRejectReason(''); }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-section">
                                <div className="info-row">
                                    <p><strong>Người rút:</strong> {fullName(selectedWithdrawal)}</p>
                                    <p><strong>Email:</strong> {selectedWithdrawal.email}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Bank:</strong> {selectedWithdrawal.bankName}</p>
                                    <p><strong>STK:</strong> {selectedWithdrawal.bankAccountNumber}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Tên tài khoản:</strong> {selectedWithdrawal.bankAccountName}</p>
                                    <p><strong>Số tiền:</strong> {currency(selectedWithdrawal.amount)}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Tạo lúc:</strong> {formatDateTime(selectedWithdrawal.createAt)}</p>
                                    {selectedWithdrawal.status === 'Rejected' && (
                                        <p><strong>Lý do từ chối:</strong> <span style={{color: 'red'}}>{selectedWithdrawal.rejectionReason}</span></p>
                                    )}
                                </div>
                                {selectedWithdrawal.bankTransferRef && (
                                    <div style={{ marginTop: '16px' }}>
                                        <strong>Hình ảnh chuyển khoản thành công:</strong><br />
                                        <img src={selectedWithdrawal.bankTransferRef} alt="Proof" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    </div>
                                )}
                            </div>

                            {selectedWithdrawal.status === 'Pending' && (
                                <div className="modal-section update-status-area">
                                    <h4>Xử lý yêu cầu</h4>
                                    
                                    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                        {/* Duyệt & upload proof */}
                                        <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <strong style={{ display: 'block', marginBottom: '8px', color: '#16a34a' }}>Đồng ý và Upload Biên lai</strong>
                                            <div className="form-group">
                                                <input
                                                    className="form-control"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleProofChange}
                                                />
                                            </div>
                                            {previewImage && (
                                                <div style={{ margin: '12px 0' }}>
                                                    <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                                </div>
                                            )}
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', backgroundColor: '#16a34a' }}
                                                onClick={submitWithdrawalDone}
                                                disabled={submitting || !withdrawalProof}
                                            >
                                                <CheckCircle2 size={18} /> {submitting ? 'Đang xử lý...' : 'Xác nhận Đã chuyển khoản'}
                                            </button>
                                        </div>

                                        {/* Từ chối */}
                                        <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <strong style={{ display: 'block', marginBottom: '8px', color: '#dc2626' }}>Từ chối Yêu cầu</strong>
                                            <div className="form-group">
                                                <input
                                                    className="form-control"
                                                    type="text"
                                                    placeholder="Nhập lý do từ chối..."
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                className="btn-secondary danger"
                                                style={{ width: '100%', marginTop: '8px' }}
                                                onClick={submitWithdrawalReject}
                                                disabled={submitting || !rejectReason.trim()}
                                            >
                                                <XCircle size={18} /> {submitting ? 'Đang xử lý...' : 'Từ chối Rút tiền (Hoàn số dư)'}
                                            </button>
                                        </div>
                                    </div>
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
