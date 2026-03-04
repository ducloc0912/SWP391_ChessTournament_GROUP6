import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../../assets/css/HomePage.css';
import '../../assets/css/payment/Payment.css';
import { API_BASE } from '../../config/api';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Hệ thống đang xác thực dữ liệu giao dịch từ VNPay...');
    const [tournamentId, setTournamentId] = useState(null);

    useEffect(() => {
        // Thu thập tất cả param trả về từ VNPay
        const params = {};
        for (const [key, value] of searchParams.entries()) {
            params[key] = value;
        }

        if (Object.keys(params).length === 0) {
            setStatus('error');
            setMessage('Không tìm thấy thông tin giao dịch truyền về.');
            return;
        }

        // Gửi nguyên query string từ VNPay lên backend để xác minh chữ ký (tránh lệch encoding)
        const verifyPayment = async () => {
            try {
                const queryString = window.location.search || '?' + new URLSearchParams(params).toString();
                const response = await fetch(`${API_BASE}/api/vnpay/vnpay-return${queryString}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Thanh toán thành công! Bạn đã hoàn tất đăng ký giải. Chúc bạn thi đấu tốt.');
                    const orderInfo = searchParams.get('vnp_OrderInfo') || '';
                    const match = orderInfo.match(/_CTMS_(\d+)_(\d+)/);
                    if (match) setTournamentId(parseInt(match[2], 10));
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Thanh toán không hợp lệ hoặc đã bị hủy.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Lỗi khi kết nối với máy chủ xác minh giao dịch CTMS.');
                console.error("Error verifying payment:", error);
            }
        };

        setTimeout(verifyPayment, 1500); // Thêm 1 chút delay để animation mượt mà
    }, [searchParams]);

    return (
        <div id="payment-result-page" className="hpv-page payment-result-page">
            <div className="hpv-hero payment-result-hero">
                <div className="hpv-hero-overlay" />
                <div className="hpv-container flex-center">
                    <div className="payment-result-card glass-card slide-up">

                        {status === 'processing' && (
                            <div className="space-y-6 flex flex-col items-center fade-in">
                                <div className="loading-spinner" />
                                <div>
                                    <h2 className="text-2xl font-black text-gray-50 mb-2">
                                        Đang xử lý giao dịch
                                    </h2>
                                    <p className="text-gray-200 font-medium text-sm px-4 leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                                <div className="w-full bg-slate-800/60 rounded-full h-1.5 mt-4 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-1.5 rounded-full w-24 animate-pulse" />
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-6 fade-in">
                                <div className="status-icon-container success mx-auto">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">
                                        Thanh toán thành công
                                    </h2>
                                    <p className="text-slate-200 font-medium">
                                        {message}
                                    </p>
                                </div>

                                <div className="payment-result-summary">
                                    <div className="summary-row">
                                        <span>Mã giao dịch</span>
                                        <strong>{searchParams.get('vnp_TxnRef') || 'N/A'}</strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>Số tiền</span>
                                        <strong className="text-emerald-400">
                                            {searchParams.get('vnp_Amount')
                                                ? (parseInt(searchParams.get('vnp_Amount')) / 100).toLocaleString('vi-VN') + 'đ'
                                                : 'N/A'}
                                        </strong>
                                    </div>
                                    <div className="summary-row">
                                        <span>Ngân hàng</span>
                                        <strong>{searchParams.get('vnp_BankCode') || 'N/A'}</strong>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col gap-3">
                                    {tournamentId && (
                                        <button
                                            onClick={() => navigate(`/tournaments/public/${tournamentId}`)}
                                            className="hpv-btn hpv-btn-primary w-full"
                                        >
                                            Xem chi tiết giải đấu
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate('/home')}
                                        className="hpv-btn hpv-btn-outline w-full"
                                    >
                                        Về Trang Chủ Giải Đấu
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-6 fade-in">
                                <div className="status-icon-container error mx-auto">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">
                                        Thanh toán thất bại
                                    </h2>
                                    <p className="text-slate-200 font-medium">{message}</p>
                                </div>

                                <div className="pt-6 flex gap-4 flex-col sm:flex-row">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="hpv-btn hpv-btn-outline flex-1"
                                    >
                                        Thử lại
                                    </button>
                                    <button
                                        onClick={() => navigate('/home')}
                                        className="hpv-btn hpv-btn-primary flex-1"
                                    >
                                        Trang chủ
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;
