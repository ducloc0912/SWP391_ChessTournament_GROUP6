// src/component/referee/Dashboard.jsx
import React from "react";

export default function RefereeDashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>REFEREE DASHBOARD</h1>
      <p>Role: REFEREE</p>

      <ul>
        <li>Manage matches</li>
        <li>Update match results</li>
        <li>Report violations</li>
      </ul>
    </div>
  );
}
