import { useEffect, useMemo, useState } from "react";
import { FaPlayCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./MovieSearch.css";

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

function MovieSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const keyword =
    new URLSearchParams(location.search).get("keyword") || "";

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError(false);

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
      } catch (err) {
        console.error("Lỗi lấy danh sách phim:", err);
        setMovies([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) {
      return movies;
    }

    return movies.filter((movie) => {
      const title = movie.title?.toLowerCase() || "";
      const genre = movie.genre?.toLowerCase() || "";
      const director = movie.director?.toLowerCase() || "";

      return (
        title.includes(search) ||
        genre.includes(search) ||
        director.includes(search)
      );
    });
  }, [movies, keyword]);

  useEffect(() => {
    setCurrentPage(0);
  }, [keyword]);

  const moviesPerPage = 4;

  const totalPages = Math.ceil(
    filteredMovies.length / moviesPerPage
  );

  const displayedMovies = filteredMovies.slice(
    currentPage * moviesPerPage,
    currentPage * moviesPerPage + moviesPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleMovieDetail = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handleBookTicket = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handleTrailer = (trailerUrl) => {
    if (trailerUrl) {
      window.open(trailerUrl, "_blank");
    } else {
      alert("Phim này chưa có trailer.");
    }
  };

  return (
    <main className="movie-search-page">

      {/* =========================
          TITLE
      ========================= */}

      <section className="search-result-header">
        <h1>KẾT QUẢ TÌM KIẾM PHIM</h1>

        {keyword.trim() && (
          <p>
            Kết quả cho:{" "}
            <strong>"{keyword}"</strong>
          </p>
        )}
      </section>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="search-message">
          <p>Đang tải danh sách phim...</p>
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <div className="search-message error">
          <div className="error-icon">🎬</div>

          <h2>CÓ LỖI XẢY RA</h2>

          <p>
            Không thể tải danh sách phim.
            <br />
            Vui lòng kiểm tra Backend.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
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
        filteredMovies.length === 0 && (
          <div className="search-message">
            <div className="empty-icon">🎬</div>

            <h2>KHÔNG TÌM THẤY PHIM</h2>

            <p>
              Không có phim phù hợp với từ khóa
              <strong>
                {keyword ? ` "${keyword}"` : ""}
              </strong>
            </p>
          </div>
        )}

      {/* =========================
          MOVIE RESULTS
      ========================= */}

      {!loading &&
        !error &&
        filteredMovies.length > 0 && (
          <section className="search-results">

            <div className="movie-carousel">

              {totalPages > 1 && (
                <button
                  type="button"
                  className="carousel-arrow left"
                  onClick={previousPage}
                  disabled={currentPage === 0}
                >
                  <FaChevronLeft />
                </button>
              )}

              <div className="movie-result-grid">

                {displayedMovies.map((movie) => (
                  <article
                    className="search-movie-card"
                    key={movie.movieId}
                  >

                    {/* POSTER */}

                    <div
                      className="movie-poster-wrapper"
                      onClick={() =>
                        handleMovieDetail(movie.movieId)
                      }
                    >
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="movie-poster"
                        />
                      ) : (
                        <div className="poster-empty">
                          Không có ảnh
                        </div>
                      )}

                      {/* AGE */}

                      {movie.ageRating && (
                        <span className="age-rating">
                          {movie.ageRating}
                        </span>
                      )}

                      {/* 2D */}

                      <span className="movie-type">
                        2D
                      </span>
                    </div>

                    {/* TITLE */}

                    <h2
                      className="movie-title"
                      onClick={() =>
                        handleMovieDetail(movie.movieId)
                      }
                    >
                      {movie.title}
                      {movie.ageRating
                        ? ` (${movie.ageRating})`
                        : ""}
                    </h2>

                    {/* ACTIONS */}

                    <div className="movie-actions">

                      <button
                        type="button"
                        className="trailer-button"
                        onClick={() =>
                          handleTrailer(
                            movie.trailerUrl
                          )
                        }
                      >
                        <FaPlayCircle />
                        <span>Xem Trailer</span>
                      </button>

                      <button
                        type="button"
                        className="booking-button"
                        onClick={() =>
                          handleBookTicket(
                            movie.movieId
                          )
                        }
                      >
                        ĐẶT VÉ
                      </button>

                    </div>

                  </article>
                ))}

              </div>

              {totalPages > 1 && (
                <button
                  type="button"
                  className="carousel-arrow right"
                  onClick={nextPage}
                  disabled={
                    currentPage === totalPages - 1
                  }
                >
                  <FaChevronRight />
                </button>
              )}

            </div>

            {/* DOTS */}

            {totalPages > 1 && (
              <div className="carousel-dots">
                {Array.from({
                  length: totalPages,
                }).map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={
                      index === currentPage
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setCurrentPage(index)
                    }
                  />
                ))}
              </div>
            )}

            {/* COUNT */}

            <div className="search-count">
              {filteredMovies.length} phim
            </div>

            {/* ALL MOVIES */}

            {filteredMovies.length > 4 && (
              <section className="all-search-results">

                <h2>DANH SÁCH PHIM</h2>

                <div className="all-movie-grid">

                  {filteredMovies.map((movie) => (
                    <article
                      className="small-movie-card"
                      key={`all-${movie.movieId}`}
                      onClick={() =>
                        handleMovieDetail(
                          movie.movieId
                        )
                      }
                    >
                      <div className="small-poster">

                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                          />
                        ) : (
                          <div>
                            Không có ảnh
                          </div>
                        )}

                      </div>

                      <div className="small-movie-info">

                        <h3>
                          {movie.title}
                        </h3>

                        <p>
                          {movie.genre ||
                            "Phim điện ảnh"}
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookTicket(
                              movie.movieId
                            );
                          }}
                        >
                          ĐẶT VÉ
                        </button>

                      </div>

                    </article>
                  ))}

                </div>

              </section>
            )}

          </section>
        )}

    </main>
  );
}

export default MovieSearch;