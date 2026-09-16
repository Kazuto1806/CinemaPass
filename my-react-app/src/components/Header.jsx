import {
  FaSearch,
  FaUserCircle,
  FaTicketAlt,
  FaFilm,
  FaChevronDown,
} from "react-icons/fa";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Header.css";
import CinemaPass from "../assets/Cinema_Pass.png";

function Header() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "VN"
  );

  const [showLanguage, setShowLanguage] = useState(false);

  // =========================
  // ĐỔI NGÔN NGỮ
  // =========================
  const changeLanguage = (lang) => {
    setLanguage(lang);

    localStorage.setItem("language", lang);

    // Báo cho các trang khác biết ngôn ngữ đã thay đổi
    window.dispatchEvent(new Event("languageChanged"));

    setShowLanguage(false);
  };

  // =========================
  // LẤY CỜ THEO NGÔN NGỮ
  // =========================
  const getFlag = () => {
    if (language === "VN") {
      return "https://flagcdn.com/w40/vn.png";
    }

    return "https://flagcdn.com/w40/us.png";
  };

  return (
    <header className="header">
      <div className="header-container">

        <div className="header-top">

          {/* =========================
              LOGO
          ========================= */}
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

            {/* ĐẶT VÉ */}
            <button
              type="button"
              className="header-btn booking-btn"
              onClick={() => navigate("/")}
            >
              <FaTicketAlt />

              <span>
                {language === "VN"
                  ? "ĐẶT VÉ NGAY"
                  : "BOOK TICKETS"}
              </span>
            </button>


            {/* ĐẶT BẮP NƯỚC */}
            <button
              type="button"
              className="header-btn food-btn"
              onClick={() => navigate("/food")}
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

              {/* CỜ HIỆN TẠI */}
              <img
                src={getFlag()}
                alt={
                  language === "VN"
                    ? "Vietnam"
                    : "United States"
                }
                className="flag-image"
              />

              {/* MÃ NGÔN NGỮ */}
              <span className="language-code">
                {language}
              </span>

              <FaChevronDown />

            </button>


            {/* =========================
                MENU NGÔN NGỮ
            ========================= */}
            {showLanguage && (
              <div className="language-menu">

                {/* TIẾNG VIỆT */}
                <button
                  type="button"
                  onClick={() =>
                    changeLanguage("VN")
                  }
                  className={
                    language === "VN"
                      ? "language-active"
                      : ""
                  }
                >
                  <img
                    src="https://flagcdn.com/w40/vn.png"
                    alt="Vietnam"
                    className="menu-flag"
                  />

                  <span>
                    Tiếng Việt
                  </span>
                </button>


                {/* ENGLISH */}
                <button
                  type="button"
                  onClick={() =>
                    changeLanguage("EN")
                  }
                  className={
                    language === "EN"
                      ? "language-active"
                      : ""
                  }
                >
                  <img
                    src="https://flagcdn.com/w40/us.png"
                    alt="United States"
                    className="menu-flag"
                  />

                  <span>
                    English
                  </span>
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