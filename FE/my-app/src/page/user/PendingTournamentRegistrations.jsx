import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import MainHeader from "../../component/common/MainHeader";
import { validateRegistrationForm } from "../../utils/registrationValidation";

const API_BASE = "http://localhost:8080/ctms";

export default function PendingTournamentRegistrations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [detailMode, setDetailMode] = useState(null); // "view" | "edit" | null
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    rankAtRegistration: "",
    note: "",
  });

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    const loadPendingRegistrations = async () => {
      if (!currentUser?.userId) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const waitingRes = await axios.get(`${API_BASE}/api/waiting-list`, {
          params: { userId: currentUser.userId },
          withCredentials: true,
        });
        const list = Array.isArray(waitingRes?.data?.data)
          ? waitingRes.data.data
          : [];
        setRows(list);
      } catch (err) {
        setRows([]);
        setError("Không thể tải danh sách chờ duyệt.");
      } finally {
        setLoading(false);
      }
    };

    loadPendingRegistrations();
  }, [currentUser?.userId, navigate]);

  const handleCancelRegistration = async () => {
    if (!confirmTarget) return;
    setCancellingId(confirmTarget.waitingId);
    setFeedback(null);
    try {
      const res = await axios.delete(`${API_BASE}/api/waiting-list`, {
        params: { id: confirmTarget.waitingId },
        withCredentials: true,
      });
      setRows((prev) =>
        prev.filter((x) => x.waitingId !== confirmTarget.waitingId),
      );
      setFeedback({
        type: "success",
        text: res?.data?.message || "Xóa đăng ký thành công.",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Xóa đăng ký thất bại. Vui lòng thử lại.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setCancellingId(null);
      setConfirmTarget(null);
    }
  };

  const fetchRegistrationDetail = async (waitingId) => {
    const res = await axios.get(`${API_BASE}/api/waiting-list`, {
      params: { id: waitingId },
      withCredentials: true,
    });
    return res?.data?.data || null;
  };

  const openViewModal = async (row) => {
    setDetailMode("view");
    setDetailTarget(null);
    setDetailLoading(true);
    try {
      const detail = await fetchRegistrationDetail(row.waitingId);
      setDetailTarget(detail);
    } catch (err) {
      setDetailMode(null);
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Không thể tải chi tiết đăng ký.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = async (row) => {
    setDetailMode("edit");
    setDetailTarget(null);
    setEditErrors({});
    setDetailLoading(true);
    try {
      const detail = await fetchRegistrationDetail(row.waitingId);
      setDetailTarget(detail);
      setEditForm({
        fullName: detail?.registrationFullName || "",
        username: detail?.registrationUsername || "",
        email: detail?.registrationEmail || "",
        phone: detail?.registrationPhone || "",
        rankAtRegistration:
          detail?.rankAtRegistration === null ||
          detail?.rankAtRegistration === undefined
            ? ""
            : String(detail.rankAtRegistration),
        note: detail?.note || "",
      });
    } catch (err) {
      setDetailMode(null);
      setFeedback({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Không thể tải thông tin để chỉnh sửa.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitEdit = async () => {
    if (!detailTarget?.waitingId) return;
    const formErrors = validateRegistrationForm(editForm);
    setEditErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setEditSubmitting(true);
    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        rankAtRegistration:
          editForm.rankAtRegistration === ""
            ? null
            : Number(editForm.rankAtRegistration),
        note: editForm.note.trim() || null,
      };
      const res = await axios.put(`${API_BASE}/api/waiting-list`, payload, {
        params: { id: detailTarget.waitingId },
        withCredentials: true,
      });
      setRows((prev) =>
        prev.map((x) =>
          x.waitingId === detailTarget.waitingId
            ? {
                ...x,
                rankAtRegistration: payload.rankAtRegistration,
                note: payload.note,
              }
            : x,
        ),
      );
      setFeedback({
        type: "success",
        text: res?.data?.message || "Cập nhật đăng ký thành công.",
      });
      setDetailMode(null);
      setDetailTarget(null);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Cập nhật đăng ký thất bại.",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const ActionIconButton = ({ title, color, onClick, children }) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        border: `1px solid ${color}33`,
        background: `${color}12`,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );

  const thStyle = {
    textAlign: "left",
    padding: "12px 10px",
    fontSize: 13,
    color: "#374151",
    fontWeight: 700,
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#111827",
    fontSize: 14,
    verticalAlign: "middle",
  };

  const getStatusBadgeStyle = (statusRaw) => {
    const status = String(statusRaw || "").toLowerCase();
    if (status === "pending") {
      return {
        color: "#92400e",
        background: "#fef3c7",
        border: "1px solid #fcd34d",
      };
    }
    return {
      color: "#1f2937",
      background: "#f3f4f6",
      border: "1px solid #d1d5db",
    };
  };

  return (
    <div>
      <MainHeader
        user={currentUser}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />
      <div
        style={{
          padding: "84px 24px 24px",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <h2 style={{ margin: 0 }}>Các giải đấu đang chờ duyệt</h2>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                color: "#991b1b",
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
              }}
            >
              {error}
            </div>
          )}
          {feedback && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                color: feedback.type === "success" ? "#065f46" : "#991b1b",
                backgroundColor:
                  feedback.type === "success" ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${feedback.type === "success" ? "#6ee7b7" : "#fca5a5"}`,
              }}
            >
              {feedback.text}
            </div>
          )}

          <div
            style={{
              overflowX: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
            }}
          >
            <table
              width="100%"
              style={{ borderCollapse: "separate", borderSpacing: 0 }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>STT</th>
                  <th style={thStyle}>Giải đấu</th>
                  <th style={thStyle}>Format</th>
                  <th style={thStyle}>Địa điểm</th>
                  <th style={thStyle}>Thời điểm đăng ký</th>
                  <th style={thStyle}>Rank đăng ký</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      Đang tải...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td style={tdStyle} colSpan={8}>
                      Hiện tại bạn không có giải đấu nào đang chờ duyệt.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.waitingId}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {row.tournamentName}
                      </td>
                      <td style={tdStyle}>{row.format}</td>
                      <td style={tdStyle}>{row.location}</td>
                      <td style={tdStyle}>
                        {row.registrationDate
                          ? new Date(row.registrationDate).toLocaleString(
                              "vi-VN",
                            )
                          : "-"}
                      </td>
                      <td style={tdStyle}>{row.rankAtRegistration ?? "-"}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            ...getStatusBadgeStyle(row.status),
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
                          <ActionIconButton
                            title="Xem thông tin đăng ký"
                            color="#1d4ed8"
                            onClick={() => openViewModal(row)}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M12 5c5.5 0 9.5 5.4 10.4 6.8a.7.7 0 0 1 0 .4C21.5 13.6 17.5 19 12 19S2.5 13.6 1.6 12.2a.7.7 0 0 1 0-.4C2.5 10.4 6.5 5 12 5Zm0 2C8.2 7 5 10.4 3.8 12 5 13.6 8.2 17 12 17s7-3.4 8.2-5C19 10.4 15.8 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
                            </svg>
                          </ActionIconButton>
                          <ActionIconButton
                            title="Sửa thông tin đăng ký"
                            color="#ca8a04"
                            onClick={() => openEditModal(row)}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M16.9 3.5a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8l-9.8 9.8-4.1.8.8-4.1 9.5-10Zm1.4 2.2-.8-.8L9.3 13l-.3 1.4 1.4-.3 8.2-8.2Z" />
                              <path d="M5 20h14v1.5H5z" />
                            </svg>
                          </ActionIconButton>
                          <ActionIconButton
                            title="Xóa đăng ký"
                            color={
                              cancellingId === row.waitingId
                                ? "#9ca3af"
                                : "#dc2626"
                            }
                            onClick={() => setConfirmTarget(row)}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" />
                            </svg>
                          </ActionIconButton>
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
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => navigate("/home")}
              style={{
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#111827",
                borderRadius: 10,
                padding: "9px 16px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>

      {confirmTarget && (
        <div
          onClick={() => setConfirmTarget(null)}
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
              width: "min(92vw, 520px)",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>
              Xác nhận xóa đăng ký
            </h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Bạn có chắc muốn xóa đăng ký giải{" "}
              <b>{confirmTarget.tournamentName}</b>?
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
                onClick={() => setConfirmTarget(null)}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#111827",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={cancellingId === confirmTarget.waitingId}
                style={{
                  border: "none",
                  background:
                    cancellingId === confirmTarget.waitingId
                      ? "#9ca3af"
                      : "#dc2626",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor:
                    cancellingId === confirmTarget.waitingId
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 600,
                }}
              >
                {cancellingId === confirmTarget.waitingId
                  ? "Đang xóa..."
                  : "Xóa đăng ký"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailMode && (
        <div
          onClick={() => {
            if (!editSubmitting) {
              setDetailMode(null);
              setDetailTarget(null);
            }
          }}
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
              width: "min(92vw, 680px)",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {detailMode === "view"
                ? "Thông tin đã đăng ký"
                : "Chỉnh sửa thông tin đăng ký"}
            </h3>

            {detailLoading ? (
              <p>Đang tải...</p>
            ) : !detailTarget ? (
              <p>Không có dữ liệu.</p>
            ) : detailMode === "view" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  rowGap: 10,
                }}
              >
                <b>Giải đấu</b>
                <span>
                  {rows.find((x) => x.waitingId === detailTarget.waitingId)
                    ?.tournamentName || "-"}
                </span>
                <b>Họ và tên</b>
                <span>{detailTarget.registrationFullName || "-"}</span>
                <b>Username</b>
                <span>{detailTarget.registrationUsername || "-"}</span>
                <b>Email</b>
                <span>{detailTarget.registrationEmail || "-"}</span>
                <b>Số điện thoại</b>
                <span>{detailTarget.registrationPhone || "-"}</span>
                <b>Rank đăng ký</b>
                <span>{detailTarget.rankAtRegistration ?? "-"}</span>
                <b>Ghi chú</b>
                <span>{detailTarget.note || "-"}</span>
                <b>Trạng thái</b>
                <span>{detailTarget.status || "-"}</span>
                <b>Thời điểm đăng ký</b>
                <span>
                  {detailTarget.registrationDate
                    ? new Date(detailTarget.registrationDate).toLocaleString(
                        "vi-VN",
                      )
                    : "-"}
                </span>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Họ và tên
                  </label>
                  <input
                    value={editForm.fullName}
                    onChange={(e) =>
                      handleEditFormChange("fullName", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                  {editErrors.fullName && (
                    <div
                      style={{ color: "#b91c1c", marginTop: 4, fontSize: 13 }}
                    >
                      {editErrors.fullName}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Username
                  </label>
                  <input
                    value={editForm.username}
                    onChange={(e) =>
                      handleEditFormChange("username", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                  {editErrors.username && (
                    <div
                      style={{ color: "#b91c1c", marginTop: 4, fontSize: 13 }}
                    >
                      {editErrors.username}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Email
                  </label>
                  <input
                    value={editForm.email}
                    onChange={(e) =>
                      handleEditFormChange("email", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                  {editErrors.email && (
                    <div
                      style={{ color: "#b91c1c", marginTop: 4, fontSize: 13 }}
                    >
                      {editErrors.email}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Số điện thoại
                  </label>
                  <input
                    value={editForm.phone}
                    onChange={(e) =>
                      handleEditFormChange("phone", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                  {editErrors.phone && (
                    <div
                      style={{ color: "#b91c1c", marginTop: 4, fontSize: 13 }}
                    >
                      {editErrors.phone}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Rank đăng ký
                  </label>
                  <input
                    value={editForm.rankAtRegistration}
                    onChange={(e) =>
                      handleEditFormChange("rankAtRegistration", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                  {editErrors.rankAtRegistration && (
                    <div
                      style={{ color: "#b91c1c", marginTop: 4, fontSize: 13 }}
                    >
                      {editErrors.rankAtRegistration}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Ghi chú
                  </label>
                  <textarea
                    value={editForm.note}
                    onChange={(e) =>
                      handleEditFormChange("note", e.target.value)
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => {
                  setDetailMode(null);
                  setDetailTarget(null);
                }}
                disabled={editSubmitting}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#111827",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor: editSubmitting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Đóng
              </button>
              {detailMode === "edit" && (
                <button
                  onClick={handleSubmitEdit}
                  disabled={editSubmitting}
                  style={{
                    border: "none",
                    background: editSubmitting ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "8px 14px",
                    cursor: editSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {editSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
