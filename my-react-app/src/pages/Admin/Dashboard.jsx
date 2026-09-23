import { useEffect, useState } from "react";
import {
  FaFilm,
  FaTicketAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";

import "./Dashboard.css";

const MOVIES_KEY = "cinemaMovies";

const DEFAULT_MOVIES = [
  {
    movieId: 1,
    title: "Bắt Tiên!",
    genre: "Hoạt hình, Hài",
    status: "NowShowing",
  },
  {
    movieId: 2,
    title: "The Conjuring: Last Rites",
    genre: "Kinh dị",
    status: "NowShowing",
  },
  {
    movieId: 3,
    title: "Avatar: Fire and Ash",
    genre: "Hành động, Phiêu lưu",
    status: "ComingSoon",
  },
];

function Dashboard() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const loadMovies = () => {
      try {
        const savedMovies = localStorage.getItem(MOVIES_KEY);

        if (savedMovies) {
          setMovies(JSON.parse(savedMovies));
        } else {
          setMovies(DEFAULT_MOVIES);
        }
      } catch (error) {
        console.error("Không thể đọc danh sách phim:", error);
        setMovies(DEFAULT_MOVIES);
      }
    };

    loadMovies();

    // Khi Admin phim thay đổi
    window.addEventListener("moviesUpdated", loadMovies);

    // Khi localStorage thay đổi từ tab khác
    window.addEventListener("storage", loadMovies);

    return () => {
      window.removeEventListener("moviesUpdated", loadMovies);
      window.removeEventListener("storage", loadMovies);
    };
  }, []);

  const nowShowingMovies = movies.filter(
    (movie) => movie.status === "NowShowing"
  );

  const comingSoonMovies = movies.filter(
    (movie) => movie.status === "ComingSoon"
  );

  const users = Object.keys(localStorage).filter((key) =>
    key.startsWith("user_")
  );

  const totalUsers = users.length;

  const totalTickets = 0;
  const totalRevenue = 0;

  return (
    <main className="admin-dashboard">
      <div className="admin-container">

        {/* HEADER */}
        <div className="admin-page-header">
          <div>
            <h1>ADMIN DASHBOARD</h1>
            <p>Quản lý hệ thống đặt vé xem phim CinemaPass</p>
          </div>

          <div className="admin-date">
            <FaCalendarAlt />
            <span>Tháng 09/2026</span>
          </div>
        </div>

        {/* THỐNG KÊ */}
        <div className="admin-stat-grid">

          {/* PHIM */}
          <div className="admin-stat-card">
            <div className="stat-icon purple">
              <FaFilm />
            </div>

            <div className="stat-content">
              <span>Tổng số phim</span>
              <strong>{movies.length}</strong>
              <small>Phim trong CinemaPass</small>
            </div>
          </div>

          {/* VÉ */}
          <div className="admin-stat-card">
            <div className="stat-icon blue">
              <FaTicketAlt />
            </div>

            <div className="stat-content">
              <span>Vé đã bán</span>
              <strong>{totalTickets}</strong>
              <small>Chưa kết nối dữ liệu đặt vé</small>
            </div>
          </div>

          {/* NGƯỜI DÙNG */}
          <div className="admin-stat-card">
            <div className="stat-icon green">
              <FaUsers />
            </div>

            <div className="stat-content">
              <span>Người dùng</span>
              <strong>{totalUsers}</strong>
              <small>Tài khoản CinemaPass</small>
            </div>
          </div>

          {/* DOANH THU */}
          <div className="admin-stat-card">
            <div className="stat-icon orange">
              <FaMoneyBillWave />
            </div>

            <div className="stat-content">
              <span>Doanh thu</span>
              <strong>0đ</strong>
              <small>Chưa có dữ liệu thanh toán</small>
            </div>
          </div>

        </div>

        {/* NỘI DUNG */}
        <div className="admin-content-grid">

          {/* TÌNH TRẠNG PHIM */}
          <section className="admin-panel revenue-panel">

            <div className="panel-header">
              <div>
                <h2>
                  <FaChartLine />
                  Tình trạng phim
                </h2>

                <p>
                  Thống kê phim đang chiếu và phim sắp chiếu
                </p>
              </div>
            </div>

            <div className="revenue-chart">

              <div className="chart-y-axis">
                <span>{movies.length}</span>
                <span>{Math.ceil(movies.length / 2)}</span>
                <span>1</span>
                <span>0</span>
              </div>

              <div className="chart-area">

                <div className="chart-bars">

                  <div className="chart-column">
                    <div
                      className="chart-bar active"
                      style={{
                        height: `${Math.max(
                          (nowShowingMovies.length /
                            Math.max(movies.length, 1)) *
                            100,
                          15
                        )}%`,
                      }}
                    />

                    <span>Đang chiếu</span>
                  </div>

                  <div className="chart-column">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(
                          (comingSoonMovies.length /
                            Math.max(movies.length, 1)) *
                            100,
                          15
                        )}%`,
                      }}
                    />

                    <span>Sắp chiếu</span>
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* TỔNG QUAN PHIM */}
          <section className="admin-panel summary-panel">

            <div className="panel-header">
              <div>
                <h2>Danh sách phim</h2>
                <p>Tình trạng phim trong CinemaPass</p>
              </div>
            </div>

            <div className="summary-list">

              <div className="summary-item">
                <span>Tổng số phim</span>
                <strong>{movies.length}</strong>
              </div>

              <div className="summary-item">
                <span>Phim đang chiếu</span>
                <strong>{nowShowingMovies.length}</strong>
              </div>

              <div className="summary-item">
                <span>Phim sắp chiếu</span>
                <strong>{comingSoonMovies.length}</strong>
              </div>

              <div className="summary-total">
                <span>Hệ thống CinemaPass</span>
                <strong>Đang hoạt động</strong>
              </div>

            </div>

          </section>

        </div>

        {/* HOẠT ĐỘNG */}
        <section className="admin-panel activity-panel">

          <div className="panel-header">
            <div>
              <h2>Hoạt động quản trị</h2>
              <p>Các chức năng chính của hệ thống CinemaPass</p>
            </div>
          </div>

          <div className="activity-list">

            <div className="activity-item">
              <div className="activity-icon">
                <FaFilm />
              </div>

              <div className="activity-content">
                <strong>Quản lý phim</strong>
                <p>
                  Thêm, chỉnh sửa, tìm kiếm và xóa phim trong hệ thống
                </p>
              </div>

              <span>
                {movies.length} phim
              </span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <FaTicketAlt />
              </div>

              <div className="activity-content">
                <strong>Đặt vé xem phim</strong>
                <p>
                  Chức năng đặt vé sẽ được kết nối với dữ liệu đặt vé
                </p>
              </div>

              <span>
                Chưa có
              </span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <FaUsers />
              </div>

              <div className="activity-content">
                <strong>Quản lý người dùng</strong>
                <p>
                  Quản lý tài khoản khách hàng và tài khoản quản trị
                </p>
              </div>

              <span>
                {totalUsers} tài khoản
              </span>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default Dashboard;