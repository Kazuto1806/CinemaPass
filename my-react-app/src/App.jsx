import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Food from "./pages/Food";
import Account from "./pages/Account";
import MovieSearch from "./pages/MovieSearch";
import MovieDetail from "./pages/MovieDetail";
import Booking from "./pages/Booking";

import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import MovieAdmin from "./pages/Admin/MovieAdmin";
import UserAdmin from "./pages/Admin/UserAdmin";
import TicketAdmin from "./pages/Admin/TicketAdmin";
import FoodAdmin from "./pages/Admin/FoodAdmin";

import CinemaAdmin from "./pages/Admin/CinemaAdmin";
import ShowtimeAdmin from "./pages/Admin/ShowtimeAdmin";
import RoomAdmin from "./pages/Admin/RoomAdmin";
import SeatAdmin from "./pages/Admin/SeatAdmin";
import SeatsAdmin from "./pages/Admin/SeatsAdmin";
import TicketTypeAdmin from "./pages/Admin/TicketTypeAdmin";
import FoodOrderAdmin from "./pages/Admin/FoodOrderAdmin";
import PaymentAdmin from "./pages/Admin/PaymentAdmin";

import "./App.css";

function App() {
  return (
    <>
      <Header />

      <Routes>
        {/* =========================
            USER
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/food" element={<Food />} />

        <Route path="/account" element={<Account />} />

        {/* =========================
            TÌM KIẾM PHIM
        ========================= */}

        <Route
          path="/search"
          element={<MovieSearch />}
        />

        {/* =========================
            CHI TIẾT PHIM
        ========================= */}

        <Route
          path="/movie/:id"
          element={<MovieDetail />}
        />

        {/* =========================
            ĐẶT VÉ
        ========================= */}

        <Route
          path="/booking"
          element={<Booking />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          {/* DASHBOARD */}

          <Route
            index
            element={<Dashboard />}
          />

          {/* QUẢN LÝ PHIM */}

          <Route
            path="movies"
            element={<MovieAdmin />}
          />

          {/* QUẢN LÝ NGƯỜI DÙNG */}

          <Route
            path="users"
            element={<UserAdmin />}
          />

          {/* QUẢN LÝ VÉ */}

          <Route
            path="tickets"
            element={<TicketAdmin />}
          />

          {/* QUẢN LÝ BẮP NƯỚC */}

          <Route
            path="food"
            element={<FoodAdmin />}
          />

          {/* QUẢN LÝ ĐƠN BẮP NƯỚC */}

          <Route
            path="food-orders"
            element={<FoodOrderAdmin />}
          />

          {/* QUẢN LÝ THANH TOÁN */}

          <Route
            path="payments"
            element={<PaymentAdmin />}
          />

          {/* QUẢN LÝ RẠP */}

          <Route
            path="cinemas"
            element={<CinemaAdmin />}
          />

          {/* QUẢN LÝ PHÒNG CHIẾU */}

          <Route
            path="rooms"
            element={<RoomAdmin />}
          />

          {/* QUẢN LÝ GHẾ */}

          <Route
            path="seat"
            element={<SeatAdmin />}
          />

          {/* QUẢN LÝ SUẤT CHIẾU */}

          <Route
            path="showtimes"
            element={<ShowtimeAdmin />}
          />

          {/* QUẢN LÝ LOẠI VÉ */}

          <Route
            path="ticket-types"
            element={<TicketTypeAdmin />}
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