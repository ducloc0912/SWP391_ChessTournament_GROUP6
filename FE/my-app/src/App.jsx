import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StaffDashboard from "./page/staff/StaffDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

        {/* Staff routes */}
        <Route path="/staff">
          <Route path="dashboard" element={<StaffDashboard />} />
          {/* 
          <Route path="blogs" element={<StaffBlogs />} />
          <Route path="tournaments" element={<StaffTournaments />} />
          */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
