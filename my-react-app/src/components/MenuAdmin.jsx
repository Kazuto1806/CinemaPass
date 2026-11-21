
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
  FaImages,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";

import "./MenuAdmin.css";

function MenuAdmin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("authToken");
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
          aria-label="Dashboard"
          title="Dashboard"
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
          aria-label="Quản lý phim"
          title="Quản lý phim"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaFilm />
          <span>Quản lý phim</span>
        </NavLink>

        <NavLink
          to="/admin/banners"
          aria-label="Quản lý banner"
          title="Quản lý banner"
          className={({ isActive }) =>
            `menu-admin-item ${isActive ? "active" : ""}`
          }
        >
          <FaImages />
          <span>Quản lý banner</span>
        </NavLink>

        {/* QUẢN LÝ RẠP */}
        <NavLink
          to="/admin/cinemas"
          aria-label="Quản lý rạp"
          title="Quản lý rạp"
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
          aria-label="Quản lý phòng chiếu"
          title="Quản lý phòng chiếu"
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
          aria-label="Quản lý ghế ngồi"
          title="Quản lý ghế ngồi"
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
          aria-label="Quản lý suất chiếu"
          title="Quản lý suất chiếu"
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
          aria-label="Quản lý loại vé"
          title="Quản lý loại vé"
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
          aria-label="Quản lý người dùng"
          title="Quản lý người dùng"
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
          aria-label="Quản lý vé"
          title="Quản lý vé"
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
          aria-label="Quản lý bắp nước"
          title="Quản lý bắp nước"
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
          aria-label="Quản lý đơn bắp nước"
          title="Quản lý đơn bắp nước"
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
          aria-label="Quản lý thanh toán"
          title="Quản lý thanh toán"
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
          aria-label="Báo cáo và thống kê"
          title="Báo cáo và thống kê"
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