
import {
  FaTachometerAlt,
  FaFilm,
  FaUsers,
  FaTicketAlt,
  FaUtensils,
  FaSignOutAlt,
  FaBuilding,
  FaClock,
  FaDoorOpen,
  FaChair,
  FaTags,
  FaShoppingCart,
  FaCreditCard,
  FaChartBar,
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

        {/* DASHBOARD */}
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

        {/* QUẢN LÝ PHIM */}
        <NavLink
          to="/admin/movies"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaFilm />
          <span>Quản lý phim</span>
        </NavLink>

        {/* QUẢN LÝ RẠP */}
        <NavLink
          to="/admin/cinemas"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaBuilding />
          <span>Quản lý rạp</span>
        </NavLink>

        {/* QUẢN LÝ PHÒNG CHIẾU */}
        <NavLink
          to="/admin/rooms"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaDoorOpen />
          <span>Quản lý phòng chiếu</span>
        </NavLink>

        {/* QUẢN LÝ GHẾ */}
        <NavLink
          to="/admin/seats"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaChair />
          <span>Quản lý ghế ngồi</span>
        </NavLink>

        {/* QUẢN LÝ SUẤT CHIẾU */}
        <NavLink
          to="/admin/showtimes"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaClock />
          <span>Quản lý suất chiếu</span>
        </NavLink>

        {/* QUẢN LÝ LOẠI VÉ */}
        <NavLink
          to="/admin/ticket-types"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaTags />
          <span>Quản lý loại vé</span>
        </NavLink>

        {/* QUẢN LÝ NGƯỜI DÙNG */}
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaUsers />
          <span>Quản lý người dùng</span>
        </NavLink>

        {/* QUẢN LÝ VÉ */}
        <NavLink
          to="/admin/tickets"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaTicketAlt />
          <span>Quản lý vé</span>
        </NavLink>

        {/* QUẢN LÝ BẮP NƯỚC */}
        <NavLink
          to="/admin/food"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaUtensils />
          <span>Quản lý bắp nước</span>
        </NavLink>

        {/* QUẢN LÝ ĐƠN HÀNG BẮP NƯỚC */}
        <NavLink
          to="/admin/food-orders"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaShoppingCart />
          <span>Quản lý đơn bắp nước</span>
        </NavLink>

        {/* THANH TOÁN */}
        <NavLink
          to="/admin/payments"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaCreditCard />
          <span>Quản lý thanh toán</span>
        </NavLink>

        {/* BÁO CÁO & THỐNG KÊ */}
        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaChartBar />
          <span>Báo cáo & thống kê</span>
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