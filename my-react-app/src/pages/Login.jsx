import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);

    alert("Đăng nhập thành công!");

    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        width: "100%",
        background:
          "linear-gradient(135deg, #0d162b 0%, #111a35 50%, #241344 100%)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Hiệu ứng background */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          right: "-100px",
          top: "-100px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(105,54,173,0.45), transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          right: "100px",
          bottom: "-200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(57,111,210,0.3), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Nội dung Login */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "1150px",
          margin: "0 auto",
          padding: "55px 20px 80px",
          boxSizing: "border-box",
        }}
      >
        {/* TABS */}
        <div
          style={{
            width: "650px",
            maxWidth: "100%",
            display: "flex",
          }}
        >
          <button
            type="button"
            style={{
              width: "50%",
              height: "52px",
              border: "none",
              background: "white",
              color: "#17233b",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              borderRadius: "5px 5px 0 0",
            }}
          >
            ĐĂNG NHẬP
          </button>

          <button
            type="button"
            onClick={() =>
              alert("Chức năng đăng ký sẽ được làm sau.")
            }
            style={{
              width: "50%",
              height: "52px",
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {/* FORM */}
        <div
          style={{
            width: "650px",
            maxWidth: "100%",
            background: "rgba(255,255,255,0.98)",
            padding: "55px 40px 40px",
            boxSizing: "border-box",
            borderRadius: "0 0 4px 4px",
          }}
        >
          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#17233b",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Email, Username hoặc Số điện thoại
                <span style={{ color: "#e63946" }}> *</span>
              </label>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  height: "52px",
                  padding: "0 15px",
                  boxSizing: "border-box",
                  border: "1px solid #dfe3ea",
                  outline: "none",
                  fontSize: "15px",
                  color: "#17233b",
                }}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#17233b",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Mật khẩu
                <span style={{ color: "#e63946" }}> *</span>
              </label>

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "52px",
                    padding: "0 50px 0 15px",
                    boxSizing: "border-box",
                    border: "1px solid #dfe3ea",
                    outline: "none",
                    fontSize: "15px",
                    color: "#17233b",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#17233b",
                  }}
                >
                  {showPassword ? "👁" : "◉"}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#555",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />

              Ghi nhớ đăng nhập
            </label>

            {/* FORGOT */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "38px",
                marginBottom: "22px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Chức năng quên mật khẩu sẽ được làm sau."
                  )
                }
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#17233b",
                  fontSize: "15px",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* LOGIN */}
            <button
              type="submit"
              style={{
                width: "100%",
                height: "50px",
                border: "none",
                borderRadius: "4px",
                background:
                  "linear-gradient(135deg, #6936ad, #396fd2)",
                color: "white",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ĐĂNG NHẬP
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;