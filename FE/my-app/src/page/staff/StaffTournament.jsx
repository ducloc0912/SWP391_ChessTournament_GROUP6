import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import StatusBadge from '../../component/staff/StatusBadge';
import '../../assets/css/StaffDashboard.css';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Eye,
    Filter,
    Landmark,
    Receipt,
    RotateCcw,
    Save,
    Search,
    SendHorizontal,
    Wallet,
    XCircle
} from 'lucide-react';

const TAB_OPTIONS = [
    {
        id: 'approvals',
        title: 'Duyet giai',
        description: 'Tai len cac giai dang cho duyet va xu ly accept / reject.',
        icon: <CheckCircle2 size={18} />
    },
    {
        id: 'transactions',
        title: 'Giao dich giai',
        description: 'Quan ly fee dang ky, refund va transaction theo tung giai.',
        icon: <Receipt size={18} />
    },
    {
        id: 'withdrawals',
        title: 'Rut tien',
        description: 'Xu ly yeu cau rut tien va cap nhat anh chuyen khoan thanh cong.',
        icon: <Wallet size={18} />
    }
];

const currency = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} VND`;
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

const StaffTournament = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('approvals');
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [pendingTournaments, setPendingTournaments] = useState([]);
    const [transactionSummary, setTransactionSummary] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);

    const [selectedTournament, setSelectedTournament] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

    const [approvalNote, setApprovalNote] = useState('');
    const [withdrawalProof, setWithdrawalProof] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

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

            if (tab === 'transactions') {
                const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=transactionsSummary`, { withCredentials: true });
                setTransactionSummary(Array.isArray(response.data) ? response.data : []);
            }

            if (tab === 'withdrawals') {
                const response = await axios.get(`${API_BASE}/api/staff/tournaments?action=withdrawals`, { withCredentials: true });
                setWithdrawals(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error(error);
            if (tab === 'approvals') setPendingTournaments([]);
            if (tab === 'transactions') setTransactionSummary([]);
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

        if (activeTab === 'transactions') {
            return transactionSummary.filter((item) => {
                const matchesSearch = !term || (item.tournamentName || '').toLowerCase().includes(term);
                const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
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
    }, [activeTab, pendingTournaments, transactionSummary, withdrawals, searchTerm, statusFilter]);

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
        } catch (error) {
            console.error(error);
            setSelectedTournament(tournament);
            setApprovalNote('');
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
            alert(`Loi cap nhat: ${error.response?.data?.message || error.message}`);
        }
    };

    const openTransactions = async (row) => {
        try {
            const response = await axios.get(
                `${API_BASE}/api/staff/tournaments?action=transactions&tournamentId=${row.tournamentId}`,
                { withCredentials: true }
            );
            setSelectedTournament(row);
            setSelectedTransactions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            setSelectedTournament(row);
            setSelectedTransactions([]);
        }
    };

    const submitWithdrawalDone = async () => {
        if (!selectedWithdrawal || !withdrawalProof) {
            alert('Vui long chon anh thanh toan thanh cong');
            return;
        }

        const formData = new FormData();
        formData.append('withdrawalId', selectedWithdrawal.withdrawalId);
        formData.append('staffId', currentUser?.userId || 0);
        formData.append('proofImage', withdrawalProof);

        setSubmittingWithdrawal(true);
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
            alert(`Loi cap nhat yeu cau rut tien: ${error.response?.data?.message || error.message}`);
        } finally {
            setSubmittingWithdrawal(false);
        }
    };

    const submitWithdrawalReject = async () => {
        if (!selectedWithdrawal) return;
        if (!rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        setSubmittingWithdrawal(true);
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
            setSubmittingWithdrawal(false);
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
                        {activeTab === 'transactions' && 'Tournament Transactions'}
                        {activeTab === 'withdrawals' && 'Withdrawal Requests'}
                    </p>
                    <h2>
                        {activeTab === 'approvals' && 'Danh sach giai cho duyet'}
                        {activeTab === 'transactions' && 'Danh sach giao dich theo giai'}
                        {activeTab === 'withdrawals' && 'Danh sach yeu cau rut tien'}
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
                                    ? 'Tim nguoi rut tien...'
                                    : 'Tim giai dau...'
                            }
                        />
                    </div>
                    <div className="action-group">
                        <button className="reset-btn" onClick={resetFilters} title="Reset">
                            <RotateCcw size={18} />
                        </button>
                        {(activeTab === 'transactions' || activeTab === 'withdrawals') && (
                            <button
                                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={18} /> Bo loc {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Trang thai</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">Tat ca</option>
                                {activeTab === 'transactions' && (
                                    <>
                                        <option value="Pending">Cho duyet</option>
                                        <option value="Upcoming">Sap dien ra</option>
                                        <option value="Ongoing">Dang dien ra</option>
                                        <option value="Completed">Hoan thanh</option>
                                        <option value="Rejected">Tu choi</option>
                                        <option value="Cancelled">Da huy</option>
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

            {activeTab === 'approvals' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Ten giai dau</th>
                                <th>Dia diem</th>
                                <th>Format</th>
                                <th>Phi tham gia</th>
                                <th>Hanh dong</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="staff-table-empty">Dang tai...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={5} className="staff-table-empty">Khong co giai pending nao</td></tr>
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
                                        <td><StatusBadge status={item.format} /></td>
                                        <td>{currency(item.entryFee)}</td>
                                        <td>
                                            <button className="view-btn" onClick={() => openTournamentDetail(item)} title="Xem chi tiet">
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

            {activeTab === 'transactions' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Ten giai dau</th>
                                <th>Trang thai</th>
                                <th>So giao dich</th>
                                <th>Thu dang ky</th>
                                <th>Refund</th>
                                <th>Hanh dong</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="staff-table-empty">Dang tai...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={6} className="staff-table-empty">Khong co giao dich nao</td></tr>
                            ) : (
                                filteredRows.map((item) => (
                                    <tr key={item.tournamentId}>
                                        <td>
                                            <div className="item-meta">
                                                <div className="item-icon"><Receipt size={18} /></div>
                                                <div className="item-info">
                                                    <span className="item-title">{item.tournamentName}</span>
                                                    <span className="item-sub">{item.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><StatusBadge status={item.status} /></td>
                                        <td>{item.transactionCount || 0}</td>
                                        <td>{currency(item.totalEntryFee)}</td>
                                        <td>{currency(item.totalRefund)}</td>
                                        <td>
                                            <button className="view-btn" onClick={() => openTransactions(item)} title="Xem giao dich">
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

            {activeTab === 'withdrawals' && (
                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Nguoi rut</th>
                                <th>Bank</th>
                                <th>So tai khoan</th>
                                <th>So tien</th>
                                <th>Trang thai</th>
                                <th>Hanh dong</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="staff-table-empty">Dang tai...</td></tr>
                            ) : filteredRows.length === 0 ? (
                                <tr><td colSpan={6} className="staff-table-empty">Khong co yeu cau rut tien nao</td></tr>
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
                                            <button className="view-btn" onClick={() => { setSelectedWithdrawal(item); setWithdrawalProof(null); setPreviewImage(null); setRejectReason(''); }} title="Xu ly rut tien">
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

            {selectedTournament && activeTab === 'approvals' && (
                <div className="modal-overlay" onClick={() => setSelectedTournament(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                                    <p><strong>Dia diem:</strong> {selectedTournament.location}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Phi tham gia:</strong> {currency(selectedTournament.entryFee)}</p>
                                    <p><strong>Quy thuong:</strong> {currency(selectedTournament.prizePool)}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Min - Max Player:</strong> {selectedTournament.minPlayer} - {selectedTournament.maxPlayer}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Registration Deadline:</strong> {formatDateTime(selectedTournament.registrationDeadline)}</p>
                                    <p><strong>Bat dau:</strong> {formatDateTime(selectedTournament.startDate)}</p>
                                </div>
                                {selectedTournament.description && (
                                    <div className="content-preview">
                                        <strong>Mo ta:</strong><br />
                                        {selectedTournament.description}
                                    </div>
                                )}
                                {selectedTournament.rules && (
                                    <div className="content-preview">
                                        <strong>Rule:</strong><br />
                                        {selectedTournament.rules}
                                    </div>
                                )}
                            </div>

                            <div className="modal-section update-status-area">
                                <h4>Ghi chu staff</h4>
                                <div className="form-group">
                                    <textarea
                                        className="form-control"
                                        value={approvalNote}
                                        onChange={(e) => setApprovalNote(e.target.value)}
                                        placeholder="Nhap ghi chu hoac ly do xu ly..."
                                        style={{ minHeight: '100px' }}
                                    />
                                </div>
                                <div className="staff-modal-actions">
                                    <button className="btn-secondary danger" onClick={() => submitApproval('Rejected')}>
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button className="btn-primary" onClick={() => submitApproval('Upcoming')}>
                                        <Save size={18} /> Accept va chuyen Upcoming
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedTournament && activeTab === 'transactions' && (
                <div className="modal-overlay" onClick={() => { setSelectedTournament(null); setSelectedTransactions([]); }}>
                    <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Transaction - {selectedTournament.tournamentName}</h3>
                                <StatusBadge status={selectedTournament.status} />
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedTournament(null); setSelectedTransactions([]); }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="staff-transaction-list">
                                {selectedTransactions.length === 0 ? (
                                    <div className="staff-table-empty no-border">Chua co transaction cho giai nay</div>
                                ) : (
                                    selectedTransactions.map((transaction) => (
                                        <div key={transaction.transactionId} className="staff-transaction-item">
                                            <div>
                                                <strong>{fullName(transaction)}</strong>
                                                <p>{transaction.username} • {transaction.type}</p>
                                            </div>
                                            <div>
                                                <strong>{currency(transaction.amount)}</strong>
                                                <p>{formatDateTime(transaction.createAt)}</p>
                                            </div>
                                            <div className="staff-transaction-note">
                                                {transaction.description || 'Khong co mo ta'}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <p><strong>Nguoi rut:</strong> {fullName(selectedWithdrawal)}</p>
                                    <p><strong>Email:</strong> {selectedWithdrawal.email}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Bank:</strong> {selectedWithdrawal.bankName}</p>
                                    <p><strong>STK:</strong> {selectedWithdrawal.bankAccountNumber}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Ten tai khoan:</strong> {selectedWithdrawal.bankAccountName}</p>
                                    <p><strong>So tien:</strong> {currency(selectedWithdrawal.amount)}</p>
                                </div>
                                <div className="info-row">
                                    <p><strong>Tao luc:</strong> {formatDateTime(selectedWithdrawal.createAt)}</p>
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
                                                disabled={submittingWithdrawal || !withdrawalProof}
                                            >
                                                <CheckCircle2 size={18} /> {submittingWithdrawal ? 'Đang xử lý...' : 'Xác nhận Đã chuyển khoản'}
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
                                                disabled={submittingWithdrawal || !rejectReason.trim()}
                                            >
                                                <XCircle size={18} /> {submittingWithdrawal ? 'Đang xử lý...' : 'Từ chối Rút tiền (Hoàn số dư)'}
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
