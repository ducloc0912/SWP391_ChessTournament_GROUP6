import React from "react";
import Register from "./component/Register";
import Login from "./component/Login";
import ForgotPassword from "./component/ForgotPassword";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Verify from "./component/Verify";
import ResetPassword from "./component/ResetPassword";
// import AdminLayout from "./page/admin/AdminLayout";
// import PlayerLayout from "./page/Player/PlayerLayout";
// import StaffLayout from "./page/staff/StaffLayout";
// import RefereeLayout from "./page/referee/RefereeLayout";
// import TournamentLeaderLayout from "./page/tournamentLeader/TournamentLeaderLayout";

export default function App() {
  return (
    <BrowserRouter basename="/ctms">
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<Verify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
