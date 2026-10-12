import "./MovieCard.css";
import { API_BASE, getMissingPosterFallback } from "../constants";

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  const normalized = String(posterUrl).trim();
  const fallback = getMissingPosterFallback(normalized);

  if (fallback) return fallback;

  // Nếu đã là URL đầy đủ
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  // Poster được upload lên ASP.NET Core
  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }

  // Poster nằm trong public/assets
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
  return (
    <div className="movie-card">

      {/* POSTER */}
      {movie.posterUrl ? (
        <img
          src={getPosterUrl(movie.posterUrl)}
          alt={movie.title}
          className="movie-poster"
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
        <div className="movie-poster movie-poster-placeholder">
          🎬
        </div>
      )}

      {/* OVERLAY KHI HOVER */}
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

          <button
            type="button"
            className="movie-detail-btn"
          >
            Xem chi tiết
          </button>

        </div>

      </div>

      {/* ĐỘ TUỔI */}
      <div className="movie-badge">
        {movie.ageRating || "P"}
      </div>

    </div>
  );
}

export default MovieCard;