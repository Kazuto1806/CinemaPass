import "./MovieCard.css";
import { API_BASE } from "../constants";

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  const normalized = String(posterUrl).trim();

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