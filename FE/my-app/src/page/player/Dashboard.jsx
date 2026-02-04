// src/component/player/Dashboard.jsx
import React from "react";

export default function PlayerDashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>PLAYER DASHBOARD</h1>
      <p>Role: PLAYER</p>

      <ul>
        <li>Join tournament</li>
        <li>View my matches</li>
        <li>View standings</li>
        <li>Update profile</li>
      </ul>
    </div>
  );
}
