import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../config/api";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/BlogPage.css";

const formatDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN");
};

export default function BlogPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const canManageBlog = role === "STAFF" || role === "TOURNAMENTLEADER";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
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
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="blog-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath={location.pathname} />

      <main className="blog-main">
        <section className="blog-hero">
          <div className="blog-hero-inner">
            <div>
              <h1 className="blog-hero-title">NEWS</h1>
              <p className="blog-hero-subtitle">
                Tin tức, chiến thuật và cập nhật mới nhất từ nền tảng giải đấu cờ vua.
              </p>
            </div>
            {canManageBlog && (
              <button
                className="blog-hero-manage-btn"
                type="button"
                onClick={() => navigate("/blog/manage")}
              >
                Quản lý bài viết
              </button>
            )}
          </div>
        </section>

        <section className="blog-section">
          <div className="blog-container">
            {loading ? (
              <div className="blog-empty">Đang tải bài viết...</div>
            ) : blogs.length === 0 ? (
              <div className="blog-empty">Chưa có bài viết public.</div>
            ) : (
              <div className="blog-grid">
                {blogs.map((blog) => {
                  const dateLabel = formatDate(blog.publishAt || blog.createAt);
                  return (
                    <article
                      key={blog.blogPostId}
                      className="blog-card"
                      onClick={() => navigate(`/blog/${blog.blogPostId}`)}
                    >
                      <div className="blog-card-media">
                        {blog.thumbnailUrl ? (
                          <img
                            src={blog.thumbnailUrl}
                            alt={blog.title}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="blog-card-placeholder">NO IMAGE</div>
                        )}
                      </div>
                      <div className="blog-card-body">
                        <div className="blog-card-meta">
                          <span className="blog-card-category">{blog.categories}</span>
                          <span className="blog-card-date">{dateLabel}</span>
                        </div>
                        <h2 className="blog-card-title">{blog.title}</h2>
                        <p className="blog-card-summary">{blog.summary}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


