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
                    <div className="payment-result-card payment-result-card-new glass-card slide-up">

                        {status === 'processing' && (
                            <div className="payment-result-body payment-result-processing">
                                <div className="loading-spinner" />
                                <h2 className="payment-result-title">Đang xử lý giao dịch</h2>
                                <p className="payment-result-desc">{message}</p>
                                <div className="payment-result-progress">
                                    <div className="payment-result-progress-bar" />
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="payment-result-body payment-result-success fade-in">
                                <div className="payment-result-icon payment-result-icon-success">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="payment-result-title">Thanh toán thành công</h2>
                                <p className="payment-result-desc">{message}</p>
                                <div className="payment-result-accent payment-result-accent-success" />
                                <div className="payment-result-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate(tournamentId ? `/tournaments/public/${tournamentId}` : '/tournaments/public')}
                                        className="payment-result-btn payment-result-btn-red"
                                    >
                                        Trở về trang chi tiết giải
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="payment-result-body payment-result-error fade-in">
                                <div className="payment-result-icon payment-result-icon-error">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h2 className="payment-result-title">Thanh toán thất bại</h2>
                                <p className="payment-result-desc">{message}</p>
                                <div className="payment-result-accent payment-result-accent-error" />
                                <div className="payment-result-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="payment-result-btn payment-result-btn-red"
                                    >
                                        Thử lại
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
