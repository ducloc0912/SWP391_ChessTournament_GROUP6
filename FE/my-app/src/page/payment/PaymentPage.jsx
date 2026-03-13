import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import MainHeader from '../../component/common/MainHeader';
import '../../assets/css/HomePage.css';
import '../../assets/css/payment/Payment.css';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import { validateRegistrationForm } from '../../utils/registrationValidation';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const paramTournamentId = location.state?.tournamentId || searchParams.get('tournamentId');
  const paramEntryFee = location.state?.entryFee;
  const paramParticipantId = Number(location.state?.participantId || searchParams.get('participantId') || 0);

  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [tournament, setTournament] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (!raw) return { id: 0, full_name: "Khách", phone: "0900000000", email: "guest@example.com" };
      const parsed = JSON.parse(raw);
      return {
        id: (parsed?.userId ?? parsed?.id) ?? 0,
        full_name: (parsed?.fullName ?? `${parsed?.firstName || ""} ${parsed?.lastName || ""}`.trim()) || "Khách",
        phone: (parsed?.phoneNumber ?? parsed?.phone) || "0900000000",
        email: parsed?.email || "guest@example.com"
      };
    } catch {
      return { id: 0, full_name: "Khách", phone: "0900000000", email: "guest@example.com" };
    }
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!raw) {
      setSessionUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setSessionUser(parsed);
      setUser({
        id: (parsed?.userId ?? parsed?.id) ?? 0,
        full_name: (parsed?.fullName ?? `${parsed?.firstName || ""} ${parsed?.lastName || ""}`.trim()) || "Khách",
        phone: (parsed?.phoneNumber ?? parsed?.phone) || "0900000000",
        email: parsed?.email || "guest@example.com"
      });
    } catch {
      setSessionUser(null);
    }
  }, []);

  useEffect(() => {
    // Fetch fresh profile to get latest balance
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
         console.error("Failed to fetch fresh profile in PaymentPage", error);
      }
    };
    if (sessionUser) {
        fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [participantId, setParticipantId] = useState(paramParticipantId || 0);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    rankAtRegistration: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!paramTournamentId) {
      setErrorMsg("Không tìm thấy thông tin Giải đấu. Vui lòng quay lại danh sách giải đấu.");
      setPageLoading(false);
      return;
    }

    const fetchTournament = async () => {
      try {
        const pub = await axios.get(`${API_BASE}/api/public/tournaments?action=detail&id=${paramTournamentId}`);
        if (pub.data) {
          setTournament(pub.data);
        } else {
          setErrorMsg("Không thể lấy dữ liệu giải đấu.");
        }
      } catch (err) {
        try {
          const res = await axios.get(`${API_BASE}/api/tournaments?id=${paramTournamentId}`, { withCredentials: true });
          if (res.data) setTournament(res.data);
          else setErrorMsg("Không thể lấy dữ liệu giải đấu từ máy chủ.");
        } catch {
          setErrorMsg("Không thể kết nối máy chủ để lấy thông tin giải đấu.");
        }
      } finally {
        setPageLoading(false);
      }
    };
    fetchTournament();
  }, [paramTournamentId]);

  useEffect(() => {
    if (!sessionUser || !tournament) return;
    setForm({
      fullName: `${sessionUser.firstName || ""} ${sessionUser.lastName || ""}`.trim(),
      username: sessionUser.username || "",
      email: sessionUser.email || "",
      phone: sessionUser.phoneNumber || "",
      rankAtRegistration: sessionUser.rank == null ? "" : String(sessionUser.rank),
    });
  }, [sessionUser?.userId, tournament?.tournamentId]);

  const entryFeeNum = Number(paramEntryFee ?? tournament?.entryFee ?? 0);
  const hasFee = entryFeeNum > 0;
  const actualFee = entryFeeNum || 500000;

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSubmitError('');
  };

  const getNormalizedForm = () => ({
    ...form,
    fullName: form.fullName.trim(),
    username: form.username.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    rankAtRegistration: String(form.rankAtRegistration ?? "").trim(),
  });

  /** Giải miễn phí: đăng ký ngay → thành công. Giải có phí: đăng ký + chuyển VNPay → thành công khi thanh toán xong. */
  const submitRegister = async () => {
    if (!sessionUser) {
      navigate('/login');
      return;
    }
    const normalized = getNormalizedForm();
    const errors = validateRegistrationForm(normalized);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/register`,
        {
          tournamentId: Number(tournament.tournamentId),
          fullName: normalized.fullName,
          username: normalized.username,
          email: normalized.email,
          phone: normalized.phone,
          rankAtRegistration: Number(normalized.rankAtRegistration),
          rank: Number(normalized.rankAtRegistration),
        },
        {
          withCredentials: true,
        }
      );
      const data = res.data?.data ?? res.data;
      const needPayment = data?.needPayment === true;

      if (!needPayment) {
        setLoading(false);
        alert(res.data?.message || "Đăng ký thành công. Bạn đã là thành viên giải.");
        navigate(`/tournaments/public/${tournament.tournamentId}`);
        return;
      }

      const newParticipantId = Number(data?.participantId ?? 0);
      setParticipantId(newParticipantId);
      if (!newParticipantId) {
        setSubmitError("Không nhận được thông tin đăng ký. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      await handlePayment(newParticipantId);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        sessionStorage.removeItem("user");
        localStorage.removeItem("user");
        setSessionUser(null);
        setSubmitError("Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để đăng ký giải.");
        setLoading(false);
        return;
      }
      if (status === 402) {
        setSubmitError("Số dư ví không đủ để đăng ký giải này. Vui lòng nạp thêm tiền.");
        setLoading(false);
        return;
      }
      const d = err?.response?.data;
      const msg = (typeof d?.message === 'string' && d.message) ? d.message
        : (typeof d?.error === 'string' && d.error) ? d.error
        : status === 403 ? "Bạn đã hủy hoặc hết hạn thanh toán lần trước. Vui lòng thử lại sau 2 giờ."
        : status === 409 ? "Bạn đã đăng ký giải này rồi."
        : "Đăng ký thất bại. Vui lòng thử lại.";
      setSubmitError(msg);
      setLoading(false);
    }
  };

  const handleTopupRedirect = () => {
      navigate('/wallet');
  };

  const handleSubmitPaid = (e) => {
    e?.preventDefault();
    submitRegister();
  };

  const handleSubmitFree = (e) => {
    e?.preventDefault();
    submitRegister();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setSessionUser(null);
    navigate("/login");
  };

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/tournaments/public", label: "Tournaments" },
  ];

  if (pageLoading) {
    return (
      <div id="payment-page" className="hpv-page payment-page">
        <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="hpv-container payment-container flex-center">
          <div className="payment-card text-center slide-up">
            <h2>Đang tải thông tin...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !tournament) {
    return (
      <div id="payment-page" className="hpv-page payment-page">
        <MainHeader user={sessionUser} onLogout={handleLogout} currentPath={location.pathname} menuItems={menuItems} />
        <div className="hpv-container payment-container flex-center">
          <div className="payment-card text-center slide-up">
            <h2 className="payment-error-title">Lỗi</h2>
            <p>{errorMsg}</p>
            <div className="mt-4">
              <button className="btn-secondary" onClick={() => navigate('/tournaments/public')}>Quay lại danh sách</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionUser && (tournament || paramTournamentId)) {
    return (
      <div id="payment-page" className="hpv-page payment-page">
        <MainHeader
          user={sessionUser}
          onLogout={handleLogout}
          currentPath={location.pathname}
          menuItems={menuItems}
        />
        <div className="hpv-container payment-container flex-center">
          <div className="payment-card text-center slide-up">
            <h2>Đăng ký giải đấu</h2>
            <p>Bạn cần đăng nhập để đăng ký giải.</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login', { state: { from: location.pathname, tournamentId: paramTournamentId } })}>
              Đăng nhập
            </button>
            <button className="btn-secondary" style={{ marginTop: '12px', marginLeft: '8px' }} onClick={() => navigate('/tournaments/public')}>
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="payment-page" className="hpv-page payment-page">
      <MainHeader
        user={sessionUser}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={menuItems}
      />
      <div className="hpv-container payment-container">
      <div className="payment-layout">

        <div className="payment-left">
          <button type="button" className="payment-back" onClick={() => navigate(-1)}>
            ❮ Quay lại trang trước
          </button>

          <div className="payment-card slide-up delay-1">
            <h2>
              <svg className="icon-svg text-blue" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Giải đấu đăng ký
            </h2>
            <div className="flex-row">
              <img
                src={"https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"}
                alt="tournament"
                className="tournament-img"
              />
              <div className="flex-column" style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px' }}>{tournament.tournamentName}</h3>
                <div style={{ marginBottom: '8px' }}>
                  <span className="glass-pill">{tournament.format}</span>
                  <span className="glass-pill">{tournament.status}</span>
                </div>
                <span className="text-sm font-bold text-blue">Mã: T-{tournament.tournamentId}</span>
              </div>
              <div className="text-right" style={{ minWidth: '100px' }}>
                <div className="text-xs text-gray mb-2">Lệ phí:</div>
                {hasFee ? (
                  <div className="text-red font-bold text-xl">{actualFee.toLocaleString()}đ</div>
                ) : (
                  <div className="text-green font-bold">Miễn phí</div>
                )}
              </div>
            </div>
          </div>

          <div className="payment-card slide-up delay-2">
            <h2>Thông tin kỳ thủ</h2>
            {submitError && (
              <>
                <div className="payment-form-error">{submitError}</div>
                {submitError.includes("Số dư ví không đủ") && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleTopupRedirect}
                    >
                      Nạp tiền vào ví
                    </button>
                  </div>
                )}
              </>
            )}
            <div className="grid-2">
              <div>
                <label className="text-xs font-semibold text-gray">HỌ VÀ TÊN</label>
                <input type="text" className="input-premium" value={form.fullName} onChange={e => handleFormChange('fullName', e.target.value)} placeholder="Họ và tên" />
                {formErrors.fullName && <span className="payment-field-error">{formErrors.fullName}</span>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray">USERNAME / TÊN IN-GAME</label>
                <input type="text" className="input-premium" value={form.username} onChange={e => handleFormChange('username', e.target.value)} placeholder="Username" />
                {formErrors.username && <span className="payment-field-error">{formErrors.username}</span>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray">SỐ ĐIỆN THOẠI</label>
                <input type="text" className="input-premium" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} placeholder="SĐT" />
                {formErrors.phone && <span className="payment-field-error">{formErrors.phone}</span>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray">EMAIL</label>
                <input type="email" className="input-premium" value={form.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="Email" />
                {formErrors.email && <span className="payment-field-error">{formErrors.email}</span>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray">BẬC RANK</label>
                <input type="number" min="0" className="input-premium" value={form.rankAtRegistration} onChange={e => handleFormChange('rankAtRegistration', e.target.value)} placeholder="Rank" />
                {formErrors.rankAtRegistration && <span className="payment-field-error">{formErrors.rankAtRegistration}</span>}
              </div>
            </div>
          </div>

          <div className="payment-card slide-up delay-3">
            <h2>Địa điểm & Thời gian</h2>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p className="text-sm"><strong>Địa điểm:</strong> {tournament.location}</p>
              <p className="text-sm mt-4"><strong>Khai mạc:</strong> {tournament.startDate || "Chưa xác định"}</p>
              <p className="text-sm"><strong>Bế mạc:</strong> {tournament.endDate || "Chưa xác định"}</p>
            </div>
          </div>
        </div>

        <div className="payment-right slide-up delay-2">
          {hasFee ? (
            <>
              <div className="payment-card">
                <h2>Chi tiết thanh toán</h2>
                <div className="flex-between text-sm mb-4">
                  <span className="text-gray">Lệ phí tham gia</span>
                  <span className="font-semibold">{actualFee.toLocaleString()}đ</span>
                </div>
                <div className="section-divider"></div>
                <div className="flex-between">
                  <div>
                    <div className="text-sm font-bold">Tổng thanh toán</div>
                    <div className="text-xs text-gray">Đã bao gồm thuế & phí</div>
                  </div>
                  <div className="price-final">{actualFee.toLocaleString()}đ</div>
                </div>
              </div>

              <div className="payment-card">
                <h2 className="payment-method-title">Phương thức thanh toán</h2>
                <div className={`radio-option ${paymentMethod === 'WALLET' ? 'selected' : ''}`} onClick={() => setPaymentMethod('WALLET')}>
                  <input type="radio" checked={paymentMethod === 'WALLET'} readOnly />
                  <div className="method-icon-box" style={{ background: '#0284c7', color: 'white' }}>Ví</div>
                  <div style={{ flex: 1 }}>
                     <div className="flex-between text-sm">
                        <span className="font-semibold" style={{ color: "#334155" }}>Ví CTMS của tôi</span>
                        <span className="font-bold text-blue">{(sessionUser?.balance || 0).toLocaleString()}đ</span>
                     </div>
                    <div className="text-xs text-gray mt-1">Trừ trực tiếp vào số dư ví</div>
                  </div>
                </div>
                <p className="payment-has-fee-msg" style={{ marginTop: '12px', marginBottom: '16px' }}>
                  Hệ thống sẽ trừ trực tiếp <strong>{actualFee.toLocaleString()}đ</strong> từ ví của bạn.
                </p>
                <button onClick={handleSubmitPaid} disabled={loading} className={loading ? 'btn-loading' : 'btn-primary'}>
                  {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ NGAY"}
                </button>
                {((sessionUser?.balance || 0) < actualFee) && (
                   <div style={{ marginTop: '12px', textAlign: 'center' }}>
                       <span style={{ color: "red", fontSize: "13px" }}>Số dư không đủ. </span>
                       <span style={{ color: "#2563eb", fontSize: "13px", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }} onClick={handleTopupRedirect}>Nạp thêm tiền</span>
                   </div>
                )}
              </div>
            </>
          ) : (
            <div className="payment-card">
              <h2>Đăng ký tham gia</h2>
              <p className="payment-no-fee-msg" style={{ marginBottom: '16px' }}>
                Giải này không yêu cầu lệ phí. Điền thông tin bên trái và nhấn <strong>Đăng ký ngay</strong> để tham gia.
              </p>
              <button onClick={handleSubmitFree} disabled={loading} className={loading ? 'btn-loading' : 'btn-primary'}>
                {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ NGAY"}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default PaymentPage;
