import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import UserProfileCard from "../../component/admin/Huy/UserProfileCard.jsx";
import RolePermissionEditor from "../../component/admin/Huy/RolePermissionEditor.jsx";
import { Save, RotateCcw, ChevronLeft } from "lucide-react";

/* =======================
   CONFIG
======================= */
import { API_BASE } from "../../config/api";

/* =======================
   HTTP HELPER (session-based)
======================= */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // ✅ AuthFilter dùng session
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const sameSet = (a, b) => {
  if (a.length !== b.length) return false;
  const A = new Set(a);
  for (const x of b) if (!A.has(x)) return false;
  return true;
};

const App = ({ userId: userIdProp, onBack }) => {
  const params = useParams();
  const userId = Number(userIdProp ?? params.userId ?? 0);

  /* ---------- User (real from backend if possible) ---------- */
  const [currentUser, setCurrentUser] = useState({ userId, roleId: null });

  /* ---------- Data from backend ---------- */
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  /* ---------- UI State ---------- */
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [baselinePermissions, setBaselinePermissions] = useState([]);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* =======================
     LOAD INITIAL DATA
  ======================= */
  useEffect(() => {
    const load = async () => {
      setLoadError("");
      setIsLoading(true);

      try {
        if (!userId || userId <= 0) {
          setLoadError("Chưa chọn user. Quay lại danh sách tài khoản và chọn \"Phân quyền\".");
          setIsLoading(false);
          return;
        }

        // 1) Load roles + permissions
        const [roleList, permList] = await Promise.all([
          apiFetch("/api/admin/roles"),
          apiFetch("/api/admin/permissions"),
        ]);

        setRoles(roleList);
        setPermissions(permList);

        // 2) Load user detail (optional)
        try {
          const res = await apiFetch(`/api/admin/users/${userId}`);
          const data = res?.data ?? res;
          const user = data?.user ?? data;
          const roleName = data?.role;
          setCurrentUser((prev) => ({ ...prev, ...user, userId, roleName }));
        } catch {
          setCurrentUser((prev) => ({ ...prev, userId }));
        }

        // 3) Load user roles (lấy roleId hiện tại)
        if (userId > 0) {
          const userRoleRes = await apiFetch(`/api/admin/users/${userId}/roles`);
          const roleId = userRoleRes?.roleIds?.[0] ?? null;

          setSelectedRoleId(roleId);
          setCurrentUser((prev) => ({ ...prev, roleId }));

          // 4) Load permissions of selected role
          if (roleId != null) {
            const rolePermRes = await apiFetch(`/api/admin/roles/${roleId}/permissions`);
            const permIds = rolePermRes?.permissionIds ?? [];
            setSelectedPermissions(permIds);
            setBaselinePermissions(permIds);
          } else {
            setSelectedPermissions([]);
            setBaselinePermissions([]);
          }
        } else {
          setSelectedRoleId(null);
          setSelectedPermissions([]);
          setBaselinePermissions([]);
        }
      } catch (e) {
        console.error(e);
        setLoadError(
          e.status === 401
            ? "401: Bạn chưa đăng nhập. Hãy login trước."
            : e.status === 403
            ? "403: Bạn không có quyền truy cập trang này."
            : `Lỗi tải dữ liệu: ${e.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [userId]);

  /* =======================
     DIRTY CHECK
  ======================= */
  useEffect(() => {
    if (selectedRoleId == null) {
      setIsDirty(false);
      return;
    }
    const roleChanged = selectedRoleId !== currentUser.roleId;
    const permChanged = !sameSet(selectedPermissions, baselinePermissions);
    setIsDirty(roleChanged || permChanged);
  }, [selectedRoleId, selectedPermissions, baselinePermissions, currentUser.roleId]);

  /* =======================
     UI DATA MAPPING (adapt to your RolePermissionEditor props)
  ======================= */
  const uiRoles = useMemo(
    () =>
      roles.map((r) => ({
        id: r.roleId,
        name: r.roleName,
        description: r.description,
      })),
    [roles]
  );

  const uiPermissions = useMemo(
    () =>
      permissions.map((p) => ({
        id: p.permissionId,
        name: p.permissionName,
        code: p.permissionCode,
        module: p.module,
      })),
    [permissions]
  );

  /* =======================
     HANDLERS
  ======================= */
  const handleRoleChange = async (roleId) => {
    setSelectedRoleId(roleId);

    // khi đổi role -> load permissions của role đó
    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}/permissions`);
      setSelectedPermissions(res.permissionIds || []);
    } catch (e) {
      console.error(e);
      setSelectedPermissions([]);
      alert(`Không tải được quyền của role: ${e.message}`);
    }
  };

  const handlePermissionToggle = (id) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedPermissions(checked ? uiPermissions.map((p) => p.id) : []);
  };

  const handleReset = () => {
    setSelectedRoleId(currentUser.roleId);
    setSelectedPermissions(baselinePermissions);
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (selectedRoleId == null) return;

    setIsSaving(true);
    try {
      // 1) Update user role
      await apiFetch(`/api/admin/users/${userId}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roleIds: [selectedRoleId] }),
      });

      // 2) Update role permissions
      await apiFetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds: selectedPermissions }),
      });

      setCurrentUser((u) => ({ ...u, roleId: selectedRoleId }));
      setBaselinePermissions(selectedPermissions);
      setIsDirty(false);
      alert("Cập nhật quyền thành công!");
    } catch (e) {
      console.error(e);
      alert(
        e.status === 401
          ? "401: Bạn chưa đăng nhập."
          : e.status === 403
          ? "403: Bạn không có quyền."
          : `Lỗi lưu: ${e.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================
     RENDER
  ======================= */
  if (isLoading) {
    return (
      <div className="editRolePage">
        <div className="editRoleLoading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="editRolePage">
        <div className="editRoleError">
          <h2 className="editRoleErrorTitle">Không tải được dữ liệu</h2>
          <p className="editRoleErrorText">{loadError}</p>
          <button type="button" onClick={() => window.location.reload()} className="editRoleErrorBtn">
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editRolePage">
      <div className="editRoleTop">
        <div className="editRoleLeft">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : window.history.back())}
            className="editRoleBackBtn"
            title="Quay lại"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="editRoleTitle">Phân quyền người dùng</h1>
          <span className="editRoleBadge">Chỉnh sửa</span>
        </div>

        <div className="editRoleActions">
          {isDirty && (
            <button type="button" onClick={handleReset} className="editRoleBtnGhost">
              <RotateCcw size={18} />
              Hủy
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving || selectedRoleId == null}
            className="editRoleBtnPrimary"
          >
            {isSaving ? (
              <>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "editRoleSpin 0.8s linear infinite", display: "inline-block" }} />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={18} />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      <div className="editRoleGrid">
        <div>
          <UserProfileCard user={currentUser} />
        </div>

        <div className="permCard" style={{ minHeight: 400 }}>
          <RolePermissionEditor
            roles={uiRoles}
            allPermissions={uiPermissions}
            selectedRoleId={selectedRoleId}
            selectedPermissionIds={selectedPermissions}
            onRoleChange={handleRoleChange}
            onPermissionToggle={handlePermissionToggle}
            onSelectAll={handleSelectAll}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
