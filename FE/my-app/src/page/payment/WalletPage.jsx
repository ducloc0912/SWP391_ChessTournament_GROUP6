import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import axios from "axios";
import { API_BASE } from "../../config/api";
import "../../assets/css/HomePage.css";
import "../../assets/css/payment/Payment.css"; // Reuse some payment styles

const WalletPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Wallet state
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [transactions, setTransactions] = useState([]);
  
  // Withdrawals and Frozen Balance
  const [withdrawals, setWithdrawals] = useState([]);
  const [frozenBalance, setFrozenBalance] = useState(0);
  
  // Tabs: 'wallet' or 'withdraw'
  const [activeTab, setActiveTab] = useState("wallet");
  
  // Withdraw state
  const [withdrawForm, setWithdrawForm] = useState({
      amount: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: ""
  });
  const [withdrawMsg, setWithdrawMsg] = useState({ text: "", type: "" });
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profile/me`, {
        withCredentials: true,
      });
      if (res.data && res.data.success) {
        const payload = res.data.data ? res.data.data.user : res.data.user;
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
       if (error.response?.status === 401) {
            handleLogout();
       }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    setSessionUser(JSON.parse(raw));
    fetchUserProfile();
    fetchTransactions();
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/withdraw`, {
        withCredentials: true,
      });
      if (res.data && res.data.success) {
        const data = res.data.data || [];
        setWithdrawals(data);
        const frozen = data.filter(w => 
          w.status && w.status.toString().toLowerCase().trim() === 'pending'
        ).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        setFrozenBalance(frozen);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/transactions`, {
        withCredentials: true,
      });
      if (res.data && res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setSessionUser(null);
    navigate("/login");
  };

  const handleTopup = async () => {
    const topupAmount = parseInt(amount, 10);
    if (!topupAmount || topupAmount < 10000) {
      setErrorMsg("Số tiền nạp tối thiểu là 10,000đ");
      return;
    }
    setErrorMsg("");
    setIsProcessing(true);
    try {
      const returnUrl = window.location.origin + "/wallet?status=success";
      const cancelUrl = window.location.origin + "/wallet?status=cancel";
      
      const res = await axios.post(`${API_BASE}/api/payos/create-payment`, {
         amount: topupAmount,
         returnUrl: returnUrl,
         cancelUrl: cancelUrl
      }, { withCredentials: true });
      
      if (res.data && res.data.checkoutUrl) {
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

  const handleWithdrawChange = (e) => {
      setWithdrawForm({ ...withdrawForm, [e.target.name]: e.target.value });
  };

  const handleWithdrawSubmit = async (e) => {
      e.preventDefault();
      setWithdrawMsg({ text: "", type: "" });
      const wdAmount = parseInt(withdrawForm.amount, 10);
      
      if (!wdAmount || wdAmount <= 0) {
          setWithdrawMsg({ text: "Số tiền không hợp lệ.", type: "error" });
          return;
      }
      if (wdAmount > (sessionUser?.balance || 0)) {
          setWithdrawMsg({ text: "Số dư không đủ để rút.", type: "error" });
          return;
      }
      if (!withdrawForm.bankName || !withdrawForm.bankAccountNumber || !withdrawForm.bankAccountName) {
          setWithdrawMsg({ text: "Vui lòng nhập đầy đủ thông tin ngân hàng.", type: "error" });
          return;
      }

      setIsWithdrawing(true);
      try {
          const res = await axios.post(`${API_BASE}/api/user/withdraw`, withdrawForm, { withCredentials: true });
          if (res.data && res.data.success) {
              setWithdrawMsg({ text: "Gửi yêu cầu rút tiền thành công. Vui lòng chờ staff duyệt.", type: "success" });
              setWithdrawForm({ amount: "", bankName: "", bankAccountNumber: "", bankAccountName: "" });
              fetchUserProfile(); // Refresh balance
              fetchTransactions(); // Refresh transactions
              fetchWithdrawals(); // Refresh withdrawals and frozen amount
          } else {
              setWithdrawMsg({ text: res.data.message || "Có lỗi xảy ra.", type: "error" });
          }
      } catch (err) {
          console.error(err);
          const msg = err.response?.data?.message || "Lỗi máy chủ khi rút tiền.";
          setWithdrawMsg({ text: msg, type: "error" });
      } finally {
          setIsWithdrawing(false);
      }
  };

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments/public", label: "Tournaments" },
  ];

  if (loading || !sessionUser) {
    return (
      <div id="wallet-page" className="hpv-page payment-page">
        <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="hpv-container flex-center">
            <h3>Đang tải...</h3>
        </div>
      </div>
    );
  }

  const currentBalance = sessionUser.balance || 0;

  return (
    <div id="wallet-page" className="hpv-page payment-page">
      <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
      <div className="hpv-container payment-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '30px', marginTop: '30px' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div 
                onClick={() => setActiveTab('wallet')}
                style={{
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'wallet' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'wallet' ? '#0ea5e9' : '#475569',
                    fontWeight: activeTab === 'wallet' ? '600' : '400',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
            >
                <i className="fa-solid fa-wallet" style={{ fontSize: '20px' }}></i> Của tôi
            </div>
            <div 
                onClick={() => setActiveTab('withdraw')}
                style={{
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'withdraw' ? '#e0f2fe' : 'transparent',
                    color: activeTab === 'withdraw' ? '#0ea5e9' : '#475569',
                    fontWeight: activeTab === 'withdraw' ? '600' : '400',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
            >
                <i className="fa-solid fa-money-bill-transfer" style={{ fontSize: '20px' }}></i> Rút Tiền
            </div>
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {activeTab === 'wallet' && (
                <>
                {/* Balance Card */}
                <div className="payment-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                        <div>
                            <h4 style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Số dư khả dụng</h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                                <span style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b" }}>
                                {currentBalance.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                        <div style={{ paddingLeft: "32px", borderLeft: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: 0, color: "#64748b", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-regular fa-snowflake" style={{ color: '#0ea5e9' }}></i> 
                                Đóng băng (Đang rút)
                            </h4>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                                <span style={{ fontSize: "20px", fontWeight: "600", color: "#0ea5e9" }}>
                                {frozenBalance.toLocaleString()}đ
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: '#64748b' }}>Nạp thêm tiền</h4>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input 
                            type="number" 
                            className="input-premium" 
                            placeholder="Nhập số tiền..." 
                            style={{ width: "150px", margin: 0 }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            />
                            <button 
                            className="btn-primary" 
                            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#0ea5e9", color: "#fff", cursor: "pointer", fontWeight: "600" }}
                            onClick={handleTopup}
                            disabled={isProcessing}
                            >
                            {isProcessing ? "Đang xử lý..." : "+ Nạp tiền"}
                            </button>
                        </div>
                        {errorMsg && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errorMsg}</div>}
                    </div>
                </div>

                {/* Transaction History */}
                <div className="payment-card">
                    <h2>Lịch sử giao dịch</h2>
                    <p style={{ color: "#64748b", fontSize: "14px" }}>Hiển thị các giao dịch bạn đã thực hiện</p>
                    
                    <div style={{ marginTop: "20px" }}>
                        {transactions.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                                <p style={{ color: "#94a3b8" }}>Chưa có giao dịch nào gần đây.</p>
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                        <th style={{ padding: "12px", color: "#475569" }}>Thời gian</th>
                                        <th style={{ padding: "12px", color: "#475569" }}>Loại</th>
                                        <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Số tiền</th>
                                        <th style={{ padding: "12px", color: "#475569" }}>Mô tả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.transactionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px", color: "#64748b" }}>{tx.createAt}</td>
                                            <td style={{ padding: "12px" }}>
                                                <span className={`glass-pill ${tx.amount > 0 ? "text-green" : "text-red"}`} style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: tx.amount > 0 ? '#dcfce7' : '#fee2e2', color: tx.amount > 0 ? '#16a34a' : '#ef4444' }}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", color: tx.amount > 0 ? "#16a34a" : "#dc2626" }}>
                                                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}đ
                                            </td>
                                            <td style={{ padding: "12px", color: "#475569" }}>{tx.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                </>
            )}

            {activeTab === 'withdraw' && (
                <div className="payment-card">
                    <h2 style={{ marginBottom: "8px" }}>Yêu cầu rút tiền</h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>Số tiền rút sẽ bị trừ và tạm giữ cho đến khi staff duyệt.</p>
                    
                    <div style={{ display: 'flex', gap: '24px', marginBottom: "24px" }}>
                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", flex: 1, border: "1px solid #e2e8f0" }}>
                            <h4 style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Số dư khả dụng</h4>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0ea5e9", marginTop: "4px" }}>
                                {currentBalance.toLocaleString()}đ
                            </div>
                        </div>
                        <div style={{ padding: "16px", backgroundColor: "#f0f9ff", borderRadius: "8px", flex: 1, border: "1px dashed #bae6fd" }}>
                            <h4 style={{ margin: 0, color: "#0ea5e9", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-regular fa-snowflake"></i> Đang đóng băng
                            </h4>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0284c7", marginTop: "4px" }}>
                                {frozenBalance.toLocaleString()}đ
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '500' }}>Số tiền rút (VNĐ)*</label>
                            <input 
                                type="number" 
                                name="amount"
                                className="input-premium" 
                                placeholder="Nhập số tiền muốn rút..."
                                value={withdrawForm.amount}
                                onChange={handleWithdrawChange}
                                required
                                min="10000"
                                style={{ width: '100%' }}
                            />
                            {withdrawForm.amount && parseInt(withdrawForm.amount) > currentBalance && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>Vượt quá số dư khả dụng.</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '500' }}>Tên ngân hàng*</label>
                            <input 
                                type="text" 
                                name="bankName"
                                className="input-premium" 
                                placeholder="VD: Vietcombank, MB Bank..."
                                value={withdrawForm.bankName}
                                onChange={handleWithdrawChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '500' }}>Số tài khoản*</label>
                            <input 
                                type="text" 
                                name="bankAccountNumber"
                                className="input-premium" 
                                placeholder="Số tài khoản ngân hàng..."
                                value={withdrawForm.bankAccountNumber}
                                onChange={handleWithdrawChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '500' }}>Tên người thụ hưởng*</label>
                            <input 
                                type="text" 
                                name="bankAccountName"
                                className="input-premium" 
                                placeholder="Tên in hoa không dấu..."
                                value={withdrawForm.bankAccountName}
                                onChange={handleWithdrawChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        {withdrawMsg.text && (
                            <div style={{ 
                                padding: "12px", 
                                borderRadius: "8px", 
                                backgroundColor: withdrawMsg.type === "success" ? "#dcfce7" : "#fee2e2", 
                                color: withdrawMsg.type === "success" ? "#16a34a" : "#dc2626",
                                fontSize: "14px"
                            }}>
                                {withdrawMsg.text}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isWithdrawing || parseInt(withdrawForm.amount) > currentBalance}
                            style={{ 
                                padding: "12px 24px", 
                                borderRadius: "8px", 
                                border: "none", 
                                backgroundColor: (isWithdrawing || parseInt(withdrawForm.amount) > currentBalance) ? "#cbd5e1" : "#0ea5e9", 
                                color: "#fff", 
                                cursor: (isWithdrawing || parseInt(withdrawForm.amount) > currentBalance) ? "not-allowed" : "pointer", 
                                fontWeight: "600",
                                marginTop: "8px"
                            }}
                        >
                            {isWithdrawing ? "Đang xử lý..." : "Gửi yêu cầu rút tiền"}
                        </button>
                    </form>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};

export default WalletPage;
