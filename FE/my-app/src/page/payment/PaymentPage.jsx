import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import '../../assets/css/payment/Payment.css';
import axios from 'axios';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Lấy ID từ router state (navigate) hoặc từ URL
  const paramTournamentId = location.state?.tournamentId || searchParams.get('tournamentId');
  const paramParticipantId = location.state?.participantId || searchParams.get('participantId') || 3; // Mặc định 3 để test nếu không có

  // Lấy User từ Session (AuthContext)
  const sessionUserStr = sessionStorage.getItem("user");
  const sessionUser = sessionUserStr ? JSON.parse(sessionUserStr) : null;

  const [tournament, setTournament] = useState(null);
  const [user] = useState({
    id: sessionUser?.userId || 1,
    full_name: sessionUser?.fullName || "Khách quen",
    phone: sessionUser?.phone || "0900000000",
    email: sessionUser?.email || "guest@example.com"
  });

  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch dữ liệu giải đấu
  useEffect(() => {
    if (!paramTournamentId) {
      setErrorMsg("Không tìm thấy thông tin Giải đấu cần thanh toán. Vui lòng quay lại danh sách giải đấu.");
      setPageLoading(false);
      return;
    }

    const fetchTournament = async () => {
      try {
        // Sử dụng API lấy chi tiết giải đấu như trang TournamentDetail
        const res = await axios.get(`http://localhost:8080/ctms/api/tournaments?id=${paramTournamentId}`, {
          withCredentials: true,
        });
        if (res.data) {
          setTournament(res.data);
        } else {
          setErrorMsg("Không thể lấy dữ liệu giải đấu từ máy chủ.");
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("Lỗi khi kết nối máy chủ để lấy thông tin giải đấu.");
      } finally {
        setPageLoading(false);
      }
    };
    fetchTournament();
  }, [paramTournamentId]);

  const handlePayment = async () => {
    if (paymentMethod !== 'VNPAY') {
      alert("Chức năng chỉ đang hỗ trợ VNPAY lúc này.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/ctms/api/vnpay/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: tournament.prizePool || 500000, // CSDL của bạn có prize_pool/entry_fee, dùng trường cho đúng
          userId: user.id,
          tournamentId: tournament.tournamentId,
          participantId: paramParticipantId
        })
      });

      const data = await response.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Có lỗi xảy ra: " + (data.message || "Không thể lấy payment URL"));
        setLoading(false);
      }

    } catch (error) {
      console.error("Lỗi khi tạo payment:", error);
      alert("Lỗi kết nối đến máy chủ.");
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="payment-container flex-center">
        <div className="glass-card text-center slide-up">
          <h2>Đang tải thông tin thanh toán...</h2>
        </div>
      </div>
    );
  }

  if (errorMsg || !tournament) {
    return (
      <div className="payment-container flex-center">
        <div className="glass-card text-center slide-up">
          <h2 className="text-red">Lỗi</h2>
          <p>{errorMsg}</p>
          <div className="mt-4">
            <button className="btn-secondary" onClick={() => navigate('/tournaments')}>Quay lại danh sách</button>
          </div>
        </div>
      </div>
    );
  }

  // Tùy chỉnh giá tiền (Trong TournamentEntity không có entry_fee mà thường là lệ phí, tôi giả định lấy prizePool/10 hoặc số cố định tuỳ logic của bạn)
  const actualFee = 500000;

  return (
    <div className="payment-container">
      <div className="payment-layout">

        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
        <div className="payment-left">
          <button
            style={{ marginBottom: '20px', background: 'transparent', border: 'none', color: '#0066cc', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => navigate(-1)}
          >
            ❮ Quay lại trang trước
          </button>

          {/* Section 1: Thông tin giải đấu */}
          <div className="glass-card slide-up delay-1">
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
                <div className="flex-center" style={{ justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <span className="price-original">600.000đ</span>
                  <span className="price-discount">-16%</span>
                </div>
                <div className="text-red font-bold text-xl">{actualFee.toLocaleString()}đ</div>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin người đăng ký */}
          <div className="glass-card slide-up delay-2">
            <h2>Thông tin kỳ thủ</h2>
            <div className="grid-2">
              <div>
                <label className="text-xs font-semibold text-gray">HỌ VÀ TÊN</label>
                <input type="text" className="input-premium" defaultValue={user.full_name} readOnly />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray">SỐ ĐIỆN THOẠI</label>
                <input type="text" className="input-premium" defaultValue={user.phone} readOnly />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="text-xs font-semibold text-gray">EMAIL LƯU TRỮ</label>
                <input type="email" className="input-premium" defaultValue={user.email} readOnly />
              </div>
            </div>
          </div>

          {/* Section 3: Địa điểm */}
          <div className="glass-card slide-up delay-3">
            <h2>Địa điểm & Thời gian</h2>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p className="text-sm"><strong>Địa điểm:</strong> {tournament.location}</p>
              <p className="text-sm mt-4"><strong>Khai mạc:</strong> {tournament.startDate || "Chưa xác định"}</p>
              <p className="text-sm"><strong>Bế mạc:</strong> {tournament.endDate || "Chưa xác định"}</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TỔNG KẾT & THANH TOÁN */}
        <div className="payment-right slide-up delay-2">

          {/* Box Tổng tiền */}
          <div className="glass-card">
            <h2>Chi tiết thanh toán</h2>

            <div className="flex-between text-sm mb-4">
              <span className="text-gray">Lệ phí cơ bản</span>
              <span className="font-semibold">600.000đ</span>
            </div>
            <div className="flex-between text-sm mb-4 text-green">
              <span>Khuyến mãi</span>
              <span className="font-semibold">-100.000đ</span>
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

          {/* Box Chọn phương thức */}
          <div className="glass-card">
            <h2 className="text-sm text-gray" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Phương thức thanh toán</h2>

            <div className="radio-option disabled">
              <input type="radio" disabled />
              <div className="method-icon-box method-red">QR</div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold">VietQR (PayOS)</div>
                <div className="text-xs text-red">Đang bảo trì</div>
              </div>
            </div>

            <div className={`radio-option ${paymentMethod === 'VNPAY' ? 'selected' : ''}`} onClick={() => setPaymentMethod('VNPAY')}>
              <input type="radio" checked={paymentMethod === 'VNPAY'} readOnly />
              <div className="method-icon-box method-blue">VNP</div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold">Thanh toán VNPay</div>
                <div className="text-xs text-gray">ATM / Visa / Master / JCB</div>
              </div>
            </div>

            <div className="radio-option disabled">
              <input type="radio" disabled />
              <div className="method-icon-box method-orange">Ví</div>
              <div style={{ flex: 1 }}>
                <div className="text-sm font-semibold">Ví hệ thống</div>
                <div className="text-xs text-red">Đang bảo trì</div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className={loading ? 'btn-loading' : 'btn-primary'}
              style={{ marginTop: '20px' }}
            >
              {loading ? "ĐANG TIẾN HÀNH..." : "THANH TOÁN NGAY"}
            </button>

            <div className="text-center mt-4 text-xs text-gray font-semibold text-gray">
              HỖ TRỢ BỞI VNPAY
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
