import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

  // Nếu đã là URL đầy đủ
  if (/^https?:\/\//i.test(normalized)) {
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

  // Lấy tên file để tìm ảnh trong src/assets
  const fileName = normalized.split(/[\\/]/).pop();

  const asset = Object.entries(posterAssets).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );

  // Nếu tìm thấy ảnh trong src/assets thì dùng URL do Vite cung cấp
  if (asset) {
    return asset[1];
  }

  // Nếu ảnh nằm trong public/assets thì giữ đường dẫn public
  if (
    normalized.startsWith("/assets/") ||
    normalized.startsWith("assets/")
  ) {
    return normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;
  }

  // Giữ nguyên đường dẫn nếu không tìm thấy ảnh trong assets
  return normalized;
};

function MovieList() {
  const { type } = useParams();

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

        const filteredMovies = data
          .filter((movie) => {
            const status = String(movie.status ?? "").trim();

            return isNowShowing
              ? status === "NowShowing"
              : status === "ComingSoon";
          })
          .map((movie) => ({
            ...movie,
            posterUrl: getPosterUrl(movie.posterUrl),
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
            <article className="catalog-card" key={movie.movieId}>
              <Link
                className="catalog-poster-link"
                to={`/movie/${encodeURIComponent(movie.title)}`}
              >
                {movie.posterUrl ? (
                  <img
                    className="catalog-poster"
                    src={movie.posterUrl}
                    alt={movie.title}
                    loading="lazy"
                    onError={(event) => {
                      console.error(
                        `Không tải được poster phim "${movie.title}":`,
                        movie.posterUrl
                      );

                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "data:image/svg+xml;charset=UTF-8," +
                        encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg"
                               width="400"
                               height="600"
                               viewBox="0 0 400 600">
                            <rect width="400" height="600" fill="#1f2937"/>
                            <text
                              x="200"
                              y="300"
                              fill="white"
                              font-family="Arial, sans-serif"
                              font-size="24"
                              text-anchor="middle"
                              dominant-baseline="middle">
                              NO POSTER
                            </text>
                          </svg>
                        `);
                    }}
                  />
                ) : (
                  <div className="catalog-poster-placeholder">
                    🎬
                  </div>
                )}

                <span className="catalog-age">
                  {movie.ageRating || "P"}
                </span>
              </Link>

              <Link
                className="catalog-title"
                to={`/movie/${encodeURIComponent(movie.title)}`
                }
              >
                {movie.title}
              </Link>

              <div className="catalog-actions">
                {movie.trailerUrl ? (
                  <a
                    className="catalog-trailer"
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem Trailer
                  </a>
                ) : (
                  <span className="catalog-trailer catalog-trailer-disabled">
                    Chưa có trailer
                  </span>
                )}

                {isNowShowing ? (
                  <Link
                    className="catalog-book"
                    to={`/movie/${encodeURIComponent(movie.title)}`}
                  >
                    ĐẶT VÉ
                  </Link>
                ) : (
                  <span className="catalog-coming-soon">
                    SẮP CHIẾU
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="catalog-back">
        <Link to="/">← Quay lại trang chủ</Link>
      </div>
    </main>
  );
}

export default MovieList;