import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaUser,
  FaUsers,
  FaHistory,
  FaSignOutAlt,
  FaLock,
} from "react-icons/fa";

import "./Account.css";

function Account() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || ""
  );

  const [userEmail] = useState(
    localStorage.getItem("userEmail") || ""
  );

  const [phone, setPhone] = useState(
    localStorage.getItem("phone") || ""
  );

  const [birthDate, setBirthDate] = useState(
    localStorage.getItem("birthDate") || ""
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveInfo = () => {
    localStorage.setItem("userName", userName);
    localStorage.setItem("phone", phone);
    localStorage.setItem("birthDate", birthDate);

    window.dispatchEvent(new Event("userLogin"));

    alert("Đã lưu thông tin thành công!");
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    alert("Đổi mật khẩu thành công!");

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

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
    <div className="account-page">
      <div className="account-container">

        {/* SIDEBAR */}
        <aside className="account-sidebar">

          <div className="account-profile">
            <div className="account-avatar">
              <FaUserCircle />
            </div>

            <h2>
              {userName || "Khách hàng"}
            </h2>

            <p>
              Thành viên CinemaPass
            </p>
          </div>

          <div className="account-menu">

            <button
              type="button"
              className="account-menu-item active"
            >
              <FaUser />
              <span>Thông tin khách hàng</span>
            </button>

            <button
              type="button"
              className="account-menu-item"
              onClick={() => alert("Chức năng thành viên đang được phát triển!")}
            >
              <FaUsers />
              <span>Thành viên CinemaPass</span>
            </button>

            <button
              type="button"
              className="account-menu-item"
              onClick={() => navigate("/tickets")}
            >
              <FaHistory />
              <span>Lịch sử mua hàng</span>
            </button>

            <button
              type="button"
              className="account-menu-item logout"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Đăng xuất</span>
            </button>

          </div>

        </aside>

        {/* CONTENT */}
        <main className="account-content">

          {/* THÔNG TIN CÁ NHÂN */}
          <section className="account-box">

            <div className="account-box-title">
              <FaUser />

              <h2>Thông tin cá nhân</h2>
            </div>

            <div className="account-form">

              <div className="account-field">
                <label>Họ và tên</label>

                <input
                  type="text"
                  value={userName}
                  onChange={(e) =>
                    setUserName(e.target.value)
                  }
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="account-field">
                <label>Ngày sinh</label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) =>
                    setBirthDate(e.target.value)
                  }
                />
              </div>

              <div className="account-field">
                <label>Số điện thoại</label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="account-field">
                <label>Email</label>

                <input
                  type="email"
                  value={userEmail}
                  readOnly
                />
              </div>

            </div>

            <button
              type="button"
              className="account-save-button"
              onClick={handleSaveInfo}
            >
              LƯU THÔNG TIN
            </button>

          </section>

          {/* ĐỔI MẬT KHẨU */}
          <section className="account-box password-box">

            <div className="account-box-title">
              <FaLock />

              <h2>Đổi mật khẩu</h2>
            </div>

            <div className="password-form">

              <div className="account-field">
                <label>Mật khẩu cũ *</label>

                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) =>
                    setOldPassword(e.target.value)
                  }
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>

              <div className="account-field">
                <label>Mật khẩu mới *</label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div className="account-field">
                <label>Xác nhận mật khẩu *</label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

            </div>

            <button
              type="button"
              className="account-save-button"
              onClick={handleChangePassword}
            >
              ĐỔI MẬT KHẨU
            </button>

          </section>

        </main>

      </div>
    </div>
  );
}

export default Account;