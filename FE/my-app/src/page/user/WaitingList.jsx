import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Eye, Edit2, Trash2 } from "lucide-react";

const API_BASE = "http://localhost:8080/ctms";
const REQUIRED_FORM_FIELDS = [
  "fullName",
  "username",
  "email",
  "phone",
  "rankAtRegistration",
];

function buildDefaultFormFromUser(user) {
  return {
    fullName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    rankAtRegistration:
      user?.rank === null || user?.rank === undefined ? "" : String(user.rank),
    note: "",
  };
}

function validateWaitingListForm(values, rows, excludeWaitingId = null) {
  const fullName = (values.fullName || "").trim();
  const username = (values.username || "").trim();
  const email = (values.email || "").trim().toLowerCase();
  const phone = (values.phone || "").trim();
  const rawRank = String(values.rankAtRegistration ?? "").trim();
  const nextErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^0\d{9}$/;

  if (!fullName) nextErrors.fullName = "Họ và tên không được để trống.";
  if (!username) nextErrors.username = "Tên in-game không được để trống.";
  if (!email) nextErrors.email = "Email không được để trống.";
  if (!phone) nextErrors.phone = "SĐT không được để trống.";
  if (!rawRank) nextErrors.rankAtRegistration = "Bậc rank không được để trống.";
  if (email && !emailPattern.test(email)) {
    nextErrors.email = "Email không đúng định dạng.";
  }
  if (phone && !phonePattern.test(phone)) {
    nextErrors.phone = "SĐT không hợp lệ (10 số, bắt đầu bằng 0).";
  }
  if (rawRank) {
    const rankNumber = Number(rawRank);
    if (!Number.isInteger(rankNumber) || rankNumber < 0) {
      nextErrors.rankAtRegistration = "Bậc rank phải là số nguyên >= 0.";
    }
  }

  rows.forEach((r) => {
    if (excludeWaitingId != null && r.waitingId === excludeWaitingId) return;
    const rowUsername = (r.registrationUsername || "").trim().toLowerCase();
    const rowEmail = (r.registrationEmail || "").trim().toLowerCase();
    const rowPhone = (r.registrationPhone || "").trim();
    if (username && rowUsername === username.toLowerCase()) {
      nextErrors.username = "Tên in-game đã tồn tại.";
    }
    if (email && rowEmail === email) {
      nextErrors.email = "Email đã tồn tại.";
    }
    if (phone && rowPhone === phone) {
      nextErrors.phone = "SĐT đã tồn tại.";
    }
  });

  return nextErrors;
}

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
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [banner, setBanner] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    rankAtRegistration: "",
    note: "",
  });

  const fetchList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/waiting-list`, {
        params: { tournamentId: id },
        withCredentials: true,
      });
      const list = res.data?.data || [];
      setRows(list);
      return list;
    } catch (err) {
      setRows([]);
      return [];
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

  const getVisibleErrors = (nextForm, nextTouched, excludeWaitingId = null) => {
    const allErrors = validateWaitingListForm(nextForm, rows, excludeWaitingId);
    const visibleErrors = {};

    REQUIRED_FORM_FIELDS.forEach((key) => {
      if (nextTouched[key] && allErrors[key]) {
        visibleErrors[key] = allErrors[key];
      }
    });

    return visibleErrors;
  };

  const closeFormModal = () => {
    setEditing(null);
    setRegistering(false);
    setFormErrors({});
    setFormTouched({});
  };

  const openRegister = () => {
    if (!currentUser) {
      navigate("/login");
      return false;
    }
    const alreadyRegistered = rows.some(
      (row) => Number(row.userId) === Number(currentUser.userId),
    );
    if (alreadyRegistered) {
      setBanner({
        type: "error",
        text: "Người chơi đã đăng ký giải đấu",
      });
      return false;
    }
    setEditing(null);
    setRegistering(true);
    setFormErrors({});
    setFormTouched({});
    setForm(buildDefaultFormFromUser(currentUser));
    return true;
  };

  const handleFormChange = (field, value) => {
    const nextForm = { ...form, [field]: value };
    const nextTouched = { ...formTouched, [field]: true };
    const excludeWaitingId = editing?.waitingId ?? null;
    setForm(nextForm);
    setFormTouched(nextTouched);
    setFormErrors(getVisibleErrors(nextForm, nextTouched, excludeWaitingId));
  };

  const submitRegister = async () => {
    const normalizedForm = {
      ...form,
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      rankAtRegistration: String(form.rankAtRegistration ?? "").trim(),
      note: form.note?.trim() || "",
    };
    const allTouched = REQUIRED_FORM_FIELDS.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    const allErrors = validateWaitingListForm(normalizedForm, rows);

    if (Object.keys(allErrors).length > 0) {
      setFormTouched(allTouched);
      setFormErrors(allErrors);
      return;
    }

    const payload = {
      tournamentId: Number(id),
      fullName: normalizedForm.fullName,
      username: normalizedForm.username,
      email: normalizedForm.email,
      phone: normalizedForm.phone,
      rankAtRegistration: Number(normalizedForm.rankAtRegistration),
      rank: Number(normalizedForm.rankAtRegistration),
      note: normalizedForm.note,
    };

    try {
      const res = await axios.post(`${API_BASE}/api/waiting-list`, payload, {
        withCredentials: true,
      });
      await fetchList();
      const successMessage = res?.data?.message;
      setBanner({ type: "success", text: successMessage });
      closeFormModal();
      return { success: true };
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setFormErrors({ general: serverMessage });
      return { success: false };
    }
  };

  useEffect(() => {
    const initPage = async () => {
      fetchTournamentName();
      const list = await fetchList();

      if (location.state?.autoRegister) {
        const alreadyRegistered = list.some(
          (row) => Number(row.userId) === Number(currentUser?.userId),
        );

        if (alreadyRegistered) {
          setBanner({
            type: "error",
            text: "Người chơi đã đăng ký giải đấu",
          });
        } else {
          openRegister();
        }

        navigate(`/tournaments/${id}/waiting-list`, { replace: true });
      }
    };

    initPage();
  }, [id]);

  const openEdit = (row) => {
    const isOwner = Number(row.userId) === Number(currentUser?.userId);
    if (!isOwner) {
      setBanner({
        type: "error",
        text: "Bạn không có quyền sửa bản ghi này",
      });
      return;
    }
    setRegistering(false);
    setEditing(row);
    setFormErrors({});
    setFormTouched({});
    setForm({
      fullName: row.registrationFullName || "",
      username: row.registrationUsername || "",
      email: row.registrationEmail || "",
      phone: row.registrationPhone || "",
      rankAtRegistration:
        row.rankAtRegistration === null || row.rankAtRegistration === undefined
          ? ""
          : String(row.rankAtRegistration),
      note: row.note || "",
    });
  };

  const submitEdit = async () => {
    const normalizedForm = {
      ...form,
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      rankAtRegistration: String(form.rankAtRegistration ?? "").trim(),
      note: form.note?.trim() || "",
    };
    const allTouched = REQUIRED_FORM_FIELDS.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    const nextErrors = validateWaitingListForm(
      normalizedForm,
      rows,
      editing?.waitingId,
    );

    if (Object.keys(nextErrors).length > 0) {
      setFormTouched(allTouched);
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    try {
      const res = await axios.put(
        `${API_BASE}/api/waiting-list?id=${editing.waitingId}`,
        {
          ...normalizedForm,
          rankAtRegistration: Number(normalizedForm.rankAtRegistration),
          rank: Number(normalizedForm.rankAtRegistration),
        },
        {
          withCredentials: true,
        },
      );
      closeFormModal();
      await fetchList();
      setBanner({
        type: "success",
        text: res?.data?.message || "Cập nhật thông tin đăng ký thành công.",
      });
    } catch (err) {
      setFormErrors({
        general: err?.response?.data?.message,
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
        text: res?.data?.message,
      });
    } catch (err) {
      setBanner({
        type: "error",
        text: err?.response?.data?.message,
      });
    }
  };

  const openDelete = (row) => {
    const isOwner = Number(row.userId) === Number(currentUser?.userId);
    if (!isOwner) {
      setBanner({
        type: "error",
        text: "Bạn không có quyền xóa bản ghi này",
      });
      return;
    }
    setDeleteTarget(row);
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

  const clearFilters = () => {
    setSearchEmail("");
    setRankFilter("");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Danh sách chờ - {tournamentName}</h2>

      {banner && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 8,
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
          flexWrap: "nowrap",
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
            borderRadius: 8,
            padding: "9px 12px",
            outline: "none",
          }}
        />
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 8,
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
          onClick={clearFilters}
          style={{
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: 8,
            padding: "9px 14px",
            cursor: "pointer",
            fontWeight: 700,
            opacity: 1,
          }}
        >
          Xóa lọc
        </button>
      </div>

      <table
        width="100%"
        cellPadding="10"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              STT
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Họ và tên
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Tên in-game
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Email
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              SĐT
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Rank
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Thời điểm đăng ký
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Trạng thái
            </th>
            <th
              align="left"
              style={{ fontWeight: 700, color: "#0f172a", opacity: 1 }}
            >
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={9}>Chưa có người chơi nào.</td>
            </tr>
          ) : (
            filteredRows.map((row, idx) => {
              return (
                <tr key={row.waitingId}>
                  <td>{idx + 1}</td>
                  <td>{row.registrationFullName || "-"}</td>
                  <td>{row.registrationUsername || "-"}</td>
                  <td>{row.registrationEmail || "-"}</td>
                  <td>{row.registrationPhone || "-"}</td>
                  <td>{row.rankAtRegistration ?? "-"}</td>
                  <td>
                    {row.registrationDate
                      ? new Date(row.registrationDate).toLocaleString("vi-VN")
                      : "-"}
                  </td>
                  <td>{row.status}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button title="Xem" onClick={() => setSelected(row)}>
                      <Eye size={16} />
                    </button>
                    <button title="Sửa" onClick={() => openEdit(row)}>
                      <Edit2 size={16} />
                    </button>
                    <button title="Xóa" onClick={() => openDelete(row)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            borderRadius: 8,
            padding: "9px 14px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Quay lại
        </button>
        <button
          onClick={openRegister}
          style={{
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: 8,
            padding: "9px 14px",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
          }}
        >
          Đăng ký giải đấu
        </button>
      </div>

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
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editing || registering}
        title={editing ? "Sửa thông tin đăng ký" : "Sửa thông tin đăng ký"}
        onClose={closeFormModal}
      >
        {(editing || registering) && (
          <div>
            <div style={{ display: "grid", gap: 12 }}>
              {formErrors.general && (
                <div
                  style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}
                >
                  {formErrors.general}
                </div>
              )}
              <input
                placeholder="Họ và tên"
                value={form.fullName}
                onChange={(e) => handleFormChange("fullName", e.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
              {formErrors.fullName && (
                <div style={{ color: "#b91c1c", fontSize: 12, marginTop: -6 }}>
                  {formErrors.fullName}
                </div>
              )}
              <input
                placeholder="Tên in-game"
                value={form.username}
                onChange={(e) => handleFormChange("username", e.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
              {formErrors.username && (
                <div style={{ color: "#b91c1c", fontSize: 12, marginTop: -6 }}>
                  {formErrors.username}
                </div>
              )}
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
              {formErrors.email && (
                <div style={{ color: "#b91c1c", fontSize: 12, marginTop: -6 }}>
                  {formErrors.email}
                </div>
              )}
              <input
                placeholder="SĐT"
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
              {formErrors.phone && (
                <div style={{ color: "#b91c1c", fontSize: 12, marginTop: -6 }}>
                  {formErrors.phone}
                </div>
              )}
              <input
                type="number"
                min="0"
                placeholder="Bậc rank"
                value={form.rankAtRegistration}
                onChange={(e) =>
                  handleFormChange("rankAtRegistration", e.target.value)
                }
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                }}
              />
              {formErrors.rankAtRegistration && (
                <div style={{ color: "#b91c1c", fontSize: 12, marginTop: -6 }}>
                  {formErrors.rankAtRegistration}
                </div>
              )}
              <textarea
                placeholder="Ghi chú"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={4}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={closeFormModal}
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
                onClick={editing ? submitEdit : submitRegister}
                style={{
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "9px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {editing ? "Lưu" : "Xác nhận đăng ký giải"}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
    </div>
  );
}
