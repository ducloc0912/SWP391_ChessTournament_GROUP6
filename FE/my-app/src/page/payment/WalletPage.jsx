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
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [transactions, setTransactions] = useState([]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profile/me`, {
        withCredentials: true,
      });
      if (res.data && res.data.success) {
        // payload can be inside res.data.data
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

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
      <div className="hpv-container payment-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "20px" }}>
           {/* Main content */}
           <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
               {/* Balance Card */}
               <div className="payment-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                      <h4 style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Số dư tài khoản</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                         <span style={{ fontSize: "28px", fontWeight: "bold", color: "#1e293b" }}>
                            {currentBalance.toLocaleString()}đ
                         </span>
                      </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                     <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Nạp thêm tiền</h4>
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
                            style={{ padding: "8px 16px" }}
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
                           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                               <thead>
                                   <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                       <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Thời gian</th>
                                       <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Loại</th>
                                       <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Số tiền</th>
                                       <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Mô tả</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {transactions.map(tx => (
                                       <tr key={tx.transactionId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                           <td style={{ padding: "12px", color: "#64748b" }}>{tx.createAt}</td>
                                           <td style={{ padding: "12px" }}>
                                               <span className={`glass-pill ${tx.amount > 0 ? "text-green" : "text-red"}`}>
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
           </div>
        </div>

      </div>
    </div>
  );
};

export default WalletPage;
