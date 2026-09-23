import {
  FaTachometerAlt,
  FaFilm,
  FaUsers,
  FaTicketAlt,
  FaUtensils,
  FaSignOutAlt,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";

import "./MenuAdmin.css";

function MenuAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("phone");
    localStorage.removeItem("birthDate");
    localStorage.removeItem("role");

    window.dispatchEvent(new Event("userLogout"));

    navigate("/");
  };

  return (
    <div className="menu-admin">

      {/* LOGO / TITLE */}
      <div className="menu-admin-header">
        <h2>ADMIN</h2>
        <p>Cinema Pass</p>
      </div>

      {/* MENU */}
      <nav className="menu-admin-list">

        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/movies"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaFilm />
          <span>Quản lý phim</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaUsers />
          <span>Quản lý người dùng</span>
        </NavLink>

        <NavLink
          to="/admin/tickets"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaTicketAlt />
          <span>Quản lý vé</span>
        </NavLink>

        <NavLink
          to="/admin/food"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaUtensils />
          <span>Quản lý bắp nước</span>
        </NavLink>

      </nav>

      {/* LOGOUT */}
      <div className="menu-admin-bottom">

        <button
          type="button"
          className="menu-admin-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          <span>Đăng xuất</span>
        </button>

      </div>

    </div>
  );
}

export default MenuAdmin;