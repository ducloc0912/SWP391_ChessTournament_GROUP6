import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/css/HomePage.css";
import "./assets/css/Login.css";
import "./assets/css/Register.css";
import "./assets/css/UserProfile.css";
import React from "react";
import "./index.css";
import App from "./App.jsx";

  

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
