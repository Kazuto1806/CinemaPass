
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { API_BASE, getMissingPosterFallback } from "../constants";
import "./MovieList.css";

const API_URL = `${API_BASE}/api/movies`;

const posterAssets = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  const normalized = String(posterUrl).trim();
  if (!normalized) return "";

  const fallback = getMissingPosterFallback(normalized);
  if (fallback) return fallback;

  if (/^https?:\/\//i.test(normalized)) {
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

  const fileName = normalized.split(/[\\/]/).pop();

  const asset = Object.entries(posterAssets).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );

  if (asset) return asset[1];

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

function MovieList() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isNowShowing = type === "now-showing";
  const isComingSoon = type === "coming-soon";
  const validType = isNowShowing || isComingSoon;

  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Không thể tải danh sách phim.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu danh sách phim không hợp lệ.");
        }

        const filteredMovies = data
          .filter((movie) => {
            const status = String(movie.status ?? movie.Status ?? "")
              .trim()
              .toLowerCase();

            return isNowShowing
              ? status === "nowshowing"
              : status === "comingsoon";
          })
          .map((movie) => ({
            ...movie,
            title: movie.title ?? movie.Title,
            genre: movie.genre ?? movie.Genre,
            duration: movie.duration ?? movie.Duration,
            releaseDate: movie.releaseDate ?? movie.ReleaseDate,
            director: movie.director ?? movie.Director,
            ageRating: movie.ageRating ?? movie.AgeRating,
            trailerUrl: movie.trailerUrl ?? movie.TrailerUrl,
            posterUrl: getPosterUrl(movie.posterUrl ?? movie.PosterUrl),
          }));

        if (!cancelled) {
          setMovies(filteredMovies);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Lỗi tải danh sách phim:", err);
          setError("Không thể tải danh sách phim. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (validType) {
      loadMovies();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [type, isNowShowing, validType]);

  if (!validType) {
    return (
      <main className="movie-catalog">
        <h1>Không tìm thấy danh mục phim</h1>
        <Link to="/">Quay lại trang chủ</Link>
      </main>
    );
  }

  return (
    <main className="movie-catalog">
      <header className="movie-catalog-header">
        <button
          type="button"
          className="movie-detail-back movie-catalog-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Quay lại
        </button>

        <h1>
          {isNowShowing ? "PHIM ĐANG CHIẾU" : "PHIM SẮP CHIẾU"}
        </h1>
        <p>Khám phá danh sách phim tại CinemaPass</p>
      </header>

      {loading ? (
        <p className="catalog-message">Đang tải phim...</p>
      ) : error ? (
        <p className="catalog-message">{error}</p>
      ) : movies.length === 0 ? (
        <div className="catalog-empty">
          <span>🎬</span>
          <h2>Chưa có phim trong danh mục này</h2>
          <p>Vui lòng quay lại sau.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {movies.map((movie) => (
            <div
              className="catalog-card"
              key={movie.movieId ?? movie.MovieId ?? movie.title}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )      }
    </main>  );
}

export default MovieList;
