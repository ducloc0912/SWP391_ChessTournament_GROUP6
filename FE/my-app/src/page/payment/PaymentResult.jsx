import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
        <div className="payment-container flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-10 text-center slide-up">

                {status === 'processing' && (
                    <div className="space-y-6 flex flex-col items-center fade-in">
                        <div className="loading-spinner"></div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">Đang xử lý giao dịch</h2>
                            <p className="text-gray-500 font-medium text-sm px-4 leading-relaxed">{message}</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
                            <div className="bg-blue-500 h-1.5 rounded-full w-24 animate-pulse"></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 fade-in">
                        <div className="status-icon-container bg-green-100 text-green-500 mx-auto w-24 h-24 mb-4 shadow-lg shadow-green-500/20 border-4 border-white">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Thành Công!</h2>
                            <p className="text-gray-600 font-medium">{message}</p>
                        </div>

                        <div className="bg-gray-50/80 rounded-xl p-4 my-6 text-sm text-left border border-gray-100">
                            <p className="flex justify-between mb-2"><span className="text-gray-500">Mã giao dịch:</span> <span className="font-bold text-gray-800">{searchParams.get('vnp_TxnRef') || 'N/A'}</span></p>
                            <p className="flex justify-between mb-2"><span className="text-gray-500">Số tiền:</span> <span className="font-bold text-green-600">{searchParams.get('vnp_Amount') ? (parseInt(searchParams.get('vnp_Amount')) / 100).toLocaleString() + 'đ' : 'N/A'}</span></p>
                            <p className="flex justify-between"><span className="text-gray-500">Ngân hàng:</span> <span className="font-bold text-gray-800">{searchParams.get('vnp_BankCode') || 'N/A'}</span></p>
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            {tournamentId && (
                                <button
                                    onClick={() => navigate(`/tournaments/public/${tournamentId}`)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all"
                                >
                                    Xem chi tiết giải đấu
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Về Trang Chủ Giải Đấu
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 fade-in">
                        <div className="status-icon-container bg-red-100 text-red-500 mx-auto w-24 h-24 mb-4 shadow-lg shadow-red-500/20 border-4 border-white">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Thanh Toán Thất Bại</h2>
                            <p className="text-gray-600 font-medium">{message}</p>
                        </div>

                        <div className="pt-6 flex gap-4 flex-col sm:flex-row">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-xl transition-all"
                            >
                                Thử Lại
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                Trang Chủ
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PaymentResult;
