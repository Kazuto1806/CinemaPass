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
import { API_BASE, getMissingPosterFallback } from '../constants';
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

  const normalized = String(posterUrl).trim();
  const fallback = getMissingPosterFallback(normalized);

  if (fallback) return fallback;

  // =========================
  // URL ĐẦY ĐỦ
  // =========================

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }


  // =========================
  // POSTER UPLOAD BACKEND
  // =========================

  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }


  // =========================
  // POSTER TRONG SRC/ASSETS
  // =========================

  const fileName = normalized
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
  return normalized;
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
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
                      <rect width="600" height="900" fill="#1f2937"/>
                      <rect x="40" y="40" width="520" height="820" rx="24" fill="#111827" stroke="#374151" stroke-width="4"/>
                      <circle cx="300" cy="320" r="110" fill="#374151"/>
                      <path d="M220 470C250 430 270 420 300 420C330 420 350 430 380 470L420 610H180L220 470Z" fill="#374151"/>
                      <text x="300" y="750" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="42" font-weight="700">NO POSTER</text>
                    </svg>
                  `)}`;
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
                      `/booking?movieName=${encodeURIComponent(movie.title)}`
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