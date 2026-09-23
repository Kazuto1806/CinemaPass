import { Outlet } from "react-router-dom";
import MenuAdmin from "../../components/MenuAdmin";
import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">

      {/* MENU BÊN TRÁI */}
      <aside className="admin-sidebar">
        <MenuAdmin />
      </aside>

      {/* CONTENT BÊN PHẢI */}
      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;