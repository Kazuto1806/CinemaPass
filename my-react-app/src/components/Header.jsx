import {
  FaSearch,
  FaUserCircle,
  FaTicketAlt,
  FaFilm,
  FaChevronDown,
} from "react-icons/fa";

import { useState } from "react";
import { Link } from "react-router-dom";

import "./Header.css";
import CinemaPass from "../assets/Cinema_Pass.png";

function Header() {
  // Ngôn ngữ hiện tại
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "VN"
  );

  // Hiện / ẩn menu ngôn ngữ
  const [showLanguage, setShowLanguage] = useState(false);

  // Đổi ngôn ngữ
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    setShowLanguage(false);
  };

  return (
    <header className="header">
      <div className="header-container">

        {/* =========================
            HÀNG TRÊN
        ========================= */}
        <div className="header-top">

          {/* LOGO */}
          <Link to="/" className="logo">
            <img
              src={CinemaPass}
              alt="Cinema Pass"
            />
          </Link>

          {/* =========================
              BUTTONS
          ========================= */}
          <div className="header-buttons">

            <button
              type="button"
              className="header-btn booking-btn"
            >
              <FaTicketAlt />

              <span>
                {language === "VN"
                  ? "ĐẶT VÉ NGAY"
                  : "BOOK TICKETS"}
              </span>
            </button>

            <button
              type="button"
              className="header-btn food-btn"
            >
              <FaFilm />

              <span>
                {language === "VN"
                  ? "ĐẶT BẮP NƯỚC"
                  : "FOOD & DRINKS"}
              </span>
            </button>

          </div>

          {/* =========================
              SEARCH
          ========================= */}
          <div className="search-box">

            <input
              type="text"
              placeholder={
                language === "VN"
                  ? "Tìm phim, rạp"
                  : "Search movies, cinemas"
              }
            />

            <FaSearch className="search-icon" />

          </div>

          {/* =========================
              LOGIN
          ========================= */}
          <Link
            to="/login"
            className="login"
          >
            <FaUserCircle />

            <span>
              {language === "VN"
                ? "Đăng nhập"
                : "Login"}
            </span>
          </Link>

          {/* =========================
              LANGUAGE
          ========================= */}
          <div className="language-wrapper">

            <button
              type="button"
              className="language"
              onClick={() =>
                setShowLanguage(!showLanguage)
              }
            >
              <span className="flag">
                ★
              </span>

              <span>
                {language}
                
              </span>

              <FaChevronDown />
            </button>

            {/* MENU NGÔN NGỮ */}
            {showLanguage && (
              <div className="language-menu">

                <button
                  type="button"
                  onClick={() =>
                    changeLanguage("VN")
                  }
                >
                  🇻🇳 Tiếng Việt
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeLanguage("EN")
                  }
                >
                  🇬🇧 English
                </button>

              </div>
            )}

          </div>

        </div>

      </div>
    </header>
  );
}

export default Header;