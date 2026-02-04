import React from "react";
import { ICONS } from "../../constants";
import { Bell, MessageSquare } from "lucide-react";
import chessLogin from "../../assets/img/avartaAdmin.jpg";
export const Header = ({ title }) => {
  return (
    <header className="headerBar">
      <div className="headerTitle">
        <h2 style={{color: "#000000"}}>{title}</h2>
        <p style={{color: "#000000"}}>Quản lý hệ thống Chess Tournament</p>
      </div>

      <div className="headerSearchWrap">
        <div className="searchBox">
          <div className="searchIcon">{ICONS.Search}</div>
          <input
            className="searchInput"
            type="text"
            placeholder="Tìm kiếm giải đấu, người chơi hoặc báo cáo..."
          />
        </div>
      </div>

      <div className="headerActions">
        <button type="button" className="iconBtn" aria-label="Messages">
          <MessageSquare size={18} />
          
        </button>

        <button type="button" className="iconBtn" aria-label="Notifications">
          <Bell size={18} />
         
        </button>

        <div className="headerDivider" />

        <button type="button" className="profileBtn">
          <div className="profileText">
            <div className="profileName">Magnus Carlsen</div>
            <div className="profileRole">QUẢN TRỊ VIÊN TRƯỜNG</div>
          </div>

          <div className="avatarWrap">
            <img src={chessLogin} alt="Avatar Admin" className="avatar" />
            <span className="avatarOnline" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
