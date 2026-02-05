import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/css/StaffDashboard.css';
import StatusBadge from '../../component/staff/StatusBadge';
import StatsCard from '../../component/staff/StatsCard';

import {
    FileText, Search, CheckCircle, Eye, Filter,
    ChevronDown, ChevronUp, XCircle, Save, Plus, RotateCcw, Edit3
} from 'lucide-react';

const StaffBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
        content: '', 
        thumbnailUrl: '', 
        categories: 'Strategy',
        status: 'Draft' 
    };
    const [newBlog, setNewBlog] = useState(initialBlogState);

    // --- Filter States ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchBlogs();
    }, []);

    // Reset states khi mở modal xem chi tiết
    useEffect(() => {
        if (selectedBlog) {
            setUpdateStatus('');
            setIsEditing(false);
            setEditData({
                title: selectedBlog.title || '',
                summary: selectedBlog.summary || '',
                content: selectedBlog.content || '',
                thumbnailUrl: selectedBlog.thumbnailUrl || '',
                categories: selectedBlog.categories || 'Strategy',
                status: selectedBlog.status || 'Draft'
            });
        }
    }, [selectedBlog]);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:8080/ctms/api/staff/blogs", { withCredentials: true });
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

        const updatedBlogData = {
            ...selectedBlog,
            title: editData.title,
            summary: editData.summary,
            content: editData.content,
            thumbnailUrl: editData.thumbnailUrl,
            categories: editData.categories,
            status: updateStatus || selectedBlog.status
        };

        try {
            await axios.post(
                "http://localhost:8080/ctms/api/staff/blogs?action=update", 
                updatedBlogData, 
                { withCredentials: true }
            );
            alert("Cập nhật bài viết thành công!");
            setSelectedBlog(null);
            setIsEditing(false);
            fetchBlogs(); 
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
            await axios.post(
                "http://localhost:8080/ctms/api/staff/blogs?action=update", 
                updatedBlogData, 
                { withCredentials: true }
            );
            alert("Cập nhật trạng thái thành công!");
            setSelectedBlog(null);
            fetchBlogs(); 
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

        const payload = {
            ...newBlog,
            status: 'Draft'
        };

        try {
            await axios.post("http://localhost:8080/ctms/api/staff/blogs?action=create", payload, { withCredentials: true });
            alert("Tạo bài viết thành công!");
            setShowCreateModal(false);
            setNewBlog(initialBlogState);
            fetchBlogs();
        } catch(e) { 
            console.error(e);
            alert("Lỗi tạo bài viết. Vui lòng thử lại."); 
        }
    };

    const publicCount = blogs.filter(b => b.status === 'Public').length;
    const isDraft = selectedBlog?.status === 'Draft';

    return (
        <div className="staff-container">
            {/* Stats Cards */}
            <div className="stats-grid">
                <StatsCard title="Tổng bài viết" value={blogs.length} icon={<FileText size={22} />} type="total" />
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
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px'}}>Đang tải...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>Không có bài viết nào</td></tr>
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
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '650px'}}>
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
                        
                        <div className="modal-body" style={{maxHeight: '65vh', overflowY: 'auto'}}>
                            {/* Chế độ xem hoặc chỉnh sửa */}
                            {!isEditing ? (
                                <>
                                    {/* Read-only Info */}
                                    <div className="modal-section">
                                        {selectedBlog.thumbnailUrl && (
                                            <img 
                                                src={selectedBlog.thumbnailUrl} 
                                                alt="Thumbnail" 
                                                style={{width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px'}} 
                                                onError={(e) => e.target.style.display = 'none'} 
                                            />
                                        )}
                                        <p><strong>Danh mục:</strong> {selectedBlog.categories}</p>
                                        <p><strong>Tóm tắt:</strong> {selectedBlog.summary || 'Chưa có'}</p>
                                        <div className="content-preview" style={{marginTop: '12px', whiteSpace: 'pre-wrap'}}>
                                            {selectedBlog.content || 'Chưa có nội dung'}
                                        </div>
                                    </div>

                                    {/* Nút chỉnh sửa cho Draft */}
                                    {isDraft && (
                                        <button 
                                            className="btn-primary" 
                                            style={{width: '100%', marginBottom: '16px'}}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit3 size={18} /> Chỉnh sửa bài viết
                                        </button>
                                    )}

                                    {/* Update Status Area */}
                                    <div className="modal-section update-status-area" style={{borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
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
                                            style={{width: '100%'}}
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
                                        <label>Ảnh bìa (URL) <span style={{color: '#64748b', fontWeight: 'normal'}}>(Thumbnail)</span></label>
                                        <input 
                                            className="form-control" 
                                            type="text" 
                                            value={editData.thumbnailUrl} 
                                            onChange={e => setEditData({...editData, thumbnailUrl: e.target.value})} 
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {editData.thumbnailUrl && (
                                            <div style={{marginTop: '10px'}}>
                                                <img 
                                                    src={editData.thumbnailUrl} 
                                                    alt="Preview" 
                                                    style={{width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px'}} 
                                                    onError={(e) => e.target.style.display='none'} 
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Tiêu đề <span style={{color:'#ef4444'}}>*</span></label>
                                        <input 
                                            className="form-control" 
                                            type="text" 
                                            value={editData.title} 
                                            onChange={e => setEditData({...editData, title: e.target.value})} 
                                            placeholder="Nhập tiêu đề..." 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Danh mục</label>
                                        <select 
                                            className="form-control" 
                                            value={editData.categories} 
                                            onChange={e => setEditData({...editData, categories: e.target.value})}
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
                                            onChange={e => setEditData({...editData, summary: e.target.value})} 
                                            style={{minHeight:'80px'}} 
                                            placeholder="Mô tả ngắn về bài viết..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Nội dung</label>
                                        <textarea 
                                            className="form-control" 
                                            value={editData.content} 
                                            onChange={e => setEditData({...editData, content: e.target.value})} 
                                            style={{minHeight:'150px'}} 
                                            placeholder="Nội dung bài viết..."
                                        />
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
                        <div className="modal-body" style={{maxHeight: '65vh', overflowY: 'auto'}}>
                            
                            <div className="form-group">
                                <label>Ảnh bìa (URL)</label>
                                <input 
                                    className="form-control" 
                                    type="text" 
                                    value={newBlog.thumbnailUrl} 
                                    onChange={e => setNewBlog({...newBlog, thumbnailUrl: e.target.value})} 
                                    placeholder="https://example.com/image.jpg"
                                />
                                {newBlog.thumbnailUrl && (
                                    <div style={{marginTop: '10px'}}>
                                        <img 
                                            src={newBlog.thumbnailUrl} 
                                            alt="Preview" 
                                            style={{width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px'}} 
                                            onError={(e) => e.target.style.display='none'} 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Tiêu đề <span style={{color:'#ef4444'}}>*</span></label>
                                <input 
                                    className="form-control" 
                                    type="text" 
                                    value={newBlog.title} 
                                    onChange={e => setNewBlog({...newBlog, title: e.target.value})} 
                                    placeholder="Nhập tiêu đề..." 
                                />
                            </div>

                            <div className="form-group">
                                <label>Danh mục</label>
                                <select 
                                    className="form-control" 
                                    value={newBlog.categories} 
                                    onChange={e => setNewBlog({...newBlog, categories: e.target.value})}
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
                                    onChange={e => setNewBlog({...newBlog, summary: e.target.value})} 
                                    style={{minHeight:'80px'}} 
                                    placeholder="Mô tả ngắn về bài viết..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Nội dung</label>
                                <textarea 
                                    className="form-control" 
                                    value={newBlog.content} 
                                    onChange={e => setNewBlog({...newBlog, content: e.target.value})} 
                                    style={{minHeight:'150px'}} 
                                    placeholder="Nội dung bài viết..."
                                />
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
