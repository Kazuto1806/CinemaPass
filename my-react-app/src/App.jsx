import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Food from "./pages/Food";
import Account from "./pages/Account";
import MovieSearch from "./pages/MovieSearch";
import MovieDetail from "./pages/MovieDetail";

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

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/food"
          element={<Food />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        {/* =========================
            TÌM KIẾM PHIM
            /search
            /search?keyword=...
        ========================= */}

        <Route
          path="/search"
          element={<MovieSearch />}
        />

        {/* =========================
            CHI TIẾT PHIM
            /movie/1
        ========================= */}

        <Route
          path="/movie/:id"
          element={<MovieDetail />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          <Route
            index
            element={<Dashboard />}
          />

          <Route
            path="movies"
            element={<MovieAdmin />}
          />

          <Route
            path="users"
            element={
              <div>
                <h1>
                  Quản lý người dùng
                </h1>
              </div>
            }
          />

          <Route
            path="tickets"
            element={
              <div>
                <h1>
                  Quản lý vé
                </h1>
              </div>
            }
          />

          <Route
            path="food"
            element={
              <div>
                <h1>
                  Quản lý bắp nước
                </h1>
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