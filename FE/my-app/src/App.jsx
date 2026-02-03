import React from "react";
import Register from "./page/user/Register";
import Login from "./page/user/Login";
import HomePage from "./page/home/HomePage";  
import Profile from "./page/user/UserProfile";
import AdminLayout from "./page/admin/AdminLayout";
import TournamentList from "./page/tournamentleader/TournamentList";
import TournamentDetail from  "./page/tournamentleader/TournamentDetail";    
import CreateTournament from "./page/tournamentleader/CreateTournament"; 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import AdminLayout from "./page/admin/AdminLayout"; import PlayerLayout from "./page/Player/PlayerLayout";
// import StaffLayout from "./page/staff/StaffLayout";
// import RefereeLayout from "./page/referee/RefereeLayout";
// import TournamentLeaderLayout from "./page/tournamentLeader/TournamentLeaderLayout";

export default function App() {
  return (
    <BrowserRouter >
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/dashboard" element={<AdminLayout />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
      </Routes>
    </BrowserRouter>
  );
}
