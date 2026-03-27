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
    <div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(15,23,42,0.12)",
          borderRadius: "8px",
          padding: "24px",
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
                fontSize: 13,
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Đang chờ</option>
              <option value="Resolved">Đã xác thực hợp lệ</option>
              <option value="Dismissed">Staff từ chối</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
            Đang tải...
          </div>
        ) : error ? (
          <div style={{ padding: 20, textAlign: "center", color: "#b91c1c" }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
            Chưa có system report nào.
          </div>
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
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    ID
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Loại
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Người tố cáo
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Mô tả
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Bằng chứng
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Trạng thái
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Ghi chú Staff
                  </th>
                  <th
                    style={{ textAlign: "left", padding: 12, fontWeight: 600 }}
                  >
                    Tạo lúc
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.reportId}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: 12 }}>{r.reportId}</td>
                    <td style={{ padding: 12 }}>{typeLabel(r.type)}</td>
                    <td style={{ padding: 12 }}>{r.reporterUsername ?? "—"}</td>
                    <td style={{ padding: 12, maxWidth: 280 }}>
                      {r.description?.length > 120
                        ? `${r.description.slice(0, 120)}…`
                        : r.description}
                    </td>
                    <td style={{ padding: 12 }}>
                      {r.evidenceUrl ? (
                        <a
                          href={r.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#2563eb",
                            textDecoration: "underline",
                          }}
                        >
                          Xem
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background:
                            r.status === "Resolved"
                              ? "#dcfce7"
                              : r.status === "Dismissed"
                                ? "#fee2e2"
                                : "#fef3c7",
                          color:
                            r.status === "Resolved"
                              ? "#166534"
                              : r.status === "Dismissed"
                                ? "#991b1b"
                                : "#854d0e",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
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
    </div>
  );
}
