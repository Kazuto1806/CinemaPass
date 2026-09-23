import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationPopup from "../components/NotificationPopup";
import "./Login.css";

const API_URL = "http://localhost:5000/api/auth";

function Login() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

  // =========================
  // POPUP
  // =========================

  const [popup, setPopup] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showPopup = (type, title, message) => {
    setPopup({
      show: true,
      type,
      title,
      message,
    });
  };

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      show: false,
    }));
  };

  // =========================
  // LOGIN
  // =========================

  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);

  // =========================
  // REGISTER
  // =========================

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState("");

  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);

  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginAccount.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập Email, Username hoặc Số điện thoại!"
      );
      return;
    }

    if (!loginPassword.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập mật khẩu!"
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: loginAccount,
          Password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showPopup(
          "error",
          "Đăng nhập thất bại",
          data.message || "Đăng nhập thất bại!"
        );
        return;
      }

      // =========================
      // LƯU THÔNG TIN USER
      // =========================

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userEmail", data.email);

      // Header.jsx lấy userName
      localStorage.setItem("userName", data.fullName);

      localStorage.setItem("phone", data.phone || "");

      // QUAN TRỌNG: LƯU ROLE
      localStorage.setItem("userRole", data.role);

      // =========================
      // LƯU ĐĂNG NHẬP
      // =========================

      if (rememberLogin) {
        localStorage.setItem("rememberLogin", "true");
      } else {
        localStorage.removeItem("rememberLogin");
      }

      // =========================
      // BÁO CHO HEADER CẬP NHẬT
      // =========================

      window.dispatchEvent(new Event("userLogin"));

      showPopup(
        "success",
        "Đăng nhập thành công",
        "Chào mừng bạn đến với Cinema Pass!"
      );

      // =========================
      // CHUYỂN TRANG THEO ROLE
      // =========================

      setTimeout(() => {
        if (data.role === "Admin") {
          navigate("/admin/movies");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (err) {
      console.error(err);

      showPopup(
        "error",
        "Lỗi kết nối",
        "Không kết nối được server!"
      );
    }
  };

  // =========================
  // REGISTER
  // =========================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerName.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập họ và tên!"
      );
      return;
    }

    if (!registerEmail.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập Email!"
      );
      return;
    }

    if (!registerPhone.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập số điện thoại!"
      );
      return;
    }

    if (!registerPassword.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập mật khẩu!"
      );
      return;
    }

    if (registerPassword.length < 6) {
      showPopup(
        "warning",
        "Mật khẩu không hợp lệ",
        "Mật khẩu phải có ít nhất 6 ký tự!"
      );
      return;
    }

    if (!registerConfirmPassword.trim()) {
      showPopup(
        "warning",
        "Thiếu thông tin",
        "Vui lòng xác nhận mật khẩu!"
      );
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      showPopup(
        "error",
        "Mật khẩu không khớp",
        "Mật khẩu xác nhận không trùng khớp!"
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FullName: registerName,
          Email: registerEmail,
          Phone: registerPhone,
          PasswordHash: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showPopup(
          "error",
          "Đăng ký thất bại",
          data.message || "Đăng ký thất bại!"
        );
        return;
      }

      showPopup(
        "success",
        "Đăng ký thành công",
        "Tài khoản Cinema Pass đã được tạo!"
      );

      // Chuyển về đăng nhập
      setIsRegister(false);

      // Xóa dữ liệu form
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (err) {
      console.error(err);

      showPopup(
        "error",
        "Lỗi kết nối",
        "Không kết nối được server!"
      );
    }
  };

  return (
    <main className="login-page">

      {/* =========================
          BACKGROUND
      ========================= */}

      <div className="login-overlay"></div>

      <div className="cinema-light light-one"></div>
      <div className="cinema-light light-two"></div>
      <div className="cinema-light light-three"></div>

      {/* =========================
          LOGIN CONTAINER
      ========================= */}

      <div className="login-container">

        {/* =========================
            TABS
        ========================= */}

        <div className="login-tabs">

          <button
            type="button"
            className={`login-tab ${
              !isRegister ? "active" : ""
            }`}
            onClick={() => setIsRegister(false)}
          >
            ĐĂNG NHẬP
          </button>

          <button
            type="button"
            className={`login-tab ${
              isRegister ? "active" : ""
            }`}
            onClick={() => setIsRegister(true)}
          >
            ĐĂNG KÝ
          </button>

        </div>

        {/* =========================
            LOGIN
        ========================= */}

        {!isRegister && (
          <div className="login-box">

            <div className="login-heading">
              <h1>Đăng nhập</h1>

              <p>
                Đăng nhập để tiếp tục sử dụng Cinema Pass
              </p>
            </div>

            <form onSubmit={handleLogin}>

              {/* Account */}

              <div className="login-field">

                <label>
                  Tài khoản, Email hoặc số điện thoại
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={loginAccount}
                  onChange={(e) =>
                    setLoginAccount(e.target.value)
                  }
                  placeholder="Nhập tài khoản, Email hoặc số điện thoại"
                />

              </div>

              {/* Password */}

              <div className="login-field">

                <label>
                  Mật khẩu
                  <span>*</span>
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showLoginPassword
                        ? "text"
                        : "password"
                    }
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(e.target.value)
                    }
                    placeholder="Nhập mật khẩu"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowLoginPassword(
                        !showLoginPassword
                      )
                    }
                  >
                    {showLoginPassword ? "ẨN" : "HIỆN"}
                  </button>

                </div>

              </div>

              {/* Remember + Forgot */}

              <div className="login-options">

                <label className="remember-login">

                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) =>
                      setRememberLogin(e.target.checked)
                    }
                  />

                  <span>Lưu mật khẩu đăng nhập</span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    showPopup(
                      "warning",
                      "Thông báo",
                      "Chức năng quên mật khẩu đang được phát triển."
                    )
                  }
                >
                  Quên mật khẩu?
                </button>

              </div>

              {/* Login button */}

              <button
                type="submit"
                className="login-submit"
              >
                ĐĂNG NHẬP
              </button>

            </form>

            {/* Register */}

            <div className="bottom-register">

              <span>Chưa có tài khoản?</span>

              <button
                type="button"
                onClick={() => setIsRegister(true)}
              >
                ĐĂNG KÝ NGAY
              </button>

            </div>

          </div>
        )}

        {/* =========================
            REGISTER
        ========================= */}

        {isRegister && (
          <div className="login-box register-box">

            <div className="login-heading">

              <h1>Đăng ký</h1>

              <p>
                Tạo tài khoản Cinema Pass của bạn
              </p>

            </div>

            <form onSubmit={handleRegister}>

              {/* Name */}

              <div className="login-field">

                <label>
                  Họ và tên
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={registerName}
                  onChange={(e) =>
                    setRegisterName(e.target.value)
                  }
                  placeholder="Nhập họ và tên"
                />

              </div>

              {/* Email */}

              <div className="login-field">

                <label>
                  Email
                  <span>*</span>
                </label>

                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) =>
                    setRegisterEmail(e.target.value)
                  }
                  placeholder="Nhập Email"
                />

              </div>

              {/* Phone */}

              <div className="login-field">

                <label>
                  Số điện thoại
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) =>
                    setRegisterPhone(e.target.value)
                  }
                  placeholder="Nhập số điện thoại"
                />

              </div>

              {/* Password */}

              <div className="login-field">

                <label>
                  Mật khẩu
                  <span>*</span>
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showRegisterPassword
                        ? "text"
                        : "password"
                    }
                    value={registerPassword}
                    onChange={(e) =>
                      setRegisterPassword(e.target.value)
                    }
                    placeholder="Nhập mật khẩu"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowRegisterPassword(
                        !showRegisterPassword
                      )
                    }
                  >
                    {showRegisterPassword
                      ? "ẨN"
                      : "HIỆN"}
                  </button>

                </div>

              </div>

              {/* Confirm Password */}

              <div className="login-field">

                <label>
                  Xác nhận mật khẩu
                  <span>*</span>
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showRegisterConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={registerConfirmPassword}
                    onChange={(e) =>
                      setRegisterConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Nhập lại mật khẩu"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowRegisterConfirmPassword(
                        !showRegisterConfirmPassword
                      )
                    }
                  >
                    {showRegisterConfirmPassword
                      ? "ẨN"
                      : "HIỆN"}
                  </button>

                </div>

              </div>

              {/* Register button */}

              <button
                type="submit"
                className="login-submit"
              >
                ĐĂNG KÝ
              </button>

            </form>

            {/* Back to login */}

            <div className="bottom-register">

              <span>Đã có tài khoản?</span>

              <button
                type="button"
                onClick={() => setIsRegister(false)}
              >
                ĐĂNG NHẬP
              </button>

            </div>

          </div>
        )}

      </div>

      {/* =========================
          NOTIFICATION POPUP
      ========================= */}

      <NotificationPopup
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />

    </main>
  );
}

export default Login;