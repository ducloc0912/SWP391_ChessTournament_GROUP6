import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TournamentList from "./page/tournamentleader/TournamentList";
import TournamentDetail from "./page/tournamentleader/TournamentDetail";
import CreateTournament from "./page/tournamentleader/CreateTournament";

function App() {  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TournamentList />} />
        <Route path="/tournaments" element={<TournamentList />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/create" element={<CreateTournament />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
