import { useState } from "react";
import MovieCard from "../components/MovieCard";
import batTien from "../assets/bat-tien.jpeg";
import "./Home.css";

const Home = () => {
  const [movies] = useState([
    {
      movieId: 1,
      title: "Bắt Tiên!",
      description: "Một bộ phim hoạt hình phiêu lưu.",
      genre: "Hoạt hình, Hài",
      duration: 120,
      releaseDate: "2026-09-11",
      director: "Mục Chí Dương",
      ageRating: "K",
      posterUrl: batTien,
      status: "NowShowing",
    },
    {
      movieId: 2,
      title: "The Conjuring: Last Rites",
      description: "Một câu chuyện kinh dị mới.",
      genre: "Kinh dị",
      duration: 135,
      releaseDate: "2026-09-05",
      director: "Michael Chaves",
      ageRating: "T18",
      posterUrl: "",
      status: "NowShowing",
    },
    {
      movieId: 3,
      title: "Avatar: Fire and Ash",
      description: "Phần phim mới trong thế giới Avatar.",
      genre: "Hành động, Phiêu lưu",
      duration: 197,
      releaseDate: "2026-12-19",
      director: "James Cameron",
      ageRating: "T13",
      posterUrl: "",
      status: "ComingSoon",
    },
  ]);

  const nowShowingMovies = movies
    .filter((movie) => movie.status === "NowShowing")
    .slice(0, 5);

  const comingSoonMovies = movies
    .filter((movie) => movie.status === "ComingSoon")
    .slice(0, 5);

  return (
    <main className="home">

      {/* PHIM ĐANG CHIẾU */}
      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>

        <div className="movie-list">
          {nowShowingMovies.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
            />
          ))}
        </div>
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