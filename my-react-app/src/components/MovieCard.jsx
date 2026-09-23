import "./MovieCard.css";

function MovieCard({ movie }) {
  return (
    <div className="movie-card">

      {/* POSTER */}
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
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
            {movie.releaseDate || "Chưa cập nhật"}
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