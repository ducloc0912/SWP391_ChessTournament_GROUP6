import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../config/api";
import MainHeader from "../../component/common/MainHeader";

export default function BlogDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const fetchRef = React.useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) { }
        }
        if (fetchRef.current !== id) {
            fetchRef.current = id;
            fetchBlogDetail();
        }
    }, [id]);

    const fetchBlogDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/public/blogs?action=detail&id=${id}`, { withCredentials: true });
            setBlog(res.data);
        } catch (err) {
            console.error(err);
            setError("Bài viết không tồn tại hoặc đã bị ẩn.");
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
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <MainHeader user={user} onLogout={handleLogout} currentPath="/blog" />

            <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
                <button onClick={() => navigate('/blog')} style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', fontWeight: '500' }}>
                    &larr; Quay lại
                </button>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
                ) : blog && (
                    <article style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '6px 12px', borderRadius: '6px' }}>{blog.categories}</span>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>{blog.views} lượt xem</span>
                        </div>
                        <h1 style={{ fontSize: '32px', margin: '0 0 16px 0', color: '#0f172a', lineHeight: 1.3 }}>{blog.title}</h1>
                        <p style={{ fontSize: '18px', color: '#475569', marginBottom: '32px', fontStyle: 'italic' }}>{blog.summary}</p>

                        {blog.thumbnailUrl && (
                            <img src={blog.thumbnailUrl} alt={blog.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '32px' }} onError={e => e.target.style.display = 'none'} />
                        )}

                        <div style={{ fontSize: '16px', lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '32px' }}>
                            {(() => {
                                let parsed = [];
                                try {
                                    parsed = JSON.parse(blog.content);
                                    if (!Array.isArray(parsed)) throw new Error('not array');
                                } catch (e) {
                                    parsed = [{ type: 'text', value: blog.content }];
                                }
                                return parsed.map((block, idx) => {
                                    if (block.type === 'text') {
                                        return <p key={idx} style={{ marginBottom: '16px' }}>{block.value}</p>;
                                    } else if (block.type === 'image') {
                                        return <img key={idx} src={block.value} alt={`Block ${idx}`} style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} onError={e => e.target.style.display = 'none'} />;
                                    }
                                    return null;
                                });
                            })()}
                        </div>

                        {blog.images && blog.images.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
                                {blog.images.map((img, idx) => (
                                    <div key={idx} style={{ textAlign: 'center' }}>
                                        <img src={img.imageUrl} alt={`Ảnh đính kèm ${idx + 1}`} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                )}
            </div>
        </div>
    );
}
