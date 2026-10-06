import { useEffect, useState } from "react";
import { FaSearch, FaUsers, FaUserShield } from "react-icons/fa";

import "./UserAdmin.css";
import { API_BASE } from "../../constants";

const API_URL = `${API_BASE}/api/users`;

function UserAdmin() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lấy danh sách người dùng từ SQL Server
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách người dùng");
      }

      const data = await response.json();

      setUsers(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách người dùng:", error);

      setError(
        error.message || "Không thể tải danh sách người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Tìm kiếm
  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    return (
      user.fullName?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.phone?.toLowerCase().includes(keyword) ||
      user.role?.toLowerCase().includes(keyword)
    );
  });

  // Hiển thị quyền
  const getRoleText = (role) => {
    if (role === "Admin") {
      return "Quản trị viên";
    }

    return "Khách hàng";
  };

  return (
    <div className="user-admin">

      {/* HEADER */}
      <div className="user-admin-header">
        <div>
          <h1>Quản lý người dùng</h1>

          <p>
            Xem và quản lý tài khoản người dùng CinemaPass
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="user-toolbar">

        <div className="user-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="user-count">
          <FaUsers />

          <span>
            {filteredUsers.length} người dùng
          </span>
        </div>

      </div>

      {/* TABLE */}
      <div className="user-table-container">

        <table className="user-table">

          <thead>
            <tr>
              <th>STT</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
            </tr>
          </thead>

          <tbody>

            {/* LOADING */}
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="user-empty"
                >
                  Đang tải dữ liệu người dùng...
                </td>
              </tr>

            ) : error ? (

              /* ERROR */
              <tr>
                <td
                  colSpan="5"
                  className="user-empty user-error"
                >
                  {error}
                </td>
              </tr>

            ) : filteredUsers.length > 0 ? (

              /* DATA */
              filteredUsers.map((user, index) => (
                <tr key={user.userId}>

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    <div className="user-name-cell">

                      <div className="user-avatar">
                        {user.fullName
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>

                      <strong>
                        {user.fullName || "Chưa cập nhật"}
                      </strong>

                    </div>
                  </td>

                  <td>
                    {user.email || "Chưa cập nhật"}
                  </td>

                  <td>
                    {user.phone || "Chưa cập nhật"}
                  </td>

                  <td>
                    <span
                      className={`user-role ${
                        user.role === "Admin"
                          ? "admin"
                          : "customer"
                      }`}
                    >

                      {user.role === "Admin" && (
                        <FaUserShield />
                      )}

                      {getRoleText(user.role)}

                    </span>
                  </td>

                </tr>
              ))

            ) : (

              /* EMPTY */
              <tr>
                <td
                  colSpan="5"
                  className="user-empty"
                >
                  Không có người dùng trong cơ sở dữ liệu.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default UserAdmin;