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

const MOVIES_API =
  "http://localhost:5000/api/movies";

const USERS_COUNT_API =
  "http://localhost:5000/api/auth/users/count";


function Dashboard() {

  // =========================
  // STATE
  // =========================

  const [movies, setMovies] = useState([]);

  const [totalUsers, setTotalUsers] =
    useState(0);

  const [loadingMovies, setLoadingMovies] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  // Vé và doanh thu chưa có bảng/API
  const totalTickets = null;

  const totalRevenue = null;


  // =========================
  // LẤY PHIM TỪ SQL SERVER
  // =========================

  const loadMovies = async () => {

    try {

      setLoadingMovies(true);

      const response = await fetch(
        MOVIES_API
      );

      if (!response.ok) {

        throw new Error(
          "Không thể lấy dữ liệu phim"
        );

      }

      const data =
        await response.json();

      setMovies(data);

    } catch (error) {

      console.error(
        "Lỗi lấy phim:",
        error
      );

      setMovies([]);

    } finally {

      setLoadingMovies(false);

    }
  };


  // =========================
  // LẤY SỐ USER TỪ SQL SERVER
  // =========================

  const loadTotalUsers = async () => {

    try {

      setLoadingUsers(true);

      const response =
        await fetch(
          USERS_COUNT_API
        );

      if (!response.ok) {

        throw new Error(
          "Không thể lấy số người dùng"
        );

      }

      const data =
        await response.json();

      setTotalUsers(
        data.totalUsers ?? 0
      );

    } catch (error) {

      console.error(
        "Lỗi lấy người dùng:",
        error
      );

      setTotalUsers(0);

    } finally {

      setLoadingUsers(false);

    }
  };


  // =========================
  // LOAD DỮ LIỆU
  // =========================

  useEffect(() => {

    loadMovies();

    loadTotalUsers();

  }, []);


  // =========================
  // THỐNG KÊ PHIM
  // =========================

  const nowShowingMovies =
    movies.filter(
      (movie) =>
        movie.status ===
        "NowShowing"
    );

  const comingSoonMovies =
    movies.filter(
      (movie) =>
        movie.status ===
        "ComingSoon"
    );

  const endedMovies =
    movies.filter(
      (movie) =>
        movie.status ===
        "Ended"
    );


  // =========================
  // TỶ LỆ BIỂU ĐỒ
  // =========================

  const totalMovies =
    movies.length;

  const movieMax =
    Math.max(
      totalMovies,
      1
    );

  const nowShowingPercent =
    (nowShowingMovies.length /
      movieMax) *
    100;

  const comingSoonPercent =
    (comingSoonMovies.length /
      movieMax) *
    100;


  // =========================
  // FORMAT DOANH THU
  // =========================

  const formatRevenue = () => {

    if (
      totalRevenue === null
    ) {
      return "Chưa có";
    }

    return `${totalRevenue.toLocaleString(
      "vi-VN"
    )}đ`;
  };


  return (

    <main className="admin-dashboard">

      <div className="admin-container">


        {/* =========================
            HEADER
        ========================= */}

        <div className="admin-page-header">

          <div>

            <h1>
              ADMIN DASHBOARD
            </h1>

            <p>
              Quản lý hệ thống đặt vé xem phim CinemaPass
            </p>

          </div>

          <div className="admin-date">

            <FaCalendarAlt />

            <span>
              Tháng 09/2026
            </span>

          </div>

        </div>


        {/* =========================
            THỐNG KÊ
        ========================= */}

        <div className="admin-stat-grid">


          {/* =========================
              PHIM
          ========================= */}

          <div className="admin-stat-card">

            <div className="stat-icon purple">

              <FaFilm />

            </div>

            <div className="stat-content">

              <span>
                Tổng số phim
              </span>

              <strong>

                {loadingMovies
                  ? "..."
                  : movies.length}

              </strong>

              <small>
                Dữ liệu từ SQL Server
              </small>

            </div>

          </div>


          {/* =========================
              VÉ
          ========================= */}

          <div className="admin-stat-card">

            <div className="stat-icon blue">

              <FaTicketAlt />

            </div>

            <div className="stat-content">

              <span>
                Vé đã bán
              </span>

              <strong>

                {totalTickets ===
                null
                  ? "Chưa có"
                  : totalTickets}

              </strong>

              <small>
                Chưa có dữ liệu đặt vé
              </small>

            </div>

          </div>


          {/* =========================
              USERS
          ========================= */}

          <div className="admin-stat-card">

            <div className="stat-icon green">

              <FaUsers />

            </div>

            <div className="stat-content">

              <span>
                Người dùng
              </span>

              <strong>

                {loadingUsers
                  ? "..."
                  : totalUsers}

              </strong>

              <small>
                Dữ liệu từ SQL Server
              </small>

            </div>

          </div>


          {/* =========================
              DOANH THU
          ========================= */}

          <div className="admin-stat-card">

            <div className="stat-icon orange">

              <FaMoneyBillWave />

            </div>

            <div className="stat-content">

              <span>
                Doanh thu
              </span>

              <strong>
                {formatRevenue()}
              </strong>

              <small>
                Chưa có dữ liệu thanh toán
              </small>

            </div>

          </div>

        </div>


        {/* =========================
            CONTENT GRID
        ========================= */}

        <div className="admin-content-grid">


          {/* =========================
              TÌNH TRẠNG PHIM
          ========================= */}

          <section className="admin-panel revenue-panel">

            <div className="panel-header">

              <div>

                <h2>

                  <FaChartLine />

                  Tình trạng phim

                </h2>

                <p>
                  Thống kê dữ liệu phim từ SQL Server
                </p>

              </div>

            </div>


            <div className="revenue-chart">


              {/* Y AXIS */}

              <div className="chart-y-axis">

                <span>
                  {totalMovies}
                </span>

                <span>
                  {Math.ceil(
                    totalMovies / 2
                  )}
                </span>

                <span>
                  1
                </span>

                <span>
                  0
                </span>

              </div>


              <div className="chart-area">

                <div className="chart-bars">


                  {/* ĐANG CHIẾU */}

                  <div className="chart-column">

                    <div
                      className="chart-bar active"
                      style={{
                        height: `${Math.max(
                          nowShowingPercent,
                          totalMovies > 0
                            ? 15
                            : 0
                        )}%`,
                      }}
                    />

                    <span>
                      Đang chiếu
                    </span>

                    <strong>
                      {
                        nowShowingMovies.length
                      }
                    </strong>

                  </div>


                  {/* SẮP CHIẾU */}

                  <div className="chart-column">

                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(
                          comingSoonPercent,
                          totalMovies > 0
                            ? 15
                            : 0
                        )}%`,
                      }}
                    />

                    <span>
                      Sắp chiếu
                    </span>

                    <strong>
                      {
                        comingSoonMovies.length
                      }
                    </strong>

                  </div>


                  {/* ĐÃ KẾT THÚC */}

                  <div className="chart-column">

                    <div
                      className="chart-bar ended"
                      style={{
                        height: `${Math.max(
                          (endedMovies.length /
                            movieMax) *
                            100,
                          totalMovies > 0
                            ? 15
                            : 0
                        )}%`,
                      }}
                    />

                    <span>
                      Đã kết thúc
                    </span>

                    <strong>
                      {endedMovies.length}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =========================
              TỔNG QUAN
          ========================= */}

          <section className="admin-panel summary-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Danh sách phim
                </h2>

                <p>
                  Tình trạng phim trong CinemaPass
                </p>

              </div>

            </div>


            <div className="summary-list">


              <div className="summary-item">

                <span>
                  Tổng số phim
                </span>

                <strong>
                  {movies.length}
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Phim đang chiếu
                </span>

                <strong>
                  {
                    nowShowingMovies.length
                  }
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Phim sắp chiếu
                </span>

                <strong>
                  {
                    comingSoonMovies.length
                  }
                </strong>

              </div>


              <div className="summary-item">

                <span>
                  Phim đã kết thúc
                </span>

                <strong>
                  {endedMovies.length}
                </strong>

              </div>


              <div className="summary-total">

                <span>
                  Hệ thống CinemaPass
                </span>

                <strong>
                  Đang hoạt động
                </strong>

              </div>

            </div>

          </section>

        </div>


        {/* =========================
            HOẠT ĐỘNG QUẢN TRỊ
        ========================= */}

        <section className="admin-panel activity-panel">

          <div className="panel-header">

            <div>

              <h2>
                Hoạt động quản trị
              </h2>

              <p>
                Dữ liệu và chức năng chính của CinemaPass
              </p>

            </div>

          </div>


          <div className="activity-list">


            {/* PHIM */}

            <div className="activity-item">

              <div className="activity-icon">

                <FaFilm />

              </div>

              <div className="activity-content">

                <strong>
                  Quản lý phim
                </strong>

                <p>
                  Thêm, chỉnh sửa, tìm kiếm và xóa phim trong hệ thống
                </p>

              </div>

              <span>
                {movies.length} phim
              </span>

            </div>


            {/* VÉ */}

            <div className="activity-item">

              <div className="activity-icon">

                <FaTicketAlt />

              </div>

              <div className="activity-content">

                <strong>
                  Đặt vé xem phim
                </strong>

                <p>
                  Chức năng đặt vé chưa kết nối cơ sở dữ liệu
                </p>

              </div>

              <span>
                Chưa có
              </span>

            </div>


            {/* USER */}

            <div className="activity-item">

              <div className="activity-icon">

                <FaUsers />

              </div>

              <div className="activity-content">

                <strong>
                  Quản lý người dùng
                </strong>

                <p>
                  Dữ liệu tài khoản được lấy trực tiếp từ SQL Server
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