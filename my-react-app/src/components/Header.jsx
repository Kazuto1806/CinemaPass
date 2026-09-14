import {
  FaMapMarkerAlt,
  FaSearch,
  FaUserCircle,
  FaTicketAlt,
  FaFilm,
  FaChevronDown,
} from "react-icons/fa";

import "./Header.css";
import CinemaPass from "../assets/Cinema_Pass.png";
import { Link } from "react-router-dom"
function Header() {
  return (
    <header className="header">
      <div className="header-container">

        <div className="header-top">

          <Link to="/" className="logo">
            <img src={CinemaPass} alt="Cineme Pass" />
          </Link>

          <div className="header-buttons">

            <button className="header-btn booking-btn">
              <FaTicketAlt />
              ĐẶT VÉ NGAY
            </button>

            <button className="header-btn food-btn">
              <FaFilm />
              ĐẶT BẮP NƯỚC
            </button>

          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm phim, rạp"
            />

            <FaSearch className="search-icon" />
          </div>

          <div className="login">
            <FaUserCircle />
            <span>Đăng nhập</span>
          </div>

          <div className="language">
            <span className="flag">★</span>
            <span>VN</span>
            <FaChevronDown />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;