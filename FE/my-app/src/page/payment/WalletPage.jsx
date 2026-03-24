import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import axios from "axios";
import { API_BASE } from "../../config/api";
import "../../assets/css/HomePage.css";
import "../../assets/css/payment/Payment.css";
import "../../assets/css/payment/Wallet.css";

const TX_TYPES = ["Tất cả", "Deposit", "Withdrawal", "Refund", "EntryFee", "PrizePayout", "TournamentCreation"];

const TYPE_META = {
  Deposit:            { bg: "#dcfce7", color: "#15803d", label: "Nạp tiền",      icon: "fa-arrow-down-to-line" },
  Withdrawal:         { bg: "#fee2e2", color: "#dc2626", label: "Rút tiền",      icon: "fa-arrow-up-from-line" },
  Refund:             { bg: "#dbeafe", color: "#1d4ed8", label: "Hoàn tiền",     icon: "fa-rotate-left" },
  EntryFee:           { bg: "#fef9c3", color: "#854d0e", label: "Phí tham gia",  icon: "fa-chess-king" },
  PrizePayout:        { bg: "#f0fdf4", color: "#166534", label: "Tiền thưởng",   icon: "fa-trophy" },
  TournamentCreation: { bg: "#f3e8ff", color: "#7e22ce", label: "Tạo giải đấu", icon: "fa-circle-plus" },
};

const WD_STATUS = {
  Pending:   { bg: "#fef9c3", color: "#854d0e", label: "Đang chờ",    icon: "fa-clock" },
  Approved:  { bg: "#dbeafe", color: "#1d4ed8", label: "Đã duyệt",    icon: "fa-check" },
  Completed: { bg: "#dcfce7", color: "#15803d", label: "Hoàn thành",  icon: "fa-circle-check" },
  Rejected:  { bg: "#fee2e2", color: "#dc2626", label: "Từ chối",     icon: "fa-xmark" },
};

const getMeta   = (type)   => TYPE_META[type]   || { bg: "#f1f5f9", color: "#475569", label: type,   icon: "fa-circle-dot" };
const getWdMeta = (status) => WD_STATUS[status]  || { bg: "#f1f5f9", color: "#475569", label: status, icon: "fa-circle-dot" };

const fmt = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d) ? ts : d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const WalletPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionUser, setSessionUser]   = useState(null);
  const [loading, setLoading]           = useState(true);

  const [amount, setAmount]             = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [transactions, setTransactions] = useState([]);

  const [withdrawals, setWithdrawals]     = useState([]);
  const [frozenBalance, setFrozenBalance] = useState(0);

  const [activeTab, setActiveTab] = useState("wallet");

  // Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "", bankName: "", bankAccountNumber: "", bankAccountName: ""
  });
  const [withdrawMsg, setWithdrawMsg]     = useState({ text: "", type: "" });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Topup toast
  const [topupToast, setTopupToast] = useState(null); // "success" | "cancel" | null

  // Filter state (Tổng quan tab)
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");

  /* ── API calls ── */
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profile/me`, { withCredentials: true });
      if (res.data?.success) {
        const payload = res.data.data?.user ?? res.data.user;
        if (payload) {
          setSessionUser(payload);
          const cur = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
          const updated = { ...cur, balance: payload.balance };
          sessionStorage.setItem("user", JSON.stringify(updated));
          localStorage.setItem("user", JSON.stringify(updated));
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/withdraw`, { withCredentials: true });
      if (res.data?.success) {
        const data = res.data.data || [];
        setWithdrawals(data);
        const frozen = data
          .filter(w => w.status?.toLowerCase() === "pending")
          .reduce((acc, w) => acc + Number(w.amount || 0), 0);
        setFrozenBalance(frozen);
      }
    } catch (err) { console.error("Failed to fetch withdrawals", err); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/transactions`, { withCredentials: true });
      if (res.data?.success) setTransactions(res.data.data || []);
    } catch (err) { console.error("Failed to fetch transactions", err); }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) { navigate("/login"); return; }
    setSessionUser(JSON.parse(raw));
    fetchUserProfile();
    fetchTransactions();
    fetchWithdrawals();

    // Handle PayOS return URL
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const code   = params.get("code");
    const cancel = params.get("cancel");
    if (status === "PAID" && code === "00") {
      setTopupToast("success");
    } else if (cancel === "true" || status === "CANCELLED") {
      setTopupToast("cancel");
    }
    // Clean URL — hide PayOS query params
    if (params.toString()) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setSessionUser(null);
    navigate("/login");
  };

  /* ── Topup ── */
  const handleTopup = async () => {
    const topupAmount = parseInt(amount, 10);
    if (!topupAmount || topupAmount < 10000) { setErrorMsg("Số tiền nạp tối thiểu là 10,000đ"); return; }
    setErrorMsg("");
    setIsProcessing(true);
    try {
      const returnUrl = window.location.origin + "/wallet?status=success";
      const cancelUrl = window.location.origin + "/wallet?status=cancel";
      const res = await axios.post(`${API_BASE}/api/payos/create-payment`,
        { amount: topupAmount, returnUrl, cancelUrl }, { withCredentials: true });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setErrorMsg("Không thể tạo link thanh toán.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Có lỗi xảy ra khi gọi API nạp tiền.");
      setIsProcessing(false);
    }
  };

  /* ── Withdraw modal ── */
  const openWithdrawModal = () => {
    setWithdrawForm({ amount: "", bankName: "", bankAccountNumber: "", bankAccountName: "" });
    setWithdrawMsg({ text: "", type: "" });
    setShowWithdrawModal(true);
  };

  const handleWithdrawChange = (e) => setWithdrawForm({ ...withdrawForm, [e.target.name]: e.target.value });

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawMsg({ text: "", type: "" });
    const wdAmount = parseInt(withdrawForm.amount, 10);
    if (!wdAmount || wdAmount <= 0)                    { setWithdrawMsg({ text: "Số tiền không hợp lệ.",                          type: "error" }); return; }
    if (wdAmount > (sessionUser?.balance || 0))        { setWithdrawMsg({ text: "Số dư không đủ để rút.",                         type: "error" }); return; }
    if (!withdrawForm.bankName || !withdrawForm.bankAccountNumber || !withdrawForm.bankAccountName) {
      setWithdrawMsg({ text: "Vui lòng nhập đầy đủ thông tin ngân hàng.", type: "error" }); return;
    }
    setIsWithdrawing(true);
    try {
      const res = await axios.post(`${API_BASE}/api/user/withdraw`, withdrawForm, { withCredentials: true });
      if (res.data?.success) {
        setWithdrawMsg({ text: "Gửi yêu cầu thành công! Vui lòng chờ staff duyệt.", type: "success" });
        fetchUserProfile();
        fetchWithdrawals();
        setTimeout(() => setShowWithdrawModal(false), 1800);
      } else {
        setWithdrawMsg({ text: res.data.message || "Có lỗi xảy ra.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setWithdrawMsg({ text: err.response?.data?.message || "Lỗi máy chủ khi rút tiền.", type: "error" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  /* ── Filter ── */
  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== "Tất cả" && tx.type !== typeFilter) return false;
      if (dateFrom) {
        const txDate = new Date(tx.createAt);
        if (isNaN(txDate) || txDate < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const txDate = new Date(tx.createAt);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (isNaN(txDate) || txDate > end) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo]);

  const hasFilter  = typeFilter !== "Tất cả" || dateFrom || dateTo;
  const resetFilters = () => { setTypeFilter("Tất cả"); setDateFrom(""); setDateTo(""); };

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments/public", label: "Tournaments" },
  ];

  if (loading || !sessionUser) {
    return (
      <div id="wallet-page" className="hpv-page payment-page">
        <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="hpv-container flex-center"><h3>Đang tải...</h3></div>
      </div>
    );
  }

  const currentBalance = sessionUser.balance || 0;

  return (
    <div id="wallet-page" className="hpv-page payment-page">
      <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />

      {/* ── Topup result toast ── */}
      {topupToast && (
        <div className={`wallet-toast wallet-toast-${topupToast}`}>
          {topupToast === "success" ? (
            <><i className="fa-solid fa-circle-check" /> Bạn đã nạp tiền thành công!</>
          ) : (
            <><i className="fa-solid fa-circle-xmark" /> Giao dịch nạp tiền đã bị hủy.</>
          )}
          <button className="wallet-toast-close" onClick={() => setTopupToast(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      <div className="wallet-layout">

        {/* ── Sidebar ── */}
        <aside className="wallet-sidebar">
          <p className="wallet-sidebar-title">Ví của tôi</p>
          <button className={`wallet-nav-item${activeTab === "wallet"   ? " active" : ""}`} onClick={() => setActiveTab("wallet")}>
            <i className="fa-solid fa-wallet" /><span>Tổng quan</span>
          </button>
          <button className={`wallet-nav-item${activeTab === "withdraw" ? " active" : ""}`} onClick={() => setActiveTab("withdraw")}>
            <i className="fa-solid fa-money-bill-transfer" /><span>Rút tiền</span>
          </button>
        </aside>

        {/* ── Main Content ── */}
        <div className="wallet-content">

          {/* ════ TAB: TỔNG QUAN ════ */}
          {activeTab === "wallet" && (
            <>
              {/* Balance Card */}
              <div className="wallet-balance-card">
                <div className="wallet-balance-left">
                  <div className="wallet-balance-block">
                    <span className="wbl-label">Số dư khả dụng</span>
                    <span className="wbl-value primary">{currentBalance.toLocaleString()}<em>đ</em></span>
                  </div>
                  <div className="wallet-balance-sep" />
                  <div className="wallet-balance-block">
                    <span className="wbl-label"><i className="fa-regular fa-snowflake" /> Đóng băng</span>
                    <span className="wbl-value frozen">{frozenBalance.toLocaleString()}<em>đ</em></span>
                  </div>
                </div>
                <div className="wallet-topup-block">
                  <span className="wbl-label">Nạp thêm tiền</span>
                  <div className="wallet-topup-row">
                    <input type="number" className="wallet-input" placeholder="Nhập số tiền..."
                      value={amount} onChange={(e) => setAmount(e.target.value)} min="10000" />
                    <button className="wallet-btn-topup" onClick={handleTopup} disabled={isProcessing}>
                      <i className="fa-solid fa-plus" />
                      {isProcessing ? "Đang xử lý..." : "Nạp tiền"}
                    </button>
                  </div>
                  {errorMsg && <p className="wallet-error-msg">{errorMsg}</p>}
                </div>
              </div>

              {/* Transaction History */}
              <div className="wallet-tx-card">
                <div className="wallet-tx-header">
                  <div>
                    <h2 className="wallet-tx-title">Lịch sử giao dịch</h2>
                    <p className="wallet-tx-sub">Các giao dịch đã được xử lý hoàn tất</p>
                  </div>
                  <span className="wallet-tx-count-badge">{transactions.length} giao dịch</span>
                </div>

                {/* Filter Bar */}
                <div className="wallet-filter-bar">
                  <div className="wallet-filter-group">
                    <label className="wallet-filter-label"><i className="fa-solid fa-tag" /> Loại</label>
                    <select className="wallet-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                      {TX_TYPES.map(t => (
                        <option key={t} value={t}>{t === "Tất cả" ? "Tất cả loại" : (TYPE_META[t]?.label || t)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="wallet-filter-group">
                    <label className="wallet-filter-label"><i className="fa-solid fa-calendar-days" /> Từ ngày</label>
                    <input type="date" className="wallet-filter-date" value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)} max={dateTo || undefined} />
                  </div>
                  <div className="wallet-filter-group">
                    <label className="wallet-filter-label"><i className="fa-solid fa-calendar-days" /> Đến ngày</label>
                    <input type="date" className="wallet-filter-date" value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)} min={dateFrom || undefined} />
                  </div>
                  {hasFilter && (
                    <button className="wallet-filter-reset" onClick={resetFilters}>
                      <i className="fa-solid fa-xmark" /> Xóa bộ lọc
                    </button>
                  )}
                </div>

                {hasFilter && (
                  <p className="wallet-filter-result">
                    Tìm thấy <strong>{filteredTx.length}</strong> / {transactions.length} giao dịch
                  </p>
                )}

                {filteredTx.length === 0 ? (
                  <div className="wallet-tx-empty">
                    <i className="fa-solid fa-inbox" />
                    <p>Không có giao dịch nào phù hợp.</p>
                  </div>
                ) : (
                  <div className="wallet-tx-table-wrap">
                    <table className="wallet-tx-table">
                      <thead>
                        <tr>
                          <th>Thời gian</th>
                          <th>Loại</th>
                          <th className="tx-amount-col">Số tiền</th>
                          <th>Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.map(tx => {
                          const meta     = getMeta(tx.type);
                          const positive = tx.amount > 0;
                          return (
                            <tr key={tx.transactionId} className="wallet-tx-row">
                              <td className="tx-date">{tx.createAt}</td>
                              <td>
                                <span className="tx-type-badge" style={{ background: meta.bg, color: meta.color }}>
                                  <i className={`fa-solid ${meta.icon}`} />{meta.label}
                                </span>
                              </td>
                              <td className={`tx-amount ${positive ? "tx-pos" : "tx-neg"}`}>
                                {positive ? "+" : ""}{tx.amount.toLocaleString()}đ
                              </td>
                              <td className="tx-desc">{tx.description}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ TAB: RÚT TIỀN ════ */}
          {activeTab === "withdraw" && (
            <div className="wallet-tx-card">
              {/* Header */}
              <div className="wallet-tx-header">
                <div>
                  <h2 className="wallet-tx-title">Yêu cầu rút tiền</h2>
                  <p className="wallet-tx-sub">Danh sách các yêu cầu rút tiền của bạn</p>
                </div>
                <button className="wallet-btn-new-wd" onClick={openWithdrawModal}>
                  <i className="fa-solid fa-plus" /> Tạo yêu cầu
                </button>
              </div>

              {/* Balance summary */}
              <div className="wallet-wd-balance-row">
                <div className="wallet-wd-balance-item">
                  <span className="wbl-label">Số dư khả dụng</span>
                  <span className="wbl-value primary">{currentBalance.toLocaleString()}<em>đ</em></span>
                </div>
                <div className="wallet-wd-balance-item frozen-block">
                  <span className="wbl-label"><i className="fa-regular fa-snowflake" /> Đang đóng băng</span>
                  <span className="wbl-value frozen">{frozenBalance.toLocaleString()}<em>đ</em></span>
                </div>
                <div className="wallet-wd-balance-item">
                  <span className="wbl-label">Tổng yêu cầu</span>
                  <span className="wbl-value" style={{ fontSize: 20 }}>{withdrawals.length}<em style={{ fontSize: 13, marginLeft: 4 }}>yêu cầu</em></span>
                </div>
              </div>

              {/* Withdrawal list */}
              {withdrawals.length === 0 ? (
                <div className="wallet-tx-empty">
                  <i className="fa-solid fa-file-invoice" />
                  <p>Bạn chưa có yêu cầu rút tiền nào.</p>
                  <button className="wallet-btn-topup" style={{ marginTop: 8 }} onClick={openWithdrawModal}>
                    <i className="fa-solid fa-plus" /> Tạo yêu cầu đầu tiên
                  </button>
                </div>
              ) : (
                <div className="wallet-tx-table-wrap">
                  <table className="wallet-tx-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Số tiền</th>
                        <th>Ngân hàng</th>
                        <th>Tài khoản</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map(wd => {
                        const meta = getWdMeta(wd.status);
                        return (
                          <tr key={wd.withdrawalId} className="wallet-tx-row">
                            <td className="tx-date">{fmt(wd.createAt)}</td>
                            <td className="tx-amount tx-neg">{Number(wd.amount).toLocaleString()}đ</td>
                            <td style={{ color: "#1e293b", fontSize: 13 }}>{wd.bankName}</td>
                            <td style={{ color: "#475569", fontSize: 13 }}>
                              <div style={{ fontWeight: 500 }}>{wd.bankAccountNumber}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{wd.bankAccountName}</div>
                            </td>
                            <td>
                              <span className="tx-type-badge" style={{ background: meta.bg, color: meta.color }}>
                                <i className={`fa-solid ${meta.icon}`} />{meta.label}
                              </span>
                            </td>
                            <td className="tx-desc">
                              {wd.status === "Completed" && wd.bankTransferRef ? (
                                <button
                                  className="wallet-btn-proof"
                                  onClick={() => setProofImageUrl(wd.bankTransferRef)}
                                >
                                  <i className="fa-solid fa-image" /> Xem biên lai
                                </button>
                              ) : wd.rejectionReason ? (
                                <span style={{ color: "#dc2626", fontSize: 12 }}>{wd.rejectionReason}</span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ════ PROOF IMAGE VIEWER ════ */}
      {proofImageUrl && (
        <div className="wallet-modal-overlay" onClick={() => setProofImageUrl(null)}>
          <div className="wallet-proof-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header" style={{ padding: "16px 20px 12px" }}>
              <h3 className="wallet-modal-title">Biên lai chuyển khoản</h3>
              <button className="wallet-modal-close" onClick={() => setProofImageUrl(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="wallet-proof-img-wrap">
              <img src={proofImageUrl} alt="Biên lai" className="wallet-proof-img" />
            </div>
            <div style={{ padding: "12px 20px 16px", textAlign: "right" }}>
              <a href={proofImageUrl} target="_blank" rel="noreferrer" className="wallet-btn-proof-dl">
                <i className="fa-solid fa-arrow-up-right-from-square" /> Mở ảnh gốc
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ════ WITHDRAW MODAL ════ */}
      {showWithdrawModal && (
        <div className="wallet-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowWithdrawModal(false)}>
          <div className="wallet-modal">
            <div className="wallet-modal-header">
              <div>
                <h3 className="wallet-modal-title">Tạo yêu cầu rút tiền</h3>
                <p className="wallet-modal-sub">Số tiền sẽ bị trừ và tạm giữ cho đến khi staff duyệt</p>
              </div>
              <button className="wallet-modal-close" onClick={() => setShowWithdrawModal(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Available balance inside modal */}
            <div className="wallet-modal-balance">
              <span className="wbl-label">Số dư khả dụng</span>
              <span className="wbl-value primary" style={{ fontSize: 20 }}>{currentBalance.toLocaleString()}<em>đ</em></span>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="wallet-wd-form">
              <div className="wallet-wd-field">
                <label>Số tiền rút (VNĐ) *</label>
                <input type="number" name="amount" className="wallet-input"
                  placeholder="Nhập số tiền muốn rút..." value={withdrawForm.amount}
                  onChange={handleWithdrawChange} required min="10000" />
                {withdrawForm.amount && parseInt(withdrawForm.amount) > currentBalance && (
                  <p className="wallet-error-msg">Vượt quá số dư khả dụng.</p>
                )}
              </div>
              <div className="wallet-wd-field">
                <label>Tên ngân hàng *</label>
                <input type="text" name="bankName" className="wallet-input"
                  placeholder="VD: Vietcombank, MB Bank..." value={withdrawForm.bankName}
                  onChange={handleWithdrawChange} required />
              </div>
              <div className="wallet-wd-field">
                <label>Số tài khoản *</label>
                <input type="text" name="bankAccountNumber" className="wallet-input"
                  placeholder="Số tài khoản ngân hàng..." value={withdrawForm.bankAccountNumber}
                  onChange={handleWithdrawChange} required />
              </div>
              <div className="wallet-wd-field">
                <label>Tên người thụ hưởng *</label>
                <input type="text" name="bankAccountName" className="wallet-input"
                  placeholder="Tên in hoa không dấu..." value={withdrawForm.bankAccountName}
                  onChange={handleWithdrawChange} required />
              </div>

              {withdrawMsg.text && (
                <div className={`wallet-wd-msg ${withdrawMsg.type}`}>{withdrawMsg.text}</div>
              )}

              <div className="wallet-modal-footer">
                <button type="button" className="wallet-btn-cancel" onClick={() => setShowWithdrawModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="wallet-btn-submit"
                  disabled={isWithdrawing || parseInt(withdrawForm.amount) > currentBalance}>
                  <i className="fa-solid fa-paper-plane" />
                  {isWithdrawing ? "Đang xử lý..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WalletPage;
