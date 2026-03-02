import React from "react";
import Register from "./page/user/Register";
import Login from "./page/user/Login";
import ForgotPassword from "./page/user/ForgotPassword";
import Verify from "./page/user/Verify";
import ResetPassword from "./page/user/ResetPassword";
import HomePage from "./page/home/HomePage";
import Profile from "./page/user/UserProfile";
import PlayerTournamentList from "./page/user/PlayerTournamentList";
import PendingTournamentRegistrations from "./page/user/PendingTournamentRegistrations";
import AdminLayout from "./page/admin/AdminLayout";
import TournamentLeaderLayout from "./page/tournamentleader/TournamentLeaderLayout";
import LeaderTournamentDetail from "./page/tournamentleader/TournamentDetail";
import CreateTournament from "./page/tournamentleader/CreateTournament";
import UpdateTournament from "./page/tournamentleader/UpdateTournament";
import StaffDashboard from "./page/staff/StaffDashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WaitingList from "./page/user/WaitingList";
import TournamentPublic from "./component/common/TournamentPublic";
import TournamentDetail from "./component/common/TournamentDetail";
import MatchesPublic from "./component/common/MatchesPublic";
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
        <Route
          path="/player/pending-registrations"
          element={<PendingTournamentRegistrations />}
        />
        <Route path="/admin/dashboard" element={<AdminLayout />} />
        <Route path="/tournaments" element={<TournamentLeaderLayout />} />
        <Route path="/tournaments/:id" element={<LeaderTournamentDetail />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
        <Route path="/tournaments/edit/:id" element={<UpdateTournament />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/tournaments/:id/waiting-list" element={<WaitingList />} />
        <Route path="/tournaments/public" element={<TournamentPublic />} />
        <Route path="/tournaments/public/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/public/all" element={<MatchesPublic />} />
      </Routes>
    </BrowserRouter>
  );
}
