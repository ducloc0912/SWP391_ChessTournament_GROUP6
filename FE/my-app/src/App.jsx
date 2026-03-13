import React from "react";
import Register from "./page/user/Register";
import Login from "./page/user/Login";
import ForgotPassword from "./page/user/ForgotPassword";
import Verify from "./page/user/Verify";
import ResetPassword from "./page/user/ResetPassword";
import HomePage from "./page/home/HomePage";
import RefereeInvitationsPage from "./page/referee/RefereeInvitationsPage";
import Profile from "./page/user/UserProfile";
import PlayerTournamentList from "./page/user/PlayerTournamentList";
import PendingTournamentRegistrations from "./page/user/PendingTournamentRegistrations";
import AdminLayout from "./page/admin/AdminLayout";
import TournamentList from "./page/tournamentleader/TournamentList";
import TournamentDetailLeader from "./page/tournamentleader/TournamentDetail";
import TournamentPublic from "./component/common/TournamentPublic";
import TournamentDetailPublic from "./component/common/TournamentDetail";
import CreateTournament from "./page/tournamentleader/CreateTournament";
import UpdateTournament from "./page/tournamentleader/UpdateTournament";
import StaffDashboard from "./page/staff/StaffDashboard";
import StaffSystemReportPage from "./page/staff/StaffSystemReportPage";
import UserReportPage from "./page/user/UserReportPage";
import BlogPage from "./page/blog/BlogPage";
import BlogDetails from "./page/blog/BlogDetails";
import BlogManagePage from "./page/blog/BlogManagePage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PaymentPage from "./page/payment/PaymentPage";
import WalletPage from "./page/payment/WalletPage";

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
        <Route path="/user/reports" element={<UserReportPage />} />
        <Route path="/player/tournaments" element={<PlayerTournamentList />} />
        <Route
          path="/player/pending-registrations"
          element={<PendingTournamentRegistrations />}
        />
        <Route path="/admin/dashboard" element={<AdminLayout />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/public" element={<TournamentPublic />} />
        <Route path="/tournaments/public/:id" element={<TournamentDetailPublic />} />
        <Route path="/tournaments/:id" element={<TournamentDetailLeader />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
        <Route path="/tournaments/edit/:id" element={<UpdateTournament />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetails />} />
        <Route path="/blog/manage" element={<BlogManagePage />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/reports" element={<StaffSystemReportPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/referee/invitations" element={<RefereeInvitationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
