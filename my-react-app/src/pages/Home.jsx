import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import "./Home.css";
import { API_BASE } from './constants';
// API lấy phim từ SQL Server
const API_URL = `${API_BASE}/api/movies`;

// Lấy tất cả ảnh trong src/assets
const posterAssets = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

// Tìm poster theo URL trong SQL
const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  const fileName = posterUrl.split("/").pop();

  const asset = Object.entries(posterAssets).find(([path]) =>
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

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LẤY PHIM TỪ SQL SERVER
  // =========================

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phim");
        }

        const data = await response.json();

        const moviesWithPoster = data.map((movie) => ({
          ...movie,
          posterUrl: getPosterUrl(movie.posterUrl),
        }));

        setMovies(moviesWithPoster);
      } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // =========================
  // PHIM ĐANG CHIẾU
  // =========================

  const nowShowingMovies = movies
    .filter((movie) => movie.status === "NowShowing")
    .slice(0, 5);

  // =========================
  // PHIM SẮP CHIẾU
  // =========================

  const comingSoonMovies = movies
    .filter((movie) => movie.status === "ComingSoon")
    .slice(0, 5);

  return (
    <main className="home">

      {/* =========================
          PHIM ĐANG CHIẾU
      ========================= */}

      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>

        {loading ? (
          <p className="movie-loading">
            Đang tải phim...
          </p>
        ) : nowShowingMovies.length === 0 ? (
          <div className="movie-empty">
            <div className="movie-empty-content">
              <div className="movie-empty-icon">🎬</div>

              <h2>Chưa có phim đang chiếu</h2>

              <p>
                Hiện tại chưa có phim nào đang được chiếu.
              </p>
            </div>
          </div>
        ) : (
          <div className="movie-list">
            {nowShowingMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movie/${movie.movieId}`}
                className="movie-card-link"
              >
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          PHIM SẮP CHIẾU
      ========================= */}

      <section className="movie-section">
        <h2>PHIM SẮP CHIẾU</h2>

        {loading ? (
          <p className="movie-loading">
            Đang tải phim...
          </p>
        ) : comingSoonMovies.length === 0 ? (
          <div className="movie-empty">
            <div className="movie-empty-content">
             <div className="movie-empty-icon">🎬</div>

              <h2>Chưa có phim sắp chiếu</h2>

              <p>
                Hiện tại chưa có phim nào sắp chiếu.
              </p>
            </div>
          </div>
        ) : (
          <div className="movie-list">
            {comingSoonMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movie/${movie.movieId}`}
                className="movie-card-link"
              >
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        )}
      </section>

    </main>
  );
};

export default Home;