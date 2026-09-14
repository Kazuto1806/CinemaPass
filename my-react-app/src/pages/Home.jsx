import React from "react";
import "./Home.css"
const Home = () => {
  return (
    <main className="home">

      {/* Phim đang chiếu */}
      <section className="movie-section">
        <h2>PHIM ĐANG CHIẾU</h2>
        {/* danh sách phim */}<div className="movie-empty">
          <div className="movie-empty-content">
            <div className="movie-empty-icon">🎬</div>
            <p>
              Danh sách phim đang được cập nhật.
              <br />
              Vui lòng quay lại sau.
            </p>
          </div>
        </div>
      </section>

      {/* Phim sắp chiếu */}
      <section className="movie-section">
        <h2>PHIM SẮP CHIẾU</h2>

        {/* danh sách phim */}
      </section>

    </main>
  );
};

export default Home;