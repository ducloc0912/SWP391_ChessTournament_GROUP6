import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import StaffBlog from "../staff/StaffBlog";
import "../../assets/css/HomePage.css";

const BlogManagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let parsedUser = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setUser(parsedUser);

    const r = (localStorage.getItem("role") || "").toUpperCase();
    setRole(r);
    if (r !== "STAFF" && r !== "TOURNAMENTLEADER") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <div id="home-page" className="hpv-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      <section className="hpv-section">
        <div className="hpv-container">
          <div className="hpv-section-head hpv-row-head">
            <h2>MANAGE BLOG</h2>
            <p>Viết, chỉnh sửa và công khai các bài viết cho nền tảng.</p>
          </div>
          <StaffBlog user={user} role={role} />
        </div>
      </section>
    </div>
  );
};

export default BlogManagePage;

