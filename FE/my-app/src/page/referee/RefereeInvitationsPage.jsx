import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import "../../assets/css/HomePage.css";
import { API_BASE } from "../../config/api";

const RefereeInvitationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const role = (localStorage.getItem("role") || "").toUpperCase();
    if (role !== "REFEREE") {
      navigate("/home", { replace: true });
      return;
    }
    if (!user) return;
    const fetchInvites = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/referee/invitations`, {
          withCredentials: true,
        });
        setInvites(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setInvites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvites();
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  const role = (localStorage.getItem("role") || "").toUpperCase();

  return (
    <div id="home-page" className="hpv-page">
      <MainHeader
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        menuItems={[
          { to: "/home", label: "Home" },
          ...(role === "REFEREE" ? [{ to: "/referee/invitations", label: "Invitations" }] : []),
          { to: "/tournaments/public", label: "Tournaments" },
        ]}
      />

      <section className="hpv-section hpv-light">
        <div className="hpv-container">
          <div className="hpv-section-head">
            <h2>REFEREE INVITATIONS</h2>
            <p>Các lời mời làm trọng tài đang chờ bạn xác nhận.</p>
          </div>

          {loading ? (
            <div className="hpv-empty-card">Đang tải lời mời...</div>
          ) : invites.length === 0 ? (
            <div className="hpv-empty-card">Hiện bạn không có lời mời trọng tài nào.</div>
          ) : (
            <div className="hpv-latest-grid">
              {invites.map((inv) => (
                <article key={inv.invitationId} className="hpv-latest-card">
                  <div className="hpv-latest-body">
                    <div className="hpv-meta-line">
                      <span>{inv.refereeRole || "Assistant"}</span>
                      <span>{inv.tournamentName || "Tournament"}</span>
                    </div>
                    <h3>Lời mời trọng tài</h3>
                    <p>
                      Bạn được mời làm trọng tài cho giải "{inv.tournamentName}". Nhấn chấp nhận để tham gia với
                      vai trò {inv.refereeRole || "Assistant"}.
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        className="hpv-btn hpv-btn-primary"
                        onClick={async () => {
                          try {
                            await axios.post(
                              `${API_BASE}/api/referee/invitations?action=accept&invitationId=${inv.invitationId}`,
                              null,
                              { withCredentials: true },
                            );
                            setInvites((prev) => prev.filter((x) => x.invitationId !== inv.invitationId));
                            alert("Đã chấp nhận lời mời trọng tài.");
                          } catch (err) {
                            alert(err?.response?.data?.message || "Không thể chấp nhận lời mời.");
                          }
                        }}
                      >
                        Chấp nhận
                      </button>
                      <button
                        className="hpv-btn hpv-btn-primary"
                        onClick={async () => {
                          if (!window.confirm("Bạn chắc chắn muốn từ chối lời mời này?")) return;
                          try {
                            await axios.post(
                              `${API_BASE}/api/referee/invitations?action=reject&invitationId=${inv.invitationId}`,
                              null,
                              { withCredentials: true },
                            );
                            setInvites((prev) => prev.filter((x) => x.invitationId !== inv.invitationId));
                            alert("Bạn đã từ chối lời mời.");
                          } catch (err) {
                            alert(err?.response?.data?.message || "Không thể từ chối lời mời.");
                          }
                        }}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RefereeInvitationsPage;

