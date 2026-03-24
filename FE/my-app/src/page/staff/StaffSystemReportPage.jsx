import React, { useEffect, useState } from "react";
import axios from "axios";
import MainHeader from "../../component/common/MainHeader";
import { API_BASE } from "../../config/api";

export default function StaffSystemReportPage() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const loadReports = async (overrideStatus) => {
    const status = overrideStatus ?? statusFilter;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (status) {
        params.set("status", status);
      }

      const res = await axios.get(
        `${API_BASE}/api/staff/reports?${params.toString()}`,
        {
          withCredentials: true,
        },
      );

      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể tải danh sách system report.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDecision = async (reportId, valid) => {
    const note = window.prompt(
      valid
        ? "Nhập ghi chú/kết quả xử lý (hiển thị trong note):"
        : "Nhập lý do từ chối report:",
      "",
    );

    if (note === null) {
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/api/staff/reports`,
        { reportId, valid, note },
        { withCredentials: true },
      );

      await loadReports();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể cập nhật trạng thái system report.";
      alert(msg);
    }
  };

  const formatTime = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString("vi-VN");
    } catch {
      return String(value);
    }
  };

  const typeLabel = (type) => {
    switch (type) {
      case "TechnicalIssue":
        return "Lỗi kỹ thuật";
      case "Other":
        return "Khác";
      default:
        return type || "Khác";
    }
  };

  return (
    <div className="tll-page">
      <MainHeader
        user={user}
        onLogout={() => {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setUser(null);
          window.location.href = "/login";
        }}
        currentPath="/staff/reports"
        menuItems={[
          { to: "/home", label: "Home" },
          { to: "/staff/dashboard", label: "Staff Dashboard" },
        ]}
      />

      <div className="tll-shell" style={{ padding: 24 }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.12)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>System Reports</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Danh sách report về lỗi hệ thống mà staff cần xử lý.
              </p>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const next = e.target.value;
                  setStatusFilter(next);
                  loadReports(next);
                }}
              >
                <option value="Pending">Đang chờ xử lý</option>
                <option value="Investigating">Đang điều tra</option>
                <option value="Resolved">Đã xử lý</option>
                <option value="Dismissed">Đã từ chối</option>
                <option value="">Tất cả trạng thái</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div>Đang tải danh sách report...</div>
          ) : error ? (
            <div>{error}</div>
          ) : items.length === 0 ? (
            <div>Chưa có system report nào.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Loại</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Reporter</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Mô tả</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Evidence</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Status</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Note</th>
                    <th style={{ textAlign: "left", padding: 8 }}>Tạo lúc</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((r) => (
                    <tr key={r.reportId}>
                      <td style={{ padding: 8 }}>{r.reportId}</td>
                      <td style={{ padding: 8 }}>{typeLabel(r.type)}</td>
                      <td style={{ padding: 8 }}>{r.reporterId ?? "—"}</td>
                      <td style={{ padding: 8 }}>
                        {r.description?.length > 80
                          ? `${r.description.slice(0, 80)}…`
                          : r.description}
                      </td>
                      <td style={{ padding: 8 }}>
                        {r.evidenceUrl ? (
                          <a
                            href={r.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Xem
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: 8 }}>{r.status}</td>
                      <td style={{ padding: 8 }}>{r.note || "—"}</td>
                      <td style={{ padding: 8 }}>{formatTime(r.createAt)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        {r.status === "Pending" ||
                        r.status === "Investigating" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleDecision(r.reportId, true)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "none",
                                background: "#16a34a",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Hợp lệ
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDecision(r.reportId, false)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "none",
                                background: "#dc2626",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span>Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}