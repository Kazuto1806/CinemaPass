import { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import "./Home.css";

// API lấy phim từ SQL Server
const API_URL = "http://localhost:5000/api/movies";

// Lấy tất cả ảnh trong src/assets
const posterAssets = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

// =========================
// TÌM POSTER THEO URL TRONG SQL
// =========================

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  // Ví dụ SQL:
  // /assets/bat-tien.jpeg
  //
  // Lấy:
  // bat-tien.jpeg
  const fileName = posterUrl
    .split("/")
    .pop();

  // Tìm file tương ứng trong src/assets
  const asset = Object.entries(
    posterAssets
  ).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );

  // Nếu tìm thấy file trong src/assets
  if (asset) {
    return asset[1];
  }

  // Nếu SQL chứa URL ngoài
  if (
    posterUrl.startsWith("http://") ||
    posterUrl.startsWith("https://")
  ) {
    return posterUrl;
  }

  // Trường hợp ảnh nằm trong public/assets
  return posterUrl;
};


const Home = () => {

  const [movies, setMovies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // =========================
  // LẤY PHIM TỪ SQL SERVER
  // =========================

  useEffect(() => {

    const loadMovies = async () => {

      try {

        setLoading(true);

        const response =
          await fetch(API_URL);

        if (!response.ok) {
          throw new Error(
            "Không thể lấy danh sách phim"
          );
        }

        const data =
          await response.json();

        // Dữ liệu phim hoàn toàn từ SQL
        // Chỉ xử lý posterUrl để React
        // tìm đúng file ảnh
        const moviesWithPoster =
          data.map((movie) => ({
            ...movie,
            posterUrl:
              getPosterUrl(
                movie.posterUrl
              ),
          }));

        setMovies(
          moviesWithPoster
        );

      } catch (error) {

        console.error(
          "Lỗi lấy danh sách phim:",
          error
        );

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

  const nowShowingMovies =
    movies
      .filter(
        (movie) =>
          movie.status ===
          "NowShowing"
      )
      .slice(0, 5);


  // =========================
  // PHIM SẮP CHIẾU
  // =========================

  const comingSoonMovies =
    movies
      .filter(
        (movie) =>
          movie.status ===
          "ComingSoon"
      )
      .slice(0, 5);


  return (
    <main className="home">

      {/* =========================
          PHIM ĐANG CHIẾU
      ========================= */}

      <section className="movie-section">

        <h2>
          PHIM ĐANG CHIẾU
        </h2>

        {loading ? (

          <p>
            Đang tải phim...
          </p>

        ) : (

          <div className="movie-list">

            {nowShowingMovies.map(
              (movie) => (

                <MovieCard
                  key={
                    movie.movieId
                  }
                  movie={movie}
                />

              )
            )}

          </div>

        )}

      </section>


      {/* =========================
          PHIM SẮP CHIẾU
      ========================= */}

      <section className="movie-section">

        <h2>
          PHIM SẮP CHIẾU
        </h2>

        {loading ? (

          <p>
            Đang tải phim...
          </p>

        ) : (

          <div className="movie-list">

            {comingSoonMovies.map(
              (movie) => (

                <MovieCard
                  key={
                    movie.movieId
                  }
                  movie={movie}
                />

              )
            )}

          </div>

        )}

      </section>

    </main>
  );
};

export default Home;