import { useState, useEffect } from "react";
import {
  FaSearch,
  FaUserCircle,
  FaTicketAlt,
  FaFilm,
  FaChevronDown,
} from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";

import "./Header.css";
import CinemaPass from "../assets/Cinema_Pass.png";

function Header() {
  // =========================
  // USER
  // =========================

  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );

  // Role KHÔNG lấy từ localStorage
  // Sẽ lấy trực tiếp từ Backend -> SQL Server
  const [userRole, setUserRole] = useState("");

  const [loadingUser, setLoadingUser] = useState(false);

  // =========================
  // NAVIGATE
  // =========================

  const navigate = useNavigate();

  // =========================
  // LẤY USER TỪ DATABASE
  // =========================

  const loadUserFromDatabase = async () => {
    const userId = localStorage.getItem("userId");

    // Không có userId => chưa đăng nhập
    if (!userId) {
      setUserName("");
      setUserRole("");
      return;
    }

    try {
      setLoadingUser(true);

      const response = await fetch(
        `http://localhost:5000/api/auth/user/${userId}`
      );

      if (!response.ok) {
        throw new Error("Không thể lấy thông tin người dùng");
      }

      const data = await response.json();

      // Lấy dữ liệu từ SQL Server thông qua API
      setUserName(data.fullName || "");
      setUserRole(data.role || "");

      // Chỉ lưu các thông tin hiển thị phiên đăng nhập
      // Role không lưu vào localStorage
      localStorage.setItem("userName", data.fullName || "");
      localStorage.setItem("userEmail", data.email || "");
      localStorage.setItem("phone", data.phone || "");
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);

      setUserRole("");
    } finally {
      setLoadingUser(false);
    }
  };

  // =========================
  // THEO DÕI LOGIN / LOGOUT
  // =========================

  useEffect(() => {
    loadUserFromDatabase();

    const updateUser = () => {
      loadUserFromDatabase();
    };

    window.addEventListener("userLogin", updateUser);
    window.addEventListener("userLogout", updateUser);

    return () => {
      window.removeEventListener("userLogin", updateUser);
      window.removeEventListener("userLogout", updateUser);
    };
  }, []);

  // =========================
  // NGÔN NGỮ
  // =========================

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "VN"
  );

  const [showLanguage, setShowLanguage] = useState(false);

  // =========================
  // THEO DÕI THAY ĐỔI NGÔN NGỮ
  // =========================

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(localStorage.getItem("language") || "VN");
    };

    window.addEventListener("languageChanged", updateLanguage);

    return () => {
      window.removeEventListener("languageChanged", updateLanguage);
    };
  }, []);

  // =========================
  // ĐỔI NGÔN NGỮ
  // =========================

  const changeLanguage = (lang) => {
    setLanguage(lang);

    localStorage.setItem("language", lang);

    window.dispatchEvent(new Event("languageChanged"));

    setShowLanguage(false);
  };

  // =========================
  // LẤY CỜ
  // =========================

  const getFlag = () => {
    if (language === "VN") {
      return "https://flagcdn.com/w40/vn.png";
    }

    return "https://flagcdn.com/w40/us.png";
  };

  // =========================
  // ĐĂNG XUẤT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("phone");
    localStorage.removeItem("birthDate");

    // Xóa luôn role cũ nếu trước đây đã từng lưu
    localStorage.removeItem("role");

    setUserName("");
    setUserRole("");

    window.dispatchEvent(new Event("userLogout"));

    navigate("/");
  };

  // =========================
  // LINK TÀI KHOẢN
  // =========================

  const getUserLink = () => {
    // Chưa đăng nhập
    if (!userName) {
      return "/login";
    }

    // Admin lấy role từ Database
    if (userRole.toLowerCase() === "admin") {
      return "/admin";
    }

    // User thường
    return "/account";
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
              LOGIN / USER
          ========================= */}

          <div className="login-wrapper">

            <Link
              to={getUserLink()}
              className="login"
            >
              <FaUserCircle />

              <span>
                {userName
                  ? userName
                  : language === "VN"
                    ? "Đăng nhập"
                    : "Login"}
              </span>
            </Link>

            {/* =========================
                MENU USER THƯỜNG
            ========================= */}

            {userName &&
              !loadingUser &&
              userRole.toLowerCase() !== "admin" && (

                <div className="user-menu">

                  <Link to="/account">
                    Tài khoản
                  </Link>

                  <Link to="/tickets">
                    Vé của tôi
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>

                </div>
              )}

          </div>

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