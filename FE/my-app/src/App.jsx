import React from "react";
import Register from "./page/user/Register";
import Login from "./page/user/Login";
import ForgotPassword from "./page/user/ForgotPassword";
import Verify from "./page/user/Verify";
import ResetPassword from "./page/user/ResetPassword";
import HomePage from "./page/home/HomePage";
import Profile from "./page/user/UserProfile";
import AdminLayout from "./page/admin/AdminLayout";
import TournamentList from "./page/tournamentleader/TournamentList";
import TournamentDetail from "./page/tournamentleader/TournamentDetail";
import CreateTournament from "./page/tournamentleader/CreateTournament";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<Verify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
