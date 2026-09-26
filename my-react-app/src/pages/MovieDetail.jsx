import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const API_URL = "http://localhost:5000/api/movies";

const posterAssets = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  const fileName = posterUrl.split("/").pop();

  const asset = Object.entries(posterAssets).find(
    ([path]) =>
      path.endsWith(`/${fileName}`)
  );

  if (asset) {
    return asset[1];
  }

  if (
    posterUrl.startsWith("http://") ||
    posterUrl.startsWith("https://")
  ) {
    return posterUrl;
  }

  return posterUrl;
};

const formatDate = (date) => {
  if (!date) {
    return "Chưa cập nhật";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("vi-VN");
};

const getStatusText = (status) => {
  if (status === "NowShowing") {
    return "ĐANG CHIẾU";
  }

  if (status === "ComingSoon") {
    return "SẮP CHIẾU";
  }

  return status || "CHƯA CẬP NHẬT";
};

function MovieDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
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
          posterUrl: getPosterUrl(
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

          <button
            type="button"
            onClick={() =>
              navigate("/search")
            }
          >
            <FaArrowLeft />
            QUAY LẠI TÌM KIẾM
          </button>

        </div>

      </main>
    );
  }

  return (
    <main className="movie-detail-page">

      <div className="movie-detail-container">

        <button
          type="button"
          className="movie-detail-back"
          onClick={() =>
            navigate("/search")
          }
        >
          <FaArrowLeft />
          Quay lại tìm kiếm
        </button>

        <section className="movie-detail-card">

          {/* =========================
              POSTER
          ========================= */}

          <div className="movie-detail-poster">

            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
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

            <h1>
              {movie.title}
            </h1>

            <p className="movie-detail-genre">
              {movie.genre ||
                "Chưa cập nhật thể loại"}
            </p>

            {/* META */}

            <div className="movie-detail-meta">

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

            {/* DESCRIPTION */}

            <div className="movie-detail-description">

              <h2>
                NỘI DUNG PHIM
              </h2>

              <p>
                {movie.description ||
                  "Chưa có mô tả cho bộ phim này."}
              </p>

            </div>

            {/* BUTTON */}

            <div className="movie-detail-actions">

              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="movie-trailer-button"
                >
                  <FaPlay />
                  XEM TRAILER
                </a>
              )}

              {movie.status ===
                "NowShowing" && (
                <button
                  type="button"
                  className="movie-ticket-button"
                  onClick={() =>
                    navigate("/")
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