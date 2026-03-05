import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../assets/css/StaffDashboard.css';
import { API_BASE } from '../../config/api';
import StatusBadge from '../../component/staff/StatusBadge';
import StatsCard from '../../component/staff/StatsCard';

import {
    FileText, Search, CheckCircle, Eye, Filter,
    ChevronDown, ChevronUp, XCircle, Save, Plus, RotateCcw, Edit3, Upload, Image
} from 'lucide-react';

const StaffBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(''); // 'STAFF' | 'TOURNAMENTLEADER' | ...

    // --- State cho Modal "View & Update" ---
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [updateStatus, setUpdateStatus] = useState('');

    // --- State cho Modal "Create" ---
    const [showCreateModal, setShowCreateModal] = useState(false);

    const initialBlogState = {
        title: '',
        summary: '',
        contentBlocks: [{ type: 'text', value: '' }],
        thumbnailUrl: '',
        categories: 'Strategy',
        status: 'Draft'
    };
    const [newBlog, setNewBlog] = useState(initialBlogState);

    // helper: convert local file to base64
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    // helper: handle thumbnail file pick
    const handleThumbnailFileEdit = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setEditData(prev => ({ ...prev, thumbnailUrl: base64 }));
    };
    const handleThumbnailFileCreate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setNewBlog(prev => ({ ...prev, thumbnailUrl: base64 }));
    };

    // helper: handle image block file pick
    const handleImageBlockFileEdit = async (e, idx) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        const newBlocks = [...editData.contentBlocks];
        newBlocks[idx] = { ...newBlocks[idx], value: base64 };
        setEditData(prev => ({ ...prev, contentBlocks: newBlocks }));
    };
    const handleImageBlockFileCreate = async (e, idx) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        const newBlocks = [...newBlog.contentBlocks];
        newBlocks[idx] = { ...newBlocks[idx], value: base64 };
        setNewBlog(prev => ({ ...prev, contentBlocks: newBlocks }));
    };

    // --- Filter States ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        // Lấy role từ session để phân quyền hiển thị
        axios.get(`${API_BASE}/api/profile/me`, { withCredentials: true })
            .then(res => {
                if (res.data && res.data.role) {
                    setUserRole(res.data.role.toUpperCase());
                }
            })
            .catch(() => { });
        fetchBlogs();
    }, []);



    // Reset states khi mở modal xem chi tiết
    useEffect(() => {
        if (selectedBlog) {
            setUpdateStatus('');
            setIsEditing(false);

            let parsedBlocks = [];
            try {
                parsedBlocks = JSON.parse(selectedBlog.content);
                if (!Array.isArray(parsedBlocks)) throw new Error('not array');
            } catch (e) {
                parsedBlocks = [{ type: 'text', value: selectedBlog.content || '' }];
            }

            // merge legacy images if they exist and parsedBlocks has no images
            const hasLegacyImages = selectedBlog.images && selectedBlog.images.length > 0;
            if (hasLegacyImages && !parsedBlocks.some(b => b.type === 'image')) {
                selectedBlog.images.forEach(img => {
                    parsedBlocks.push({ type: 'image', value: img.imageUrl });
                });
            }

            setEditData({
                title: selectedBlog.title || '',
                summary: selectedBlog.summary || '',
                contentBlocks: parsedBlocks,
                thumbnailUrl: selectedBlog.thumbnailUrl || '',
                categories: selectedBlog.categories || 'Strategy',
                status: selectedBlog.status || 'Draft'
            });
        }
    }, [selectedBlog]);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/staff/blogs`, { withCredentials: true });
            setBlogs(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Logic Reset Filter ---
    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setCategoryFilter('All');
        setSortOrder('desc');
    };

    // --- Logic Filter & Sort ---
    const filteredData = blogs.filter(item => {
        const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' ? true : item.categories === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
        return sortOrder === 'asc'
            ? (a.title || '').localeCompare(b.title || '')
            : (b.title || '').localeCompare(a.title || '');
    });

    // --- Xử lý Cập nhật Blog (Full Edit cho Draft) ---
    const handleSaveEdit = async () => {
        if (!selectedBlog || !editData.title) {
            alert("Vui lòng nhập tiêu đề.");
            return;
        }

        const extractedImages = editData.contentBlocks
            .filter(b => b.type === 'image' && b.value)
            .map(b => ({ imageUrl: b.value }));

        const updatedBlogData = {
            ...selectedBlog,
            title: editData.title,
            summary: editData.summary,
            content: JSON.stringify(editData.contentBlocks),
            thumbnailUrl: editData.thumbnailUrl,
            categories: editData.categories,
            status: updateStatus || selectedBlog.status,
            images: extractedImages
        };

        try {
            const res = await axios.post(
                `${API_BASE}/api/staff/blogs?action=update`,
                updatedBlogData,
                { withCredentials: true }
            );
            if (res.data.success) {
                alert("Cập nhật bài viết thành công!");
                setSelectedBlog(null);
                setIsEditing(false);
                fetchBlogs();
            } else {
                alert("Lỗi: " + (res.data.message || "Không thể cập nhật bài viết."));
            }
        } catch (error) {
            console.error("Update failed", error);
            alert("Cập nhật thất bại. Vui lòng kiểm tra lại.");
        }
    };

    // --- Xử lý Cập nhật Status (Chỉ đổi status) ---
    const handleUpdateStatus = async () => {
        if (!selectedBlog) return;
        if (!updateStatus) {
            alert("Vui lòng chọn trạng thái mới.");
            return;
        }

        const updatedBlogData = {
            ...selectedBlog,
            status: updateStatus
        };

        try {
            const res = await axios.post(
                `${API_BASE}/api/staff/blogs?action=update`,
                updatedBlogData,
                { withCredentials: true }
            );
            if (res.data.success) {
                alert("Cập nhật trạng thái thành công!");
                setSelectedBlog(null);
                fetchBlogs();
            } else {
                alert("Lỗi: " + (res.data.message || "Không thể cập nhật trạng thái."));
            }
        } catch (error) {
            console.error("Update failed", error);
            alert("Cập nhật thất bại. Vui lòng kiểm tra lại kết nối.");
        }
    };

    // --- Xử lý Tạo bài viết mới ---
    const handleCreateBlog = async () => {
        if (!newBlog.title) {
            alert("Vui lòng nhập tiêu đề.");
            return;
        }

        const extractedImages = newBlog.contentBlocks
            .filter(b => b.type === 'image' && b.value)
            .map(b => ({ imageUrl: b.value }));

        const payload = {
            ...newBlog,
            content: JSON.stringify(newBlog.contentBlocks),
            images: extractedImages,
            status: 'Draft'
        };
        delete payload.contentBlocks;

        try {
            const res = await axios.post(`${API_BASE}/api/staff/blogs?action=create`, payload, { withCredentials: true });
            if (res.data.success) {
                alert("Tạo bài viết thành công!");
                setShowCreateModal(false);
                setNewBlog(initialBlogState);
                fetchBlogs();
            } else {
                alert("Lỗi: " + (res.data.message || "Không thể tạo bài viết."));
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi tạo bài viết. Vui lòng thử lại.");
        }
    };

    const publicCount = blogs.filter(b => b.status === 'Public').length;
    const isDraft = selectedBlog?.status === 'Draft';
    const isLeaderRole = userRole === 'TOURNAMENTLEADER';

    return (
        <div className="staff-container">
            {/* Stats Cards */}
            <div className="stats-grid">
                <StatsCard
                    title={isLeaderRole ? 'Bài viết của tôi' : 'Tổng bài viết'}
                    value={blogs.length}
                    icon={<FileText size={22} />}
                    type="total"
                />
                <StatsCard title="Công khai (Public)" value={publicCount} icon={<CheckCircle size={22} />} type="active" />
                <StatsCard title="Lượt xem" value={blogs.reduce((a, b) => a + (b.views || 0), 0)} icon={<Eye size={22} />} type="pending" />
            </div>

            {/* Controls */}
            <div className="controls-section">
                <div className="controls-top-bar">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input type="text" placeholder="Tìm kiếm bài viết..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="action-group">
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} /> Viết bài mới
                        </button>
                        <button className="reset-btn" onClick={handleResetFilters} title="Reset Filters">
                            <RotateCcw size={18} />
                        </button>
                        <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={18} /> Bộ lọc {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Trạng thái</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="All">Tất cả</option>
                                <option value="Public">Công khai (Public)</option>
                                <option value="Private">Riêng tư (Private)</option>
                                <option value="Draft">Bản nháp (Draft)</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Danh mục</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="All">Tất cả danh mục</option>
                                <option value="Strategy">Chiến thuật (Strategy)</option>
                                <option value="News">Tin tức (News)</option>
                                <option value="Guide">Hướng dẫn (Guide)</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sắp xếp tiêu đề</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="asc">A → Z</option>
                                <option value="desc">Z → A</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Bài viết</th>
                            <th>Danh mục</th>
                            <th>Trạng thái</th>
                            <th>Lượt xem</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Không có bài viết nào</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.blogPostId}>
                                    <td>
                                        <div className="item-meta">
                                            <div className="item-icon"><FileText size={18} /></div>
                                            <div className="item-info">
                                                <span className="item-title">{item.title}</span>
                                                <span className="item-sub">{item.summary?.substring(0, 50)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><StatusBadge status={item.categories} /></td>
                                    <td><StatusBadge status={item.status} /></td>
                                    <td>{item.views || 0}</td>
                                    <td>
                                        <button className="view-btn" onClick={() => setSelectedBlog(item)} title="Xem & Cập nhật">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL VIEW & UPDATE --- */}
            {selectedBlog && (
                <div className="modal-overlay" onClick={() => { setSelectedBlog(null); setIsEditing(false); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">
                                    {isEditing ? 'Chỉnh sửa bài viết' : selectedBlog.title}
                                </h2>
                                <StatusBadge status={selectedBlog.status} />
                            </div>
                            <button className="close-btn" onClick={() => { setSelectedBlog(null); setIsEditing(false); }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            {/* Chế độ xem hoặc chỉnh sửa */}
                            {!isEditing ? (
                                <>
                                    {/* Read-only Info */}
                                    <div className="modal-section">
                                        {selectedBlog.thumbnailUrl && (
                                            <img
                                                src={selectedBlog.thumbnailUrl}
                                                alt="Thumbnail"
                                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        )}
                                        <p><strong>Danh mục:</strong> {selectedBlog.categories}</p>
                                        <p><strong>Tóm tắt:</strong> {selectedBlog.summary || 'Chưa có'}</p>
                                        <div style={{ marginTop: '12px' }}>
                                            {(() => {
                                                let blocks = [];
                                                try {
                                                    blocks = JSON.parse(selectedBlog.content);
                                                    if (!Array.isArray(blocks)) throw new Error();
                                                } catch {
                                                    blocks = [{ type: 'text', value: selectedBlog.content || 'Chưa có nội dung' }];
                                                }
                                                return blocks.map((block, i) => (
                                                    block.type === 'image'
                                                        ? <img key={i} src={block.value} alt={`Nội dung ${i}`} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} onError={(e) => e.target.style.display = 'none'} />
                                                        : <p key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '12px', lineHeight: '1.7' }}>{block.value}</p>
                                                ));
                                            })()}
                                        </div>
                                    </div>

                                    {/* Nút chỉnh sửa cho Draft */}
                                    {isDraft && (
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', marginBottom: '16px' }}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit3 size={18} /> Chỉnh sửa bài viết
                                        </button>
                                    )}

                                    {/* Update Status Area */}
                                    <div className="modal-section update-status-area" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                        <h4>Cập nhật trạng thái</h4>
                                        <div className="form-group">
                                            <label>Chọn trạng thái mới:</label>
                                            <select
                                                className="form-control"
                                                value={updateStatus}
                                                onChange={(e) => setUpdateStatus(e.target.value)}
                                            >
                                                <option value="">-- Giữ nguyên trạng thái hiện tại --</option>
                                                <option value="Draft">Bản nháp (Draft)</option>
                                                <option value="Public">Công khai (Public)</option>
                                                <option value="Private">Riêng tư (Private)</option>
                                            </select>
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%' }}
                                            onClick={handleUpdateStatus}
                                        >
                                            <Save size={18} /> Lưu trạng thái
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Edit Mode - Full Form */}
                                    <div className="form-group">
                                        <label>Ảnh bìa <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Thumbnail)</span></label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={editData.thumbnailUrl && !editData.thumbnailUrl.startsWith('data:') ? editData.thumbnailUrl : ''}
                                            onChange={e => setEditData({ ...editData, thumbnailUrl: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '14px' }}>
                                            <Upload size={16} /> Chọn ảnh từ máy tính
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbnailFileEdit} />
                                        </label>
                                        {editData.thumbnailUrl && (
                                            <div style={{ marginTop: '10px' }}>
                                                <img
                                                    src={editData.thumbnailUrl}
                                                    alt="Preview"
                                                    style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Tiêu đề <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={editData.title}
                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            placeholder="Nhập tiêu đề..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Danh mục</label>
                                        <select
                                            className="form-control"
                                            value={editData.categories}
                                            onChange={e => setEditData({ ...editData, categories: e.target.value })}
                                        >
                                            <option value="Strategy">Chiến thuật (Strategy)</option>
                                            <option value="News">Tin tức (News)</option>
                                            <option value="Guide">Hướng dẫn (Guide)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Tóm tắt</label>
                                        <textarea
                                            className="form-control"
                                            value={editData.summary}
                                            onChange={e => setEditData({ ...editData, summary: e.target.value })}
                                            style={{ minHeight: '80px' }}
                                            placeholder="Mô tả ngắn về bài viết..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Nội dung bài viết (Khối nội dung)</label>
                                        {editData.contentBlocks && editData.contentBlocks.map((block, idx) => (
                                            <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: '#475569' }}>
                                                        {block.type === 'text' ? 'Đoạn văn bản' : 'Hình ảnh đính kèm'}
                                                    </span>
                                                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }} onClick={() => {
                                                        const newBlocks = [...editData.contentBlocks];
                                                        newBlocks.splice(idx, 1);
                                                        setEditData({ ...editData, contentBlocks: newBlocks });
                                                    }}>Xóa khối này</button>
                                                </div>
                                                {block.type === 'text' ? (
                                                    <textarea
                                                        className="form-control"
                                                        value={block.value}
                                                        onChange={e => {
                                                            const newBlocks = [...editData.contentBlocks];
                                                            newBlocks[idx].value = e.target.value;
                                                            setEditData({ ...editData, contentBlocks: newBlocks });
                                                        }}
                                                        style={{ minHeight: '100px', marginBottom: 0 }}
                                                        placeholder="Nhập nội dung văn bản..."
                                                    />
                                                ) : (
                                                    <div>
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            value={block.value && !block.value.startsWith('data:') ? block.value : ''}
                                                            onChange={e => {
                                                                const newBlocks = [...editData.contentBlocks];
                                                                newBlocks[idx].value = e.target.value;
                                                                setEditData({ ...editData, contentBlocks: newBlocks });
                                                            }}
                                                            placeholder="URL Hình ảnh..."
                                                            style={{ marginBottom: '8px' }}
                                                        />
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>
                                                            <Upload size={14} /> Hoặc chọn ảnh từ máy tính
                                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageBlockFileEdit(e, idx)} />
                                                        </label>
                                                        {block.value && (
                                                            <img src={block.value} alt="preview" style={{ marginTop: '8px', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.style.display = 'none'} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                            <button className="btn-secondary" onClick={() => setEditData({ ...editData, contentBlocks: [...(editData.contentBlocks || []), { type: 'text', value: '' }] })}>
                                                + Thêm văn bản
                                            </button>
                                            <button className="btn-secondary" onClick={() => setEditData({ ...editData, contentBlocks: [...(editData.contentBlocks || []), { type: 'image', value: '' }] })}>
                                                + Thêm hình ảnh
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Trạng thái sau khi lưu</label>
                                        <select
                                            className="form-control"
                                            value={updateStatus || selectedBlog.status}
                                            onChange={(e) => setUpdateStatus(e.target.value)}
                                        >
                                            <option value="Draft">Bản nháp (Draft)</option>
                                            <option value="Public">Công khai (Public)</option>
                                            <option value="Private">Riêng tư (Private)</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer buttons for Edit Mode */}
                        {isEditing && (
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                                    Hủy
                                </button>
                                <button className="btn-primary" onClick={handleSaveEdit}>
                                    <Save size={18} /> Lưu thay đổi
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL CREATE --- */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Viết bài mới</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}><XCircle size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>

                            <div className="form-group">
                                <label>Ảnh bìa</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={newBlog.thumbnailUrl && !newBlog.thumbnailUrl.startsWith('data:') ? newBlog.thumbnailUrl : ''}
                                    onChange={e => setNewBlog({ ...newBlog, thumbnailUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '14px' }}>
                                    <Upload size={16} /> Chọn ảnh bìa từ máy tính
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbnailFileCreate} />
                                </label>
                                {newBlog.thumbnailUrl && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img
                                            src={newBlog.thumbnailUrl}
                                            alt="Preview"
                                            style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px' }}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Tiêu đề <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={newBlog.title}
                                    onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                                    placeholder="Nhập tiêu đề..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Danh mục</label>
                                <select
                                    className="form-control"
                                    value={newBlog.categories}
                                    onChange={e => setNewBlog({ ...newBlog, categories: e.target.value })}
                                >
                                    <option value="Strategy">Chiến thuật (Strategy)</option>
                                    <option value="News">Tin tức (News)</option>
                                    <option value="Guide">Hướng dẫn (Guide)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Tóm tắt</label>
                                <textarea
                                    className="form-control"
                                    value={newBlog.summary}
                                    onChange={e => setNewBlog({ ...newBlog, summary: e.target.value })}
                                    style={{ minHeight: '80px' }}
                                    placeholder="Mô tả ngắn về bài viết..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Nội dung bài viết (Khối nội dung)</label>
                                {newBlog.contentBlocks && newBlog.contentBlocks.map((block, idx) => (
                                    <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '600', color: '#475569' }}>
                                                {block.type === 'text' ? 'Đoạn văn bản' : 'Hình ảnh đính kèm'}
                                            </span>
                                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }} onClick={() => {
                                                const newBlocks = [...newBlog.contentBlocks];
                                                newBlocks.splice(idx, 1);
                                                setNewBlog({ ...newBlog, contentBlocks: newBlocks });
                                            }}>Xóa khối này</button>
                                        </div>
                                        {block.type === 'text' ? (
                                            <textarea
                                                className="form-control"
                                                value={block.value}
                                                onChange={e => {
                                                    const newBlocks = [...newBlog.contentBlocks];
                                                    newBlocks[idx].value = e.target.value;
                                                    setNewBlog({ ...newBlog, contentBlocks: newBlocks });
                                                }}
                                                style={{ minHeight: '100px', marginBottom: 0 }}
                                                placeholder="Nhập nội dung văn bản..."
                                            />
                                        ) : (
                                            <div>
                                                <input
                                                    className="form-control"
                                                    type="text"
                                                    value={block.value && !block.value.startsWith('data:') ? block.value : ''}
                                                    onChange={e => {
                                                        const newBlocks = [...newBlog.contentBlocks];
                                                        newBlocks[idx].value = e.target.value;
                                                        setNewBlog({ ...newBlog, contentBlocks: newBlocks });
                                                    }}
                                                    placeholder="URL Hình ảnh..."
                                                    style={{ marginBottom: '8px' }}
                                                />
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontSize: '13px' }}>
                                                    <Upload size={14} /> Hoặc chọn ảnh từ máy tính
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageBlockFileCreate(e, idx)} />
                                                </label>
                                                {block.value && (
                                                    <img src={block.value} alt="preview" style={{ marginTop: '8px', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }} onError={e => e.target.style.display = 'none'} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button className="btn-secondary" onClick={() => setNewBlog({ ...newBlog, contentBlocks: [...(newBlog.contentBlocks || []), { type: 'text', value: '' }] })}>
                                        + Thêm văn bản
                                    </button>
                                    <button className="btn-secondary" onClick={() => setNewBlog({ ...newBlog, contentBlocks: [...(newBlog.contentBlocks || []), { type: 'image', value: '' }] })}>
                                        + Thêm hình ảnh
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                            <button className="btn-primary" onClick={handleCreateBlog}>
                                <Save size={18} /> Lưu bài viết (Draft)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffBlog;
