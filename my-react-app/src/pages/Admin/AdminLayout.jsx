import { Outlet, useLocation } from "react-router-dom";
import { FaCircle, FaShieldAlt } from "react-icons/fa";
import MenuAdmin from "../../components/MenuAdmin";
import "./AdminLayout.css";

function AdminLayout() {
  const { pathname } = useLocation();
  const userName = localStorage.getItem("userName") || "Quản trị viên";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <MenuAdmin />
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar-brand">
            <span className="admin-topbar-icon">
              <FaShieldAlt />
            </span>
            <div>
              <strong>Không gian quản trị</strong>
              <span>CinemaPass / {pathname === "/admin" ? "Tổng quan" : "Quản lý hệ thống"}</span>
            </div>
          </div>

          <div className="admin-topbar-user">
            <span className="admin-online">
              <FaCircle />
              Phiên quản trị
            </span>
            <span className="admin-user-avatar" aria-hidden="true">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="admin-user-name">{userName}</span>
          </div>
        </header>

        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;