import React from "react";
import MovieCard from "../components/MovieCard";
import batTien from "../assets/bat-tien.jpeg";
import "./Home.css";

const Home = () => {
  const movie = {
    image: batTien,
    alt: "Bát Tiên",
    title: "Bát Tiên",
    genre: "Hành động, Fantasy",
    duration: 120,
    releaseDate: "20/09/2026",
    director: "Đạo diễn mẫu",
    age: "T16",
  };

  return (
    <main className="home">
      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>

        <div className="movie-list">
          <MovieCard movie={movie} />
        </div>
      </section>

      <section className="movie-section">
        <h2>PHIM SẮP CHIẾU</h2>
      </section>
    </main>
  );
};

export default Home;