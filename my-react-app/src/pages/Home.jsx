import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import "./Home.css";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/movies")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Không thể lấy dữ liệu phim");
        }

        return response.json();
      })
      .then((data) => {
        setMovies(data);
      })
      .catch((error) => {
        console.error("Lỗi:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Chỉ lấy tối đa 5 phim đang chiếu
  const nowShowingMovies = movies
    .filter((movie) => movie.status === "NowShowing")
    .slice(0, 5);

  // Chỉ lấy tối đa 5 phim sắp chiếu
  const comingSoonMovies = movies
    .filter((movie) => movie.status === "ComingSoon")
    .slice(0, 5);

  return (
    <main className="home">

      {/* PHIM ĐANG CHIẾU */}
      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>

        {loading ? (
          <p>Đang tải phim...</p>
        ) : (
          <div className="movie-list">
            {nowShowingMovies.map((movie) => (
              <MovieCard
                key={movie.movieId}
                movie={movie}
              />
            ))}
          </div>
        )}
      </section>

      {/* PHIM SẮP CHIẾU */}
      <section className="movie-section">
        <h2>PHIM SẮP CHIẾU</h2>

        <div className="movie-list">
          {comingSoonMovies.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
            />
          ))}
        </div>
      </section>

    </main>
  );
};

export default Home;