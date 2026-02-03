import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/css/StaffDashboard.css';
import StatusBadge from '../../component/staff/StatusBadge';
import StatsCard from '../../component/staff/StatsCard';

import {
    FileText, Search, CheckCircle, Eye, Filter,
    ChevronDown, ChevronUp, XCircle, Save, Plus, RotateCcw
} from 'lucide-react';

const StaffBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State cho Modal "View & Update" ---
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [updateStatus, setUpdateStatus] = useState('');

    // --- State cho Modal "Create" ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const initialBlogState = {
        title: '', 
        slug: '', 
        summary: '', 
        content: '', 
        thumbnail_url: '', 
        categories: 'Strategy', // Default category
        status: 'Draft' 
    };
    const [newBlog, setNewBlog] = useState(initialBlogState);

    // --- Filter States ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All'); // <--- State mới cho Filter Category
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchBlogs();
    }, []);

    // Reset updateStatus khi mở modal xem chi tiết
    useEffect(() => {
        if (selectedBlog) {
            setUpdateStatus(''); 
        }
    }, [selectedBlog]);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:8080/ctms/api/staff/blog-posts", { withCredentials: true });
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
        setCategoryFilter('All'); // Reset category về All
        setSortOrder('desc');
    };

    // --- Logic Filter & Sort (Đã cập nhật thêm Category) ---
    const filteredData = blogs.filter(item => {
        // 1. Tìm kiếm theo tên
        const matchesSearch = (item.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Lọc theo trạng thái
        const matchesStatus = statusFilter === 'All' ? true : item.status === statusFilter;
        
        // 3. Lọc theo danh mục (Category)
        const matchesCategory = categoryFilter === 'All' ? true : item.categories === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
        return sortOrder === 'asc' 
            ? (a.title || '').localeCompare(b.title || '') 
            : (b.title || '').localeCompare(a.title || '');
    });

    // --- Xử lý Cập nhật Status ---
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
            await axios.put(
                "http://localhost:8080/ctms/api/staff/blog-posts", 
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
        if (!newBlog.title || !newBlog.slug) {
            alert("Vui lòng nhập tiêu đề và slug.");
            return;
        }

        const payload = {
            ...newBlog,
            status: 'Draft' // Luôn là Draft khi tạo mới
        };

        try {
             await axios.post("http://localhost:8080/ctms/api/staff/blog-posts", payload, { withCredentials: true });
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
                
                {/* --- PHẦN FILTER ĐƯỢC BỔ SUNG --- */}
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
                        
                        {/* Filter theo Category */}
                        <div className="filter-group">
                            <label>Danh mục</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="All">Tất cả danh mục</option>
                                <option value="Strategy">Chiến thuật (Strategy)</option>
                                <option value="News">Tin tức (News)</option>
                                <option value="Guides">Hướng dẫn (Guides)</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sắp xếp tiêu đề</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="asc">A &rarr; Z</option>
                                <option value="desc">Z &rarr; A</option>
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
                        {filteredData.map(item => (
                            <tr key={item.blog_post_id}>
                                <td>
                                    <div className="item-meta">
                                        <div className="item-icon"><FileText size={18} /></div>
                                        <div className="item-info">
                                            <span className="item-title">{item.title}</span>
                                            <span className="item-sub">{item.slug}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><StatusBadge status={item.categories} /></td>
                                <td><StatusBadge status={item.status} /></td>
                                <td>{item.views}</td>
                                <td>
                                    <button className="view-btn" onClick={() => setSelectedBlog(item)} title="Xem & Cập nhật">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL VIEW & UPDATE STATUS --- */}
            {selectedBlog && (
                <div className="modal-overlay" onClick={() => setSelectedBlog(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{selectedBlog.title}</h2>
                                <StatusBadge status={selectedBlog.status} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedBlog(null)}><XCircle size={24} /></button>
                        </div>
                        
                        <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                            {/* Read-only Info */}
                            <div className="modal-section">
                                {selectedBlog.thumbnail_url && (
                                    <img 
                                        src={selectedBlog.thumbnail_url} 
                                        alt="Thumbnail" 
                                        style={{width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px'}} 
                                        onError={(e) => e.target.style.display = 'none'} 
                                    />
                                )}
                                <p><strong>Slug:</strong> {selectedBlog.slug}</p>
                                <p><strong>Danh mục:</strong> {selectedBlog.categories}</p>
                                <p><strong>Tóm tắt:</strong> {selectedBlog.summary}</p>
                                <div className="content-preview" style={{background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginTop: '10px', whiteSpace: 'pre-wrap'}}>
                                    {selectedBlog.content}
                                </div>
                            </div>

                            {/* Update Action Area */}
                            <div className="modal-section update-status-area" style={{marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px'}}>
                                <h3>Cập nhật trạng thái</h3>
                                <div className="form-group">
                                    <label>Chọn trạng thái mới:</label>
                                    <select 
                                        className="form-control"
                                        value={updateStatus} 
                                        onChange={(e) => setUpdateStatus(e.target.value)}
                                        style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                                    >
                                        <option value="">-- Giữ nguyên trạng thái hiện tại --</option>
                                        <option value="Draft">Bản nháp (Draft)</option>
                                        <option value="Public">Công khai (Public)</option>
                                        <option value="Private">Riêng tư (Private)</option>
                                    </select>
                                </div>
                                <button 
                                    className="btn-primary" 
                                    style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '8px'}}
                                    onClick={handleUpdateStatus}
                                >
                                    <Save size={18} /> Lưu thay đổi
                                </button>
                            </div>
                        </div>
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
                        <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                            
                            {/* Tiêu đề & Slug */}
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Tiêu đề <span style={{color:'red'}}>*</span></label>
                                <input className="form-control" type="text" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} style={{width:'100%', padding:'8px'}} placeholder="Nhập tiêu đề..." />
                            </div>
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Slug (URL) <span style={{color:'red'}}>*</span></label>
                                <input className="form-control" type="text" value={newBlog.slug} onChange={e => setNewBlog({...newBlog, slug: e.target.value})} style={{width:'100%', padding:'8px'}} placeholder="vi-du-tieu-de" />
                            </div>

                            {/* Dropdown Danh mục */}
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Danh mục</label>
                                <select 
                                    className="form-control" 
                                    value={newBlog.categories} 
                                    onChange={e => setNewBlog({...newBlog, categories: e.target.value})} 
                                    style={{width:'100%', padding:'8px'}}
                                >
                                    <option value="Strategy">Chiến thuật (Strategy)</option>
                                    <option value="News">Tin tức (News)</option>
                                    <option value="Guides">Hướng dẫn (Guides)</option>
                                </select>
                            </div>

                            {/* Ảnh bìa URL */}
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Ảnh bìa (URL)</label>
                                <input 
                                    className="form-control" 
                                    type="text" 
                                    value={newBlog.thumbnail_url} 
                                    onChange={e => setNewBlog({...newBlog, thumbnail_url: e.target.value})} 
                                    style={{width:'100%', padding:'8px'}} 
                                    placeholder="https://example.com/image.jpg"
                                />
                                {newBlog.thumbnail_url && (
                                    <div style={{marginTop: '5px', fontSize: '12px', color: '#666'}}>
                                        Preview: <br/>
                                        <img src={newBlog.thumbnail_url} alt="Preview" style={{height: '50px', marginTop: '5px', borderRadius: '4px'}} onError={(e) => e.target.style.display='none'} />
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Tóm tắt</label>
                                <textarea className="form-control" value={newBlog.summary} onChange={e => setNewBlog({...newBlog, summary: e.target.value})} style={{width:'100%', minHeight:'60px', padding: '8px'}} />
                            </div>
                            <div className="form-group" style={{marginBottom: '10px'}}>
                                <label style={{fontWeight: 'bold'}}>Nội dung</label>
                                <textarea className="form-control" value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} style={{width:'100%', minHeight:'150px', padding: '8px'}} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)} style={{marginRight: '10px'}}>Hủy</button>
                            <button className="btn-primary" onClick={handleCreateBlog}>Lưu bài viết (Draft)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffBlog;