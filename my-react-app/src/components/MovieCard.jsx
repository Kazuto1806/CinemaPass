import './MovieCard.css';

function MovieCard({ movie }) {
  return (
    <div className="movie-card">

      {/* Poster */}
      <img
        src={movie.image}
        alt={movie.alt}
        className="movie-poster"
      />

      {/* Lớp thông tin khi hover */}
      <div className="movie-overlay">

        <div className="movie-info">
          <h3>{movie.title}</h3>

          <p>
            <strong>Thể loại:</strong> {movie.genre}
          </p>

          <p>
            <strong>Thời lượng:</strong> {movie.duration} phút
          </p>

          <p>
            <strong>Khởi chiếu:</strong> {movie.releaseDate}
          </p>

          <p>
            <strong>Đạo diễn:</strong> {movie.director}
          </p>
        </div>

        <button className="movie-detail-btn">
          Xem chi tiết
        </button>

      </div>

      {/* Nhãn độ tuổi */}
      <div className="movie-badge">
        {movie.age}
      </div>

    </div>
  );
}

export default MovieCard;