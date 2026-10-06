import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaFilm,
  FaClock,
  FaCalendarAlt,
  FaUserTie,
  FaPlay,
  FaTicketAlt,
} from "react-icons/fa";

import "./MovieDetail.css";
import { API_BASE } from './constants';
const API_URL =`${API_BASE}/api/movies`;


// =========================
// ẢNH TRONG SRC/ASSETS
// =========================

const posterAssets = import.meta.glob(
  "../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);


// =========================
// XỬ LÝ POSTER URL
// =========================

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  // =========================
  // URL ĐẦY ĐỦ
  // =========================

  if (
    posterUrl.startsWith("http://") ||
    posterUrl.startsWith("https://")
  ) {
    return posterUrl;
  }


  // =========================
  // POSTER UPLOAD BACKEND
  // =========================

  if (
    posterUrl.startsWith("/uploads/")
  ) {
    return `http://localhost:5000${posterUrl}`;
  }


  // =========================
  // POSTER TRONG SRC/ASSETS
  // =========================

  const fileName = posterUrl
    .split("/")
    .pop()
    ?.toLowerCase();

  if (!fileName) {
    return "";
  }

  const asset = Object.entries(
    posterAssets
  ).find(
    ([path]) =>
      path
        .split("/")
        .pop()
        ?.toLowerCase() === fileName
  );

  if (asset) {
    return asset[1];
  }


  // Không tìm thấy asset
  return posterUrl;
};


// =========================
// FORMAT NGÀY
// =========================

const formatDate = (date) => {
  if (!date) {
    return "Chưa cập nhật";
  }

  const value = new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return date;
  }

  return value.toLocaleDateString(
    "vi-VN"
  );
};


// =========================
// TRẠNG THÁI PHIM
// =========================

const getStatusText = (status) => {
  if (
    status === "NowShowing"
  ) {
    return "ĐANG CHIẾU";
  }

  if (
    status === "ComingSoon"
  ) {
    return "SẮP CHIẾU";
  }

  if (
    status === "Ended"
  ) {
    return "ĐÃ KẾT THÚC";
  }

  return (
    status ||
    "CHƯA CẬP NHẬT"
  );
};


function MovieDetail() {

  const { id } = useParams();

  const navigate = useNavigate();


  // =========================
  // STATE
  // =========================

  const [movie, setMovie] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================
  // LẤY CHI TIẾT PHIM
  // =========================

  useEffect(() => {

    const loadMovie = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/${id}`
          );


        if (!response.ok) {

          throw new Error(
            "Không tìm thấy bộ phim"
          );

        }


        const data =
          await response.json();


        setMovie({
          ...data,

          posterUrl:
            getPosterUrl(
              data.posterUrl
            ),
        });

      } catch (err) {

        console.error(
          "Lỗi lấy chi tiết phim:",
          err
        );

        setMovie(null);

        setError(
          "Không thể tải thông tin bộ phim."
        );

      } finally {

        setLoading(false);

      }
    };


    loadMovie();

  }, [id]);


  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (

      <main className="movie-detail-page">

        <div className="movie-detail-message">

          <FaFilm />

          <h2>
            ĐANG TẢI PHIM...
          </h2>

          <p>
            Vui lòng chờ trong giây lát.
          </p>

        </div>

      </main>

    );

  }


  // =========================
  // ERROR
  // =========================

  if (error || !movie) {

    return (

      <main className="movie-detail-page">

        <div className="movie-detail-message error">

          <FaFilm />

          <h2>
            KHÔNG TÌM THẤY PHIM
          </h2>

          <p>
            {error ||
              "Bộ phim không tồn tại."}
          </p>


          {/* QUAY LẠI TRANG TRƯỚC */}
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            <FaArrowLeft />

            QUAY LẠI
          </button>

        </div>

      </main>

    );

  }


  // =========================
  // DETAIL
  // =========================

  return (

    <main className="movie-detail-page">

      <div className="movie-detail-container">


        {/* =========================
            QUAY LẠI
        ========================= */}

        <button
          type="button"
          className="movie-detail-back"
          onClick={() =>
            navigate(-1)
          }
        >
          <FaArrowLeft />

          Quay lại
        </button>


        {/* =========================
            CARD
        ========================= */}

        <section className="movie-detail-card">


          {/* =========================
              POSTER
          ========================= */}

          <div className="movie-detail-poster">

            {movie.posterUrl ? (

              <img
                src={movie.posterUrl}
                alt={movie.title}
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />

            ) : (

              <div className="movie-detail-poster-empty">

                <FaFilm />

                <span>
                  Chưa có poster
                </span>

              </div>

            )}

          </div>


          {/* =========================
              THÔNG TIN
          ========================= */}

          <div className="movie-detail-info">


            {/* TRẠNG THÁI */}

            <span
              className={`movie-detail-status ${
                movie.status ===
                "NowShowing"
                  ? "now-showing"
                  : "coming-soon"
              }`}
            >
              {getStatusText(
                movie.status
              )}
            </span>


            {/* TÊN PHIM */}

            <h1>
              {movie.title}
            </h1>


            {/* THỂ LOẠI */}

            <p className="movie-detail-genre">
              {movie.genre ||
                "Chưa cập nhật thể loại"}
            </p>


            {/* =========================
                META
            ========================= */}

            <div className="movie-detail-meta">


              {/* THỜI LƯỢNG */}

              <div>

                <FaClock />

                <span>

                  <small>
                    Thời lượng
                  </small>

                  {movie.duration
                    ? `${movie.duration} phút`
                    : "Chưa cập nhật"}

                </span>

              </div>


              {/* NGÀY KHỞI CHIẾU */}

              <div>

                <FaCalendarAlt />

                <span>

                  <small>
                    Ngày khởi chiếu
                  </small>

                  {formatDate(
                    movie.releaseDate
                  )}

                </span>

              </div>


              {/* ĐẠO DIỄN */}

              <div>

                <FaUserTie />

                <span>

                  <small>
                    Đạo diễn
                  </small>

                  {movie.director ||
                    "Chưa cập nhật"}

                </span>

              </div>


              {/* ĐỘ TUỔI */}

              <div>

                <FaFilm />

                <span>

                  <small>
                    Độ tuổi
                  </small>

                  {movie.ageRating ||
                    "Chưa cập nhật"}

                </span>

              </div>

            </div>


            {/* =========================
                NỘI DUNG
            ========================= */}

            <div className="movie-detail-description">

              <h2>
                NỘI DUNG PHIM
              </h2>

              <p>
                {movie.description ||
                  "Chưa có mô tả cho bộ phim này."}
              </p>

            </div>


            {/* =========================
                BUTTON
            ========================= */}

            <div className="movie-detail-actions">


              {/* TRAILER */}

              {movie.trailerUrl && (

                <a
                  href={
                    movie.trailerUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="movie-trailer-button"
                >

                  <FaPlay />

                  XEM TRAILER

                </a>

              )}


              {/* ĐẶT VÉ */}

              {movie.status ===
                "NowShowing" && (

                <button
                  type="button"
                  className="movie-ticket-button"
                  onClick={() =>
                    navigate(
                      `/booking?movieId=${movie.movieId}`
                    )
                  }
                >

                  <FaTicketAlt />

                  ĐẶT VÉ NGAY

                </button>

              )}

            </div>

          </div>

        </section>

      </div>

    </main>

  );

}

export default MovieDetail;