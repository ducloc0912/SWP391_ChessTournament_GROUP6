import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../config/api";
import MainHeader from "../../component/common/MainHeader";
import "./BlogPage.css";

export default function BlogPage() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch user context if available (you might have a global state, but parsing from session via an API or checking localStorage)
        // We can just fetch user if needed. Passing user to MainHeader. For simplicity, might just send what we know or let MainHeader handle.
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) { }
        }
        fetchPublicBlogs();
    }, []);

    const fetchPublicBlogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/public/blogs`, { withCredentials: true });
            setBlogs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <div className="blog-page-container" style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
            <MainHeader user={user} onLogout={handleLogout} currentPath="/blog" />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1e293b' }}>Tin Tức & Chiến Thuật</h1>
                {loading ? (
                    <div style={{ textAlign: 'center' }}>Đang tải...</div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>Chưa có bài viết nào được công khai.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {blogs.map(blog => (
                            <div key={blog.blogPostId} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate(`/blog/${blog.blogPostId}`)} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                {blog.thumbnailUrl ? (
                                    <img src={blog.thumbnailUrl} alt={blog.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                                ) : (
                                    <div style={{ width: '100%', height: '180px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No Image</div>
                                )}
                                <div style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: '4px' }}>{blog.categories}</span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{blog.views || 0} views</span>
                                    </div>
                                    <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: '#0f172a' }}>{blog.title}</h3>
                                    <p style={{ fontSize: '14px', color: '#475569', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
