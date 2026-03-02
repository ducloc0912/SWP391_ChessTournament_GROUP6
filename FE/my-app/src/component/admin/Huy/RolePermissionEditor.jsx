import React, { useMemo } from 'react';
import { Check, Shield } from 'lucide-react';

const RolePermissionEditor = ({
  selectedRoleId,
  selectedPermissionIds,
  roles,
  allPermissions,
  onRoleChange,
  onPermissionToggle,
  onSelectAll
}) => {

  const permissionsByCategory = useMemo(() => {
    const groups = {};
    allPermissions.forEach(p => {
      const key = p.module || "Khác";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [allPermissions]);

  return (
    <>
      <div className="permCardHeader">
        <h2 className="permCardHeaderTitle">
          <Shield size={24} />
          Phân quyền & vai trò
        </h2>
        <p className="permCardHeaderDesc">
          Chỉnh sửa vai trò người dùng và cấp quyền truy cập chi tiết vào hệ thống.
        </p>
      </div>

      <div className="permRoleSection">
        <label className="permRoleLabel">Chọn vai trò (Role)</label>
        <div className="permRoleGrid">
          {roles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onRoleChange(role.id)}
                className={`permRoleBtn ${isSelected ? 'permRoleBtnActive' : ''}`}
              >
                <span className="permRoleBtnName">{role.name}</span>
                {role.description && (
                  <span className="permRoleBtnDesc">{role.description}</span>
                )}
                {isSelected && <Check size={14} style={{ position: 'absolute', top: 10, right: 10, color: '#f59e0b' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="permListSection">
        <div className="permListTop">
          <h3 className="permListTitle">Danh sách quyền (Permissions)</h3>
          <div className="permListActions">
            <button type="button" onClick={() => onSelectAll(true)}>
              Chọn tất cả
            </button>
            <button type="button" onClick={() => onSelectAll(false)}>
              Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {Object.entries(permissionsByCategory).map(([category, permissions]) => (
          <div key={category} className="permModule">
            <h4 className="permModuleTitle">{category}</h4>
            <div className="permItemGrid">
              {permissions.map((perm) => {
                const isChecked = selectedPermissionIds.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`permItem ${isChecked ? 'permItemChecked' : ''}`}
                  >
                    <span className="permItemCheckboxWrap">
                      <input
                        type="checkbox"
                        className="permItemCheckbox"
                        checked={isChecked}
                        onChange={() => onPermissionToggle(perm.id)}
                      />
                      <Check size={12} strokeWidth={3} className="permItemCheckboxIcon" />
                    </span>
                    <span className="permItemLabel">
                      {perm.name || perm.permissionName}
                      <span className="permItemCode">{perm.code || perm.permissionCode}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default RolePermissionEditor;
