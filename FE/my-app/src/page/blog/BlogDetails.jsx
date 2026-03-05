import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../config/api";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import "../../assets/css/BlogPage.css";

const formatDetailDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
};

const formatBannerDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
};

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const fetchRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
    if (fetchRef.current !== id) {
      fetchRef.current = id;
      fetchBlogDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBlogDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/public/blogs?action=detail&id=${id}`, {
        withCredentials: true,
      });
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
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const renderContent = () => {
    if (!blog?.content) return null;
    let parsed = [];
    try {
      parsed = JSON.parse(blog.content);
      if (!Array.isArray(parsed)) throw new Error("not array");
    } catch {
      parsed = [{ type: "text", value: blog.content }];
    }
    return parsed.map((block, idx) => {
      if (block.type === "text") {
        return (
          <p key={idx} className="blog-detail-body-p">
            {block.value}
          </p>
        );
      }
      if (block.type === "image") {
        return (
          <img
            key={idx}
            src={block.value}
            alt=""
            className="blog-detail-body-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        );
      }
      return null;
    });
  };

  return (
    <div className="hpv-page blog-detail-page">
      <MainHeader user={user} onLogout={handleLogout} currentPath="/blog" />

      <main className="blog-detail-main">
        {loading ? (
          <div className="blog-detail-loading">Đang tải...</div>
        ) : error ? (
          <div className="blog-detail-error">{error}</div>
        ) : blog ? (
          <>
            {/* Full-width banner: thumbnail của bài (hoặc nền tối + ngày nếu không có ảnh) */}
            <header className={`blog-detail-banner ${blog.thumbnailUrl ? "blog-detail-banner-has-thumb" : ""}`}>
              {blog.thumbnailUrl ? (
                <img src={blog.thumbnailUrl} alt="" className="blog-detail-banner-thumb" onError={(e) => { e.target.style.display = "none"; }} />
              ) : null}
              <div className="blog-detail-banner-bg" />
              <div className="blog-detail-banner-content">
                <span className="blog-detail-banner-date">
                  {formatBannerDate(blog.publishAt || blog.createAt)}
                </span>
              </div>
            </header>

            {/* Content section - homepage background */}
            <section className="blog-detail-content">
              <div className="blog-detail-container">
                <button type="button" className="blog-detail-back" onClick={() => navigate("/blog")}>
                  ← Quay lại
                </button>

                <article className="blog-detail-article">
                  <div className="blog-detail-meta">
                    <span className="blog-detail-meta-date">
                      {formatDetailDate(blog.publishAt || blog.createAt)}
                    </span>
                    <span className="blog-detail-meta-author">
                      {blog.authorName || "CHESS ARENA"}
                    </span>
                  </div>

                  <h1 className="blog-detail-title">{blog.title}</h1>
                  {blog.summary && (
                    <p className="blog-detail-subtitle">{blog.summary}</p>
                  )}

                  {blog.thumbnailUrl && (
                    <img
                      src={blog.thumbnailUrl}
                      alt=""
                      className="blog-detail-thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <div className="blog-detail-body">
                    {renderContent()}
                  </div>

                  {blog.images && blog.images.length > 0 && (
                    <div className="blog-detail-gallery">
                      {blog.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.imageUrl}
                          alt=""
                          className="blog-detail-gallery-img"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
