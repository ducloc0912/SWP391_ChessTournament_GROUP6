import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, Trash2, CheckCircle2 } from "lucide-react";

const API_BASE = "http://localhost:8080/ctms";

function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 560px)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 14,
          padding: 22,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function WaitingList() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [banner, setBanner] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [rankFilter, setRankFilter] = useState("");

  const fetchList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/waiting-list`, {
        params: { tournamentId: id },
        withCredentials: true,
      });
      setRows(res.data?.data || []);
    } catch (err) {
      setRows([]);
    }
  };

  const fetchTournamentName = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tournaments`, {
        params: { id },
        withCredentials: true,
      });
      setTournamentName(res.data?.tournamentName);
    } catch (err) {
      setTournamentName(`Tournament #${id}`);
    }
  };

  useEffect(() => {
    fetchTournamentName();
    fetchList();
  }, [id]);

  const handleApprove = async (row) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/waiting-list?id=${row.waitingId}&action=approve`,
        {},
        {
          withCredentials: true,
        },
      );
      await fetchList();
      setBanner({
        type: "success",
        text: res?.data?.message || "Duyệt thành công",
      });
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.response?.data?.message || "Duyệt thất bại",
      });
    }
  };

  const removeRow = async (row) => {
    try {
      const res = await axios.delete(
        `${API_BASE}/api/waiting-list?id=${row.waitingId}`,
        {
          withCredentials: true,
        },
      );
      await fetchList();
      setBanner({
        type: "success",
        text: res?.data?.message || "Xóa thành công",
      });
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.response?.data?.message || "Xóa thất bại",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await removeRow(deleteTarget);
    setDeleteTarget(null);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (String(row.status || "").toLowerCase() === "approved") return false;
      const email = (row.registrationEmail || "").toLowerCase();
      const matchesEmail = email.includes(searchEmail.trim().toLowerCase());
      const rank = Number(row.rankAtRegistration ?? 0);
      const matchesRank = (() => {
        if (!rankFilter) return true;
        if (rankFilter === "lt1000") return rank < 1000;
        if (rankFilter === "1000-1199") return rank >= 1000 && rank <= 1199;
        if (rankFilter === "1200-1399") return rank >= 1200 && rank <= 1399;
        if (rankFilter === "1400-1599") return rank >= 1400 && rank <= 1599;
        if (rankFilter === "ge1600") return rank >= 1600;
        return true;
      })();
      return matchesEmail && matchesRank;
    });
  }, [rows, searchEmail, rankFilter]);

  const thStyle = {
    textAlign: "left",
    padding: "12px 10px",
    fontSize: 13,
    color: "#334155",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
    fontSize: 14,
    verticalAlign: "middle",
  };

  const actionBtnBase = {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "1px solid #dbeafe",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const getStatusStyle = (rawStatus) => {
    const status = String(rawStatus || "").toLowerCase();
    if (status === "pending") {
      return {
        color: "#92400e",
        background: "#fef3c7",
        border: "1px solid #fcd34d",
      };
    }
    if (status === "approved") {
      return {
        color: "#065f46",
        background: "#d1fae5",
        border: "1px solid #6ee7b7",
      };
    }
    return {
      color: "#1f2937",
      background: "#f3f4f6",
      border: "1px solid #d1d5db",
    };
  };

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Danh sách chờ - {tournamentName}</h2>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#64748b", fontSize: 14 }}>
          Theo dõi và xử lý các đăng ký đang chờ duyệt của giải đấu.
        </p>

        {banner && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              color: banner.type === "success" ? "#065f46" : "#991b1b",
              backgroundColor: banner.type === "success" ? "#d1fae5" : "#fee2e2",
              border: `1px solid ${banner.type === "success" ? "#6ee7b7" : "#fca5a5"}`,
            }}
          >
            {banner.text}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Tìm theo email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            style={{
              width: 320,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "9px 12px",
              outline: "none",
              background: "#fff",
            }}
          />
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "9px 12px",
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="">Tất cả mốc rank</option>
            <option value="lt1000">Dưới 1000</option>
            <option value="1000-1199">1000 - 1199</option>
            <option value="1200-1399">1200 - 1399</option>
            <option value="1400-1599">1400 - 1599</option>
            <option value="ge1600">Từ 1600 trở lên</option>
          </select>
          <button
            onClick={() => {
              setSearchEmail("");
              setRankFilter("");
            }}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: 10,
              padding: "9px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Xóa lọc
          </button>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
          }}
        >
          <table width="100%" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Họ và tên</th>
                <th style={thStyle}>Tên in-game</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>SĐT</th>
                <th style={thStyle}>Rank</th>
                <th style={thStyle}>Thời điểm đăng ký</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={9}>Chưa có người chơi nào.</td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.waitingId}
                    style={{ background: idx % 2 === 0 ? "#ffffff" : "#fcfdff" }}
                  >
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{row.registrationFullName || "-"}</td>
                    <td style={tdStyle}>{row.registrationUsername || "-"}</td>
                    <td style={tdStyle}>{row.registrationEmail || "-"}</td>
                    <td style={tdStyle}>{row.registrationPhone || "-"}</td>
                    <td style={tdStyle}>{row.rankAtRegistration ?? "-"}</td>
                    <td style={tdStyle}>
                      {row.registrationDate
                        ? new Date(row.registrationDate).toLocaleString("vi-VN")
                        : "-"}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...getStatusStyle(row.status),
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {row.status || "-"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          title="Xem"
                          onClick={() => setSelected(row)}
                          style={{
                            ...actionBtnBase,
                            borderColor: "#93c5fd",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Xóa"
                          onClick={() => setDeleteTarget(row)}
                          style={{
                            ...actionBtnBase,
                            borderColor: "#fca5a5",
                            background: "#fef2f2",
                            color: "#dc2626",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          title="Duyệt"
                          onClick={() => handleApprove(row)}
                          style={{
                            ...actionBtnBase,
                            borderColor: "#86efac",
                            background: "#f0fdf4",
                            color: "#16a34a",
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 16,
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              borderRadius: 10,
              padding: "9px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Quay lại
          </button>
        </div>
      </div>

      <Modal
        open={!!deleteTarget}
        title="Xác nhận xóa đăng ký"
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Bạn có chắc chắn muốn xóa đăng ký của{" "}
              <b>{deleteTarget.registrationFullName}</b> khỏi danh sách chờ
              không?
            </p>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  borderRadius: 8,
                  padding: "9px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "9px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!selected}
        title="Thông tin người chơi"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div>
            <div style={{ display: "grid", gap: 10 }}>
              <p style={{ margin: 0 }}>
                <b>Họ và tên:</b> {selected.registrationFullName}
              </p>
              <p style={{ margin: 0 }}>
                <b>Tên in-game:</b> {selected.registrationUsername}
              </p>
              <p style={{ margin: 0 }}>
                <b>Email:</b> {selected.registrationEmail}
              </p>
              <p style={{ margin: 0 }}>
                <b>SĐT:</b> {selected.registrationPhone}
              </p>
              <p style={{ margin: 0 }}>
                <b>Rank:</b> {selected.rankAtRegistration ?? "-"}
              </p>
              <p style={{ margin: 0 }}>
                <b>Trạng thái:</b> {selected.status}
              </p>
              <p style={{ margin: 0 }}>
                <b>Ghi chú:</b> {selected.note || "-"}
              </p>
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
