import React from "react";
import Register from "./page/user/Register";
import Login from "./page/user/Login";
import ForgotPassword from "./page/user/ForgotPassword";
import Verify from "./page/user/Verify";
import ResetPassword from "./page/user/ResetPassword";
import HomePage from "./page/home/HomePage";
import Profile from "./page/user/UserProfile";
import PlayerTournamentList from "./page/user/PlayerTournamentList";
import AdminLayout from "./page/admin/AdminLayout";
import TournamentList from "./page/tournamentleader/TournamentList";
import TournamentDetail from "./page/tournamentleader/TournamentDetail";
import CreateTournament from "./page/tournamentleader/CreateTournament";
import UpdateTournament from "./page/tournamentleader/UpdateTournament";
import StaffDashboard from "./page/staff/StaffDashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WaitingList from "./page/user/WaitingList";
//import AdminLayout from "./page/admin/AdminLayout"; import PlayerLayout from "./page/Player/PlayerLayout";
// import RefereeLayout from "./page/referee/RefereeLayout";
// import TournamentLeaderLayout from "./page/tournamentLeader/TournamentLeaderLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<Verify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/player/tournaments" element={<PlayerTournamentList />} />
        <Route path="/admin/dashboard" element={<AdminLayout />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
        <Route path="/tournaments/edit/:id" element={<UpdateTournament />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/tournaments/:id/waiting-list" element={<WaitingList />} />
      </Routes>
    </BrowserRouter>
  );
}
