import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";

/**
 * Admin: xem system report (TechnicalIssue / Other) — staff đã xác thực / toàn bộ theo filter.
 */
export default function AdminSystemReports() {
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const loadReports = async (overrideStatus) => {
    const status = overrideStatus ?? statusFilter;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await axios
        .get(`${API_BASE}/api/admin/reports?${params.toString()}`, {
          withCredentials: true,
        })
        .catch(() => null);
      if (res?.status === 401 || res?.status === 403) {
        setError("Bạn không có quyền xem (chỉ Admin).");
        setItems([]);
        return;
      }
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError("Không thể tải danh sách report.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

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
        return type || "—";
    }
  };

  return (
    <div style={{ padding: "0 8px" }}>
      <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14 }}>
        Các report loại <strong>System</strong> (lỗi hệ thống). Staff xác nhận
        hợp lệ sẽ có trạng thái <strong>Resolved</strong> — Admin xem và xử lý
        tiếp theo nghiệp vụ.
      </p>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: 13, fontWeight: 600 }}>Lọc trạng thái:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            const next = e.target.value;
            setStatusFilter(next);
            loadReports(next);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <option value="">Tất cả</option>
          <option value="Pending">Đang chờ</option>
          <option value="Investigating">Đang điều tra</option>
          <option value="Resolved">Đã xác thực hợp lệ </option>
          <option value="Dismissed">Staff từ chối</option>
        </select>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: "#b91c1c" }}>{error}</div>
      ) : items.length === 0 ? (
        <div>Chưa có system report nào.</div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 12 }}>ID</th>
                <th style={{ textAlign: "left", padding: 12 }}>Loại</th>
                <th style={{ textAlign: "left", padding: 12 }}>Reporter</th>
                <th style={{ textAlign: "left", padding: 12 }}>Mô tả</th>
                <th style={{ textAlign: "left", padding: 12 }}>Bằng chứng</th>
                <th style={{ textAlign: "left", padding: 12 }}>Trạng thái</th>
                <th style={{ textAlign: "left", padding: 12 }}>
                  Ghi chú Staff
                </th>
                <th style={{ textAlign: "left", padding: 12 }}>Tạo lúc</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.reportId} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 12 }}>{r.reportId}</td>
                  <td style={{ padding: 12 }}>{typeLabel(r.type)}</td>
                  <td style={{ padding: 12 }}>{r.reporterId ?? "—"}</td>
                  <td style={{ padding: 12, maxWidth: 280 }}>
                    {r.description?.length > 120
                      ? `${r.description.slice(0, 120)}…`
                      : r.description}
                  </td>
                  <td style={{ padding: 12 }}>
                    {r.evidenceUrl ? (
                      <a href={r.evidenceUrl} target="_blank" rel="noreferrer">
                        Xem
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: 12 }}>{r.status}</td>
                  <td style={{ padding: 12, maxWidth: 200 }}>
                    {r.note || "—"}
                  </td>
                  <td style={{ padding: 12 }}>{formatTime(r.createAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
