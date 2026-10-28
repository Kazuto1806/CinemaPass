
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MovieCard.css";
import TrailerModal from "./TrailerModal";
import { useNotification } from "./useNotification";
import { API_BASE, getMissingPosterFallback } from "../constants";

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  const normalized = String(posterUrl).trim();
  const fallback = getMissingPosterFallback(normalized);

  if (fallback) return fallback;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }

  if (
    normalized.startsWith("/assets/") ||
    normalized.startsWith("assets/")
  ) {
    return normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;
  }

  return normalized;
};

function MovieCard({ movie }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const { notify } = useNotification();
  const navigate = useNavigate();

  const trailerUrl = movie?.trailerUrl ?? movie?.TrailerUrl ?? "";

  const handleTrailerClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!trailerUrl.trim()) {
      notify("Phim này chưa có trailer.", "warning");
      return;
    }

    const trailerValue = trailerUrl.trim();
    const isSupportedVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(trailerValue);

    if (!isSupportedVideo) {
      const isYouTubeLike = /youtube\.com|youtu\.be|vimeo\.com/i.test(trailerValue);

      if (!isYouTubeLike) {
        notify(
          "Link trailer chưa được hỗ trợ. Ông hãy dùng link YouTube hoặc link video MP4 trực tiếp.",
          "warning"
        );
        return;
      }
    }

    setShowTrailer(true);
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  const openMovieDetail = () => {
    const movieId = movie?.movieId ?? movie?.MovieId;
    const routeValue = movieId || movie?.title;

    if (!routeValue) return;

    navigate(`/movie/${encodeURIComponent(routeValue)}`);
  };

  return (
    <>
      <div className="movie-card-wrapper">
        <div
          className="movie-card"
          role="link"
          tabIndex={0}
          onClick={openMovieDetail}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openMovieDetail();
            }
          }}
        >
          {/* POSTER */}
          {movie.posterUrl ? (
            <img
              src={getPosterUrl(movie.posterUrl)}
              alt={movie.title}
              className="movie-poster"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
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
            <div className="movie-poster movie-poster-placeholder">
              🎬
            </div>
          )}

          {/* LỚP THÔNG TIN KHI DI CHUỘT */}
          <div className="movie-overlay">
            <div className="movie-info">
              <h3>{movie.title}</h3>

              <p>
                <strong>Thể loại:</strong>{" "}
                {movie.genre || "Chưa cập nhật"}
              </p>

              <p>
                <strong>Thời lượng:</strong>{" "}
                {movie.duration} phút
              </p>

              <p>
                <strong>Khởi chiếu:</strong>{" "}
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>

              <p>
                <strong>Đạo diễn:</strong>{" "}
                {movie.director || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          {/* ĐỘ TUỔI */}
          <div className="movie-badge">
            {movie.ageRating || "P"}
          </div>
        </div>

        {/* TÊN PHIM */}
        <h3 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h3>

        {/* NÚT TRAILER */}
        <div className="movie-card-actions">
          <button
            type="button"
            className="movie-trailer-btn"
            onClick={handleTrailerClick}
            aria-label={`Xem trailer phim ${movie.title}`}
          >
            <span className="movie-trailer-icon">▶</span>
            <span>Xem Trailer</span>
          </button>

          <button
            type="button"
            className="movie-detail-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openMovieDetail();
            }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>

      <TrailerModal
        isOpen={showTrailer}
        onClose={closeTrailer}
        title={movie.title}
        trailerUrl={trailerUrl}
      />
    </>
  );
}

export default MovieCard;
