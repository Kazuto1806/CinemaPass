
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

import NotificationPopup from "../components/NotificationPopup";
import Membership from "./Membership";
import TicketHistory from "./TicketHistory";
import "./Account.css";

function Account() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("account");
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

  const [popup, setPopup] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showPopup = (type, title, message) => {
    setPopup({ show: true, type, title, message });
  };

  const closePopup = () => {
    setPopup((previous) => ({
      ...previous,
      show: false,
    }));
  };

  const handleSaveInfo = () => {
    if (!userName.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập họ và tên!"
      );
      return;
    }

    localStorage.setItem("userName", userName.trim());
    localStorage.setItem("phone", phone.trim());
    localStorage.setItem("birthDate", birthDate);

    window.dispatchEvent(new Event("userLogin"));

    showPopup(
      "success",
      "Thành công",
      "Đã lưu thông tin thành công!"
    );
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin!"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup(
        "error",
        "Không thành công",
        "Mật khẩu xác nhận không khớp!"
      );
      return;
    }

    showPopup(
      "warning",
      "Chưa kết nối hệ thống",
      "Chức năng đổi mật khẩu cần được kết nối với backend."
    );
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
        <aside className="account-sidebar">
          <div className="account-profile">
            <div className="account-avatar">
              <FaUserCircle />
            </div>

            <h2>{userName || "Khách hàng"}</h2>
            <p>Thành viên CinemaPass</p>
          </div>

          <nav className="account-menu">
            <button
              type="button"
              className={`account-menu-item ${
                activeSection === "account" ? "active" : ""
              }`}
              onClick={() => setActiveSection("account")}
            >
              <FaUser />
              <span>Thông tin khách hàng</span>
            </button>

            <button
              type="button"
              className={`account-menu-item ${
                activeSection === "membership" ? "active" : ""
              }`}
              onClick={() => setActiveSection("membership")}
            >
              <FaUsers />
              <span>Thành viên CinemaPass</span>
            </button>

            <button
              type="button"
              className={`account-menu-item ${
                activeSection === "history" ? "active" : ""
              }`}
              onClick={() => setActiveSection("history")}
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
          </nav>
        </aside>

        <main className="account-content">
          {activeSection === "account" && (
            <>
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
                      onChange={(event) =>
                        setUserName(event.target.value)
                      }
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div className="account-field">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(event) =>
                        setBirthDate(event.target.value)
                      }
                    />
                  </div>

                  <div className="account-field">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
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
                      onChange={(event) =>
                        setOldPassword(event.target.value)
                      }
                      placeholder="Nhập mật khẩu cũ"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="account-field">
                    <label>Mật khẩu mới *</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(event.target.value)
                      }
                      placeholder="Nhập mật khẩu mới"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="account-field">
                    <label>Xác nhận mật khẩu *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Nhập lại mật khẩu mới"
                      autoComplete="new-password"
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
            </>
          )}

          {activeSection === "membership" && (
            <Membership embedded />
          )}

          {activeSection === "history" && (
            <TicketHistory embedded />
          )}
        </main>
      </div>

      <NotificationPopup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </div>
  );
}

export default Account;
