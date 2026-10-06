import { useEffect, useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import MovieCard from "../components/MovieCard";

import "./MovieSearch.css";
import { API_BASE } from './constants';
const API_URL =
  `${API_BASE}/api/movies`;

function MovieSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // =========================
  // LẤY TỪ KHÓA TÌM KIẾM
  // =========================

  const keyword =
    new URLSearchParams(
      location.search
    ).get("keyword") || "";

  // =========================
  // LẤY PHIM TỪ BACKEND
  // =========================

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          API_URL
        );

        if (!response.ok) {
          throw new Error(
            "Không thể lấy danh sách phim"
          );
        }

        const data =
          await response.json();

        // Không xử lý poster ở đây.
        // MovieCard sẽ tự xử lý:
        // /assets/...
        // /uploads/...
        // http://...
        setMovies(data);
      } catch (err) {
        console.error(
          "Lỗi lấy danh sách phim:",
          err
        );

        setMovies([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // =========================
  // LỌC PHIM
  // =========================

  const filteredMovies = useMemo(() => {
    const search =
      keyword
        .trim()
        .toLowerCase();

    if (!search) {
      return movies;
    }

    return movies.filter((movie) => {
      const title =
        movie.title?.toLowerCase() || "";

      const genre =
        movie.genre?.toLowerCase() || "";

      const director =
        movie.director?.toLowerCase() || "";

      return (
        title.includes(search) ||
        genre.includes(search) ||
        director.includes(search)
      );
    });
  }, [movies, keyword]);

  // =========================
  // RESET TRANG KHI ĐỔI TỪ KHÓA
  // =========================

  useEffect(() => {
    setCurrentPage(0);
  }, [keyword]);

  // =========================
  // PHÂN TRANG
  // =========================

  const moviesPerPage = 4;

  const totalPages = Math.ceil(
    filteredMovies.length /
      moviesPerPage
  );

  const displayedMovies =
    filteredMovies.slice(
      currentPage * moviesPerPage,
      currentPage * moviesPerPage +
        moviesPerPage
    );

  const nextPage = () => {
    if (
      currentPage <
      totalPages - 1
    ) {
      setCurrentPage(
        (prev) => prev + 1
      );
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(
        (prev) => prev - 1
      );
    }
  };

  // =========================
  // CHI TIẾT PHIM
  // =========================

  const handleMovieDetail = (
    movieId
  ) => {
    navigate(
      `/movie/${movieId}`
    );
  };

  // =========================
  // RENDER
  // =========================

  return (
    <main className="movie-search-page">

      {/* =========================
          TITLE
      ========================= */}

      <section className="search-result-header">

        <h1>
          KẾT QUẢ TÌM KIẾM PHIM
        </h1>

        {keyword.trim() && (
          <p>
            Kết quả cho:{" "}
            <strong>
              "{keyword}"
            </strong>
          </p>
        )}

      </section>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="search-message">
          <p>
            Đang tải danh sách phim...
          </p>
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <div className="search-message error">

          <div className="error-icon">
            🎬
          </div>

          <h2>
            CÓ LỖI XẢY RA
          </h2>

          <p>
            Không thể tải danh sách phim.
            <br />
            Vui lòng kiểm tra Backend.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Thử lại
          </button>

        </div>
      )}

      {/* =========================
          NO RESULT
      ========================= */}

      {!loading &&
        !error &&
        filteredMovies.length ===
          0 && (
          <div className="search-message">

            <div className="empty-icon">
              🎬
            </div>

            <h2>
              KHÔNG TÌM THẤY PHIM
            </h2>

            <p>
              Không có phim phù hợp
              với từ khóa{" "}
              <strong>
                {keyword
                  ? ` "${keyword}"`
                  : ""}
              </strong>
            </p>

          </div>
        )}

      {/* =========================
          MOVIE RESULTS
      ========================= */}

      {!loading &&
        !error &&
        filteredMovies.length >
          0 && (
          <section className="search-results">

            <div className="movie-carousel">

              {/* =========================
                  NÚT TRÁI
              ========================= */}

              {totalPages > 1 && (
                <button
                  type="button"
                  className="carousel-arrow left"
                  onClick={
                    previousPage
                  }
                  disabled={
                    currentPage === 0
                  }
                >
                  <FaChevronLeft />
                </button>
              )}

              {/* =========================
                  MOVIE GRID
              ========================= */}

              <div className="movie-result-grid">

                {displayedMovies.map(
                  (movie) => (
                    <div
                      key={
                        movie.movieId
                      }
                      className="search-movie-card"
                      onClick={() =>
                        handleMovieDetail(
                          movie.movieId
                        )
                      }
                    >

                      {/* DÙNG MOVIECARD CÓ SẴN */}
                      <MovieCard
                        movie={movie}
                      />

                    </div>
                  )
                )}

              </div>

              {/* =========================
                  NÚT PHẢI
              ========================= */}

              {totalPages > 1 && (
                <button
                  type="button"
                  className="carousel-arrow right"
                  onClick={nextPage}
                  disabled={
                    currentPage ===
                    totalPages - 1
                  }
                >
                  <FaChevronRight />
                </button>
              )}

            </div>

            {/* =========================
                DOTS
            ========================= */}

            {totalPages > 1 && (
              <div className="carousel-dots">

                {Array.from({
                  length: totalPages,
                }).map(
                  (_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={
                        index ===
                        currentPage
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(
                          index
                        )
                      }
                    />
                  )
                )}

              </div>
            )}

            {/* =========================
                COUNT
            ========================= */}

            <div className="search-count">
              {filteredMovies.length}{" "}
              phim
            </div>

          </section>
        )}

    </main>
  );
}

export default MovieSearch;