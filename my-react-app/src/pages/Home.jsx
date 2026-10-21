
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import QuickBooking from "../components/QuickBooking";
import "./Home.css";
import { API_BASE, getMissingPosterFallback } from "../constants";

const API_URL = `${API_BASE}/api/movies`;
const CINEMA_API_URL = `${API_BASE}/api/cinemas`;
const SHOWTIME_API_URL = `${API_BASE}/api/showtimes`;
const MOVIES_PER_PAGE = 4;

// ==========================================
// BANNER PARTNER
// Đặt ảnh banner trong thư mục: public/banners/
// Sau đó sửa tên file tại đây.
// ==========================================
const defaultBanners = [
  {
    id: 1,
    image: "/banners/partner-1.jpg",
    alt: "Partner banner 1",
  },
  {
    id: 2,
    image: "/banners/partner-2.jpg",
    alt: "Partner banner 2",
  },
  {
    id: 3,
    image: "/banners/partner-3.jpg",
    alt: "Partner banner 3",
  },
];

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

  // URL ảnh từ bên ngoài
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  // Ảnh được upload lên ASP.NET Core
  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }

  // Tìm ảnh trong src/assets theo tên file
  const fileName = normalized.split(/[\\/]/).pop();

  const asset = Object.entries(posterAssets).find(([path]) =>
    path.toLowerCase().endsWith(`/${fileName.toLowerCase()}`)
  );

  if (asset) {
    return asset[1];
  }

  // Nếu ảnh nằm trong public/assets
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

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookingDataError, setBookingDataError] = useState("");
  const [movieDataError, setMovieDataError] = useState("");
  const [bookingOptionsLoading, setBookingOptionsLoading] = useState(true);
  const [banners, setBanners] = useState(defaultBanners);
  const [loading, setLoading] = useState(true);

  // Banner bắt đầu từ ảnh đầu tiên
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/banners`)
      .then((response) => {
        if (!response.ok) throw new Error("Không thể tải banner");
        return response.json();
      })
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setBanners(data.map((banner) => ({
          id: banner.bannerId,
          image: banner.imageUrl,
          alt: banner.altText || "Banner Cinema Pass",
        })));
        setCurrentBanner(0);
      })
      .catch((error) => console.error("Lỗi lấy danh sách banner:", error));

    return () => {
      cancelled = true;
    };
  }, []);

  const showPreviousBanner = () => {
    setCurrentBanner((current) =>
      (current - 1 + banners.length) % banners.length
    );
  };

  const showNextBanner = () => {
    setCurrentBanner((current) =>
      (current + 1) % banners.length
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadMovies = async () => {
      try {
        setLoading(true);

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách phim");
        }

        const movieData = await response.json();

        const moviesWithPoster = movieData.map((movie) => ({
          ...movie,
          posterUrl: getPosterUrl(movie.posterUrl),
        }));

        if (!cancelled) {
          setMovies(moviesWithPoster);
          setMovieDataError("");
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);

        if (!cancelled) {
          setMovies([]);
          setMovieDataError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách phim"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBookingOptions = async () => {
      try {
        const [cinemaResponse, showtimeResponse] = await Promise.all([
          fetch(CINEMA_API_URL),
          fetch(SHOWTIME_API_URL),
        ]);

        if (!cinemaResponse.ok) {
          throw new Error("Không thể lấy danh sách rạp");
        }

        if (!showtimeResponse.ok) {
          throw new Error("Không thể lấy danh sách suất chiếu");
        }

        const [cinemaData, showtimeData] = await Promise.all([
          cinemaResponse.json(),
          showtimeResponse.json(),
        ]);

        if (!Array.isArray(cinemaData) || !Array.isArray(showtimeData)) {
          throw new Error("Dữ liệu đặt vé từ máy chủ không hợp lệ");
        }

        const activeCinemas = cinemaData
          .filter((cinema) => {
            const status = String(cinema.status ?? "").trim().toLowerCase();
            return !status || status === "active" || status === "đang hoạt động";
          })
          .map((cinema) => ({
            id: cinema.cinemaId,
            name: cinema.name,
          }));

        const today = new Date().toLocaleDateString("en-CA");
        const currentTime = new Date().toTimeString().slice(0, 5);
        const availableShowtimes = showtimeData
          .filter((showtime) => {
            const status = String(showtime.status ?? "").trim().toLowerCase();
            const date = String(showtime.showDate ?? "").slice(0, 10);
            const time = String(showtime.startTime ?? "").slice(0, 5);
            const isActive =
              !status ||
              status === "active" ||
              status === "đang hoạt động";

            return (
              isActive &&
              date >= today &&
              (date !== today || time >= currentTime)
            );
          })
          .map((showtime) => ({
            id: showtime.showtimeId,
            cinemaId: showtime.cinemaId,
            movieId: showtime.movieId,
            date: String(showtime.showDate).slice(0, 10),
            time: String(showtime.startTime).slice(0, 5),
          }));

        if (!cancelled) {
          setCinemas(activeCinemas);
          setShowtimes(availableShowtimes);
          setBookingDataError("");
        }
      } catch (error) {
        console.error("Lỗi tải rạp và suất chiếu:", error);

        if (!cancelled) {
          setCinemas([]);
          setShowtimes([]);
          setBookingDataError(
            error instanceof Error
              ? error.message
              : "Không thể tải dữ liệu đặt vé"
          );
        }
      } finally {
        if (!cancelled) {
          setBookingOptionsLoading(false);
        }
      }
    };

    loadBookingOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (location.hash !== "#quick-booking") return;

    requestAnimationFrame(() => {
      document
        .getElementById("quick-booking")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [location.hash, location.pathname]);

  // Lọc phim theo trạng thái
  const nowShowingMovies = movies.filter(
    (movie) => String(movie.status ?? "").trim() === "NowShowing"
  );

  const comingSoonMovies = movies.filter(
    (movie) => String(movie.status ?? "").trim() === "ComingSoon"
  );

  // Mỗi mục hiển thị tối đa 4 phim trên trang chủ
  const displayedNowShowingMovies = nowShowingMovies.slice(
    0,
    MOVIES_PER_PAGE
  );

  const displayedComingSoonMovies = comingSoonMovies.slice(
    0,
    MOVIES_PER_PAGE
  );

  return (
    <main className="home">
      {/* BANNER PARTNER */}
      <section className="partner-section" aria-label="Đối tác">
        <div className="partner-banner">
          <img
            key={banners[currentBanner].id}
            className="partner-banner-image"
            src={banners[currentBanner].image}
            alt={banners[currentBanner].alt}
          />

          {/* MŨI TÊN TRÁI */}
          <button
            type="button"
            className="partner-arrow partner-arrow-left"
            aria-label="Xem banner trước"
            onClick={showPreviousBanner}
          >
            &#10094;
          </button>

          {/* MŨI TÊN PHẢI */}
          <button
            type="button"
            className="partner-arrow partner-arrow-right"
            aria-label="Xem banner tiếp theo"
            onClick={showNextBanner}
          >
            &#10095;
          </button>

          {/* CHẤM HIỂN THỊ VỊ TRÍ BANNER */}
          <div className="partner-dots">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={`partner-dot ${
                  index === currentBanner ? "active" : ""
                }`}
                aria-label={`Chuyển đến banner ${index + 1}`}
                aria-current={index === currentBanner ? "true" : undefined}
                onClick={() => setCurrentBanner(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <QuickBooking
        cinemas={cinemas}
        movies={movies.map((movie) => ({
          id: movie.movieId,
          title: movie.title,
        }))}
        showtimes={showtimes}
        loading={loading || bookingOptionsLoading}
        error={movieDataError || bookingDataError}
        onBook={({ showtimeId }) =>
          navigate(`/booking?showtimeId=${encodeURIComponent(showtimeId)}`)
        }
      />

      {/* PHIM ĐANG CHIẾU */}
      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>

        {loading ? (
          <p className="movie-loading">Đang tải phim...</p>
        ) : nowShowingMovies.length === 0 ? (
          <div className="movie-empty">
            <div className="movie-empty-content">
              <div className="movie-empty-icon">🎬</div>
              <h2>Chưa có phim đang chiếu</h2>
              <p>Hiện tại chưa có phim nào đang được chiếu.</p>
            </div>
          </div>
        ) : (
          <div className="movie-list">
            {displayedNowShowingMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movie/${encodeURIComponent(movie.title)}`}
                className="movie-card-link"
              >
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        )}

        {!loading && (
          <div className="movie-more-container">
            <Link
              to="/movies/now-showing"
              className="movie-more-button"
            >
              XEM THÊM
            </Link>
          </div>
        )}
      </section>

      {/* PHIM SẮP CHIẾU */}
      <section className="movie-section">
        <h2>PHIM SẮP CHIẾU</h2>

        {loading ? (
          <p className="movie-loading">Đang tải phim...</p>
        ) : comingSoonMovies.length === 0 ? (
          <div className="movie-empty">
            <div className="movie-empty-content">
              <div className="movie-empty-icon">🎬</div>
              <h2>Chưa có phim sắp chiếu</h2>
              <p>Hiện tại chưa có phim nào sắp chiếu.</p>
            </div>
          </div>
        ) : (
          <div className="movie-list">
            {displayedComingSoonMovies.map((movie) => (
              <Link
                key={movie.movieId}
                to={`/movie/${encodeURIComponent(movie.title)}`
                }
                className="movie-card-link"
              >
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        )}

        {!loading && (
          <div className="movie-more-container">
            <Link
              to="/movies/coming-soon"
              className="movie-more-button"
            >
              XEM THÊM
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
