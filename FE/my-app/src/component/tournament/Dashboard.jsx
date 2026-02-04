// src/component/tournament/Dashboard.jsx
import React from "react";

export default function TournamentDashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>TOURNAMENT DASHBOARD</h1>
      <p>Role: TOURNAMENT</p>

      <ul>
        <li>Create tournament</li>
        <li>Approve players</li>
        <li>Manage matches</li>
        <li>View standings</li>
      </ul>
    </div>
  );
}
