import React from "react";

export default function UserProfile({ userId, onBack }) {
  return (
    <div className="al-wrap">
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <button className="al-btnGhost" onClick={onBack}>
          ← Quay lại
        </button>
        <h2 style={{ margin: 0 }}>User Profile (Demo)</h2>
      </div>

      <div className="al-tableCard" style={{ padding: 16 }}>
        <p>
          <b>UserId:</b> {userId ?? "(chưa chọn)"}
        </p>

        <p>Ở đây bạn có thể render thông tin user (username/email/role/...) sau này.</p>
      </div>
    </div>
  );
}