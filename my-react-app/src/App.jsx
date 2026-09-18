import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer"
import Home from "./pages/Home";
import Login from "./pages/Login";
import Food from "./pages/Food";
import Account from "./pages/Account";
import "./App.css";

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<Home />} />

        {/* Trang đăng nhập */}
        <Route path="/login" element={<Login />} />

        {/* Trang đặt bắp nước */}
        <Route path="/food" element={<Food />} />
        {/* Trang tài khoản */}
        <Route path="/account" element={<Account />} />
        {/* Trang không tồn tại */}
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "70vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              Không tìm thấy trang
            </div>
          }
        />
      </Routes>
      <Footer/>
    </>
  );
}

export default App;