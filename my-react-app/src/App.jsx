
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { NotificationProvider } from "./components/NotificationProvider";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Food = lazy(() => import("./pages/Food"));
const Account = lazy(() => import("./pages/Account"));
const Membership = lazy(() => import("./pages/Membership"));
const MovieSearch = lazy(() => import("./pages/MovieSearch"));
const MovieList = lazy(() => import("./pages/MovieList"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const Booking = lazy(() => import("./pages/Booking"));
const TicketHistory = lazy(() => import("./pages/TicketHistory"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const CinemaNews = lazy(() => import("./pages/CinemaNews"));

const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard"));
const MovieAdmin = lazy(() => import("./pages/Admin/MovieAdmin"));
const UserAdmin = lazy(() => import("./pages/Admin/UserAdmin"));
const TicketAdmin = lazy(() => import("./pages/Admin/TicketAdmin"));
const FoodAdmin = lazy(() => import("./pages/Admin/FoodAdmin"));
const ReportAdmin = lazy(() => import("./pages/Admin/ReportAdmin"));
const CinemaAdmin = lazy(() => import("./pages/Admin/CinemaAdmin"));
const ShowtimeAdmin = lazy(() => import("./pages/Admin/ShowtimeAdmin"));
const RoomAdmin = lazy(() => import("./pages/Admin/RoomAdmin"));
const SeatAdmin = lazy(() => import("./pages/Admin/SeatAdmin"));
const TicketTypeAdmin = lazy(() => import("./pages/Admin/TicketTypeAdmin"));
const FoodOrderAdmin = lazy(() => import("./pages/Admin/FoodOrderAdmin"));
const PaymentAdmin = lazy(() => import("./pages/Admin/PaymentAdmin"));
const BannerAdmin = lazy(() => import("./pages/Admin/BannerAdmin"));

import "./App.css";

function App() {
  return (
    <NotificationProvider>
      <Header />

      <Suspense fallback={<div className="app-route-loading" aria-label="Đang tải trang">Đang tải...</div>}>
        <Routes>
        {/* =========================
            USER
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/food" element={<Food />} />

        <Route path="/account" element={<Account />} />

        {/* THÀNH VIÊN CINEMAPASS */}
        <Route
          path="/membership"
          element={<Membership />}
        />

        {/* =========================
            LỊCH SỬ MUA HÀNG
        ========================= */}

        <Route
          path="/tickets"
          element={<TicketHistory />}
        />

        {/* =========================
            TÌM KIẾM PHIM
        ========================= */}

        <Route
          path="/search"
          element={<MovieSearch />}
        />

        {/* =========================
            DANH SÁCH PHIM
        ========================= */}

        <Route
          path="/movies/:type"
          element={<MovieList />}
        />

        {/* =========================
            CHI TIẾT PHIM
        ========================= */}

        <Route
          path="/movie/:movieName"
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
            THÔNG TIN
        ========================= */}

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/cinema-news" element={<CinemaNews />} />

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

          <Route
            path="banners"
            element={<BannerAdmin />}
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
            path="seats"
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

          {/* BÁO CÁO & THỐNG KÊ */}

          <Route
            path="reports"
            element={<ReportAdmin />}
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
      </Suspense>

      <Footer />
    </NotificationProvider>
  );
}

export default App;
