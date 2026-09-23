import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Food from "./pages/Food";
import Account from "./pages/Account";

import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import MovieAdmin from "./pages/Admin/MovieAdmin";

import "./App.css";

function App() {
  return (
    <>
      <Header />

      <Routes>

        {/* =========================
            USER
        ========================= */}

        {/* Trang chủ */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Đăng nhập */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Đặt bắp nước */}
        <Route
          path="/food"
          element={<Food />}
        />

        {/* Tài khoản */}
        <Route
          path="/account"
          element={<Account />}
        />


        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* /admin */}
          <Route
            index
            element={<Dashboard />}
          />

          {/* /admin/movies */}
          <Route
            path="movies"
            element={<MovieAdmin />}
          />

          {/* /admin/users */}
          <Route
            path="users"
            element={
              <div>
                <h1>Quản lý người dùng</h1>
              </div>
            }
          />

          {/* /admin/tickets */}
          <Route
            path="tickets"
            element={
              <div>
                <h1>Quản lý vé</h1>
              </div>
            }
          />

          {/* /admin/food */}
          <Route
            path="food"
            element={
              <div>
                <h1>Quản lý bắp nước</h1>
              </div>
            }
          />

        </Route>


        {/* =========================
            KHÔNG TÌM THẤY TRANG
        ========================= */}

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

      <Footer />
    </>
  );
}

export default App;