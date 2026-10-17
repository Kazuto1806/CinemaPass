import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationPopup from "../components/NotificationPopup";
import "./Login.css";
import { API_BASE } from "../constants";

const API_URL = `${API_BASE}/api/auth`;

// Email phải có dạng ten@mien.com, không có khoảng trắng.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Số điện thoại Việt Nam: 10 chữ số và bắt đầu bằng 0.
const PHONE_REGEX = /^0\d{9}$/;

function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "Chưa nhập mật khẩu", color: "#64748b" };
  }

  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  if (score <= 2) {
    return { score, label: "Yếu", color: "#ef4444" };
  }

  if (score <= 4) {
    return { score, label: "Trung bình", color: "#f59e0b" };
  }

  return { score, label: "Mạnh", color: "#22c55e" };
}

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

      const data = await res.json().catch(() => ({}));

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
          return;
        }

        // Neu nguoi dung duoc chuyen den trang dang nhap tu luong dat ve,
        // quay lai dung trang do sau khi dang nhap thanh cong.
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl");
        const safeReturnUrl =
          returnUrl &&
          returnUrl.startsWith("/") &&
          !returnUrl.startsWith("//") &&
          !returnUrl.includes("\\")
            ? returnUrl
            : "/";

        navigate(safeReturnUrl);
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

    const fullName = registerName.trim();
    const email = registerEmail.trim().toLowerCase();
    const phone = registerPhone.trim();

    if (!fullName) {
      showPopup("warning", "Thiếu thông tin", "Vui lòng nhập họ và tên!");
      return;
    }

    if (!email) {
      showPopup("warning", "Thiếu thông tin", "Vui lòng nhập Email!");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      showPopup(
        "warning",
        "Email không hợp lệ",
        "Vui lòng nhập đúng định dạng Email, ví dụ: ten@gmail.com."
      );
      return;
    }

    if (!phone) {
      showPopup("warning", "Thiếu thông tin", "Vui lòng nhập số điện thoại!");
      return;
    }

    if (!PHONE_REGEX.test(phone)) {
      showPopup(
        "warning",
        "Số điện thoại không hợp lệ",
        "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0."
      );
      return;
    }

    if (!registerPassword) {
      showPopup("warning", "Thiếu thông tin", "Vui lòng nhập mật khẩu!");
      return;
    }

    if (registerPassword.length < 8) {
      showPopup(
        "warning",
        "Mật khẩu chưa đủ mạnh",
        "Mật khẩu phải có ít nhất 8 ký tự."
      );
      return;
    }

    if (!/[a-z]/.test(registerPassword)) {
      showPopup(
        "warning",
        "Mật khẩu chưa hợp lệ",
        "Mật khẩu phải có ít nhất một chữ cái viết thường (a-z)."
      );
      return;
    }

    if (!/[A-Z]/.test(registerPassword)) {
      showPopup(
        "warning",
        "Mật khẩu chưa hợp lệ",
        "Mật khẩu phải có ít nhất một chữ cái viết hoa (A-Z)."
      );
      return;
    }

    if (!/\d/.test(registerPassword)) {
      showPopup(
        "warning",
        "Mật khẩu chưa hợp lệ",
        "Mật khẩu phải có ít nhất một chữ số (0-9)."
      );
      return;
    }

    if (!registerConfirmPassword) {
      showPopup("warning", "Thiếu thông tin", "Vui lòng xác nhận mật khẩu!");
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
          FullName: fullName,
          Email: email,
          Phone: phone,
          PasswordHash: registerPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showPopup(
          "error",
          "Đăng ký thất bại",
          data.message || "Đăng ký thất bại! Vui lòng kiểm tra thông tin."
        );
        return;
      }

      showPopup(
        "success",
        "Đăng ký thành công",
        "Tài khoản Cinema Pass đã được tạo! Ông có thể đăng nhập."
      );

      setIsRegister(false);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      showPopup(
        "error",
        "Lỗi kết nối",
        "Không kết nối được máy chủ. Vui lòng thử lại sau."
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
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="Ví dụ: ten@gmail.com"
                  aria-describedby="register-email-hint"
                />
                <small
                  id="register-email-hint"
                  style={{ display: "block", marginTop: 6, color: "#94a3b8", fontSize: 12 }}
                >
                  Nhập email đúng định dạng, ví dụ ten@gmail.com.
                </small>

              </div>

              {/* Phone */}

              <div className="login-field">

                <label>
                  Số điện thoại
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  value={registerPhone}
                  onChange={(e) =>
                    setRegisterPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="Ví dụ: 0912345678"
                  aria-describedby="register-phone-hint"
                />
                <small
                  id="register-phone-hint"
                  style={{ display: "block", marginTop: 6, color: "#94a3b8", fontSize: 12 }}
                >
                  Chỉ nhập 10 chữ số, bắt đầu bằng số 0.
                </small>

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
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự, có chữ hoa và số"
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

                {/* ĐỘ MẠNH MẬT KHẨU */}
                {(() => {
                  const strength = getPasswordStrength(registerPassword);
                  const segments = [1, 2, 3, 4, 5, 6];

                  return (
                    <div style={{ marginTop: 8 }} aria-live="polite">
                      <div style={{ display: "flex", gap: 4 }}>
                        {segments.map((segment) => (
                          <span
                            key={segment}
                            style={{
                              display: "block",
                              flex: 1,
                              height: 4,
                              borderRadius: 4,
                              backgroundColor:
                                registerPassword && segment <= strength.score
                                  ? strength.color
                                  : "#334155",
                            }}
                          />
                        ))}
                      </div>
                      <small
                        style={{
                          display: "block",
                          marginTop: 6,
                          color: strength.color,
                          fontSize: 12,
                        }}
                      >
                        Độ mạnh: {strength.label}
                        {registerPassword ? ` (${registerPassword.length} ký tự)` : ""}
                      </small>
                      <small
                        style={{ display: "block", marginTop: 3, color: "#94a3b8", fontSize: 12 }}
                      >
                        Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số. Thêm ký tự đặc biệt để mạnh hơn.
                      </small>
                    </div>
                  );
                })()}

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
                      setRegisterConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
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