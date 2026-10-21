
import { useState } from "react";
import "./QuickBooking.css";

function QuickBooking({
  cinemas = [],
  movies = [],
  showtimes = [],
  loading = false,
  error = "",
  onBook,
}) {
  const [cinemaId, setCinemaId] = useState("");
  const [movieId, setMovieId] = useState("");
  const [date, setDate] = useState("");
  const [showtimeId, setShowtimeId] = useState("");

  const availableShowtimes = showtimes.filter(
    (item) =>
      String(item.cinemaId) === cinemaId &&
      String(item.movieId) === movieId &&
      item.date === date
  );

  function handleBook() {
    if (!cinemaId || !movieId || !date || !showtimeId) return;

    onBook?.({
      cinemaId,
      movieId,
      date,
      showtimeId,
    });
  }

  return (
    <section id="quick-booking" className="quick-booking">
      <h2>ĐẶT VÉ NHANH</h2>

      <div className="quick-booking-fields">
        {error ? (
          <p className="quick-booking-message" role="alert">
            {error}
          </p>
        ) : loading ? (
          <p className="quick-booking-message" role="status">
            Đang tải dữ liệu đặt vé...
          </p>
        ) : null}

        <select
          value={cinemaId}
          disabled={loading || Boolean(error)}
          onChange={(e) => {
            setCinemaId(e.target.value);
            setShowtimeId("");
          }}
        >
          <option value="">1. Chọn Rạp</option>
          {cinemas.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name}
            </option>
          ))}
        </select>

        <select
          value={movieId}
          disabled={loading || Boolean(error)}
          onChange={(e) => {
            setMovieId(e.target.value);
            setShowtimeId("");
          }}
        >
          <option value="">2. Chọn Phim</option>
          {movies.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
        </select>

        <input
          aria-label="Chọn ngày chiếu"
          type="date"
          value={date}
          min={new Date().toLocaleDateString("en-CA")}
          disabled={loading || Boolean(error)}
          onChange={(e) => {
            setDate(e.target.value);
            setShowtimeId("");
          }}
        />

        <select
          value={showtimeId}
          onChange={(e) => setShowtimeId(e.target.value)}
          disabled={loading || Boolean(error) || !cinemaId || !movieId || !date}
        >
          <option value="">
            {availableShowtimes.length
              ? "4. Chọn Suất"
              : "4. Không có suất chiếu"}
          </option>
          {availableShowtimes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.time}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={
            loading || Boolean(error) || !cinemaId || !movieId || !date || !showtimeId
          }
          onClick={handleBook}
        >
          ĐẶT NGAY
        </button>
      </div>
    </section>
  );
}

export default QuickBooking;
