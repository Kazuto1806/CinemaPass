import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChair,
  FaChevronLeft,
  FaClock,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaFilm,
} from "react-icons/fa";
import "./Booking.css";

const MOVIE_API_URL = "http://localhost:5000/api/movies";
const SHOWTIME_API_URL = "http://localhost:5000/api/showtimes";
const SEAT_API_URL = "http://localhost:5000/api/seats";

const posterAssets = import.meta.glob(
  "../assets/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  if (posterUrl.startsWith("http://") || posterUrl.startsWith("https://")) {
    return posterUrl;
  }

  if (posterUrl.startsWith("/uploads/")) {
    return `http://localhost:5000${posterUrl}`;
  }

  const fileName = posterUrl.split("/").pop()?.toLowerCase();

  if (!fileName) return posterUrl;

  const asset = Object.entries(posterAssets).find(
    ([path]) => path.split("/").pop()?.toLowerCase() === fileName
  );

  if (asset) {
    return asset[1];
  }

  return posterUrl;
};

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "--:--";

  if (typeof value === "string" && value.includes(":")) {
    const [hour, minute] = value.split(":");
    return `${hour}:${minute}`;
  }

  const date = new Date(`2000-01-01T${value}`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedMovieIdFromUrl = Number(queryParams.get("movieId"));

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seatList, setSeatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState(
    Number.isFinite(selectedMovieIdFromUrl) ? selectedMovieIdFromUrl : null
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [movieResponse, showtimeResponse] = await Promise.all([
          fetch(MOVIE_API_URL),
          fetch(SHOWTIME_API_URL),
        ]);

        if (!movieResponse.ok) {
          throw new Error("Không lấy được danh sách phim");
        }

        if (!showtimeResponse.ok) {
          throw new Error("Không lấy được danh sách suất chiếu");
        }

        const movieData = await movieResponse.json();
        const showtimeData = await showtimeResponse.json();

        const normalizedMovies = Array.isArray(movieData)
          ? movieData.map((movie) => ({
              ...movie,
              posterUrl: getPosterUrl(movie.posterUrl),
            }))
          : [];

        setMovies(normalizedMovies);
        setShowtimes(Array.isArray(showtimeData) ? showtimeData : []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu đặt vé từ backend:", error);
        setMovies([]);
        setShowtimes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!movies.length) return;

    if (!selectedMovieId || !movies.some((movie) => movie.movieId === selectedMovieId)) {
      setSelectedMovieId(movies[0].movieId);
    }
  }, [movies, selectedMovieId]);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.movieId === selectedMovieId) || movies[0] || null,
    [movies, selectedMovieId]
  );

  const movieShowtimes = useMemo(() => {
    if (!selectedMovie) return [];

    return showtimes.filter((item) => Number(item.movieId) === Number(selectedMovie.movieId));
  }, [selectedMovie, showtimes]);

  const dates = useMemo(() => {
    const uniqueDates = [...new Set(movieShowtimes.map((item) => item.showDate))];
    return uniqueDates.sort();
  }, [movieShowtimes]);

  useEffect(() => {
    if (!dates.length) {
      setSelectedDate("");
      setSelectedTime("");
      setSelectedCinema("");
      return;
    }

    const firstDate = dates[0];
    setSelectedDate((current) => current && dates.includes(current) ? current : firstDate);
  }, [dates]);

  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];

    const filtered = movieShowtimes.filter((item) => item.showDate === selectedDate);
    const unique = filtered.reduce((acc, item) => {
      const key = `${item.cinemaName || "Cinema"}-${item.roomName || "Phòng"}`;
      if (!acc[key]) {
        acc[key] = {
          cinemaName: item.cinemaName || "Cinema Pass",
          roomName: item.roomName || "Phòng chiếu",
          times: [],
        };
      }

      acc[key].times.push({
        showtimeId: item.showtimeId,
        time: formatTime(item.startTime),
        price: item.ticketPrice,
        endTime: formatTime(item.endTime),
      });
      return acc;
    }, {});

    return Object.values(unique).map((group) => ({
      ...group,
      times: group.times.sort((a, b) => a.time.localeCompare(b.time)),
    }));
  }, [movieShowtimes, selectedDate]);

  useEffect(() => {
    if (!timeOptions.length) {
      setSelectedCinema("");
      setSelectedTime("");
      return;
    }

    const firstGroup = timeOptions[0];

    if (!selectedCinema || !timeOptions.some((group) => group.cinemaName === selectedCinema)) {
      setSelectedCinema(firstGroup.cinemaName);
    }

    const currentGroup = timeOptions.find((group) => group.cinemaName === selectedCinema) || firstGroup;
    const firstTime = currentGroup?.times[0]?.time || "";
    setSelectedTime((value) => (currentGroup?.times.some((item) => item.time === value) ? value : firstTime));
  }, [selectedCinema, selectedDate, timeOptions]);

  const selectedShowtime = useMemo(() => {
    if (!selectedDate || !selectedCinema || !selectedTime) return null;

    return movieShowtimes.find(
      (item) =>
        item.showDate === selectedDate &&
        (item.cinemaName || "") === selectedCinema &&
        formatTime(item.startTime) === selectedTime
    );
  }, [movieShowtimes, selectedCinema, selectedDate, selectedTime]);

  useEffect(() => {
    if (!selectedShowtime?.showtimeId) {
      setSeatList([]);
      setSelectedSeats([]);
      return;
    }

    const controller = new AbortController();

    const loadSeats = async () => {
      try {
        const response = await fetch(
          `${SEAT_API_URL}?showtimeId=${selectedShowtime.showtimeId}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setSeatList([]);
          return;
        }

        const data = await response.json();
        setSeatList(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Lỗi tải ghế từ backend:", error);
          setSeatList([]);
        }
      }
    };

    loadSeats();

    return () => controller.abort();
  }, [selectedShowtime]);

  useEffect(() => {
    setSelectedSeats((current) =>
      current.filter((seat) => !seatList.some((item) => item.isBooked && item.seatCode === seat))
    );
  }, [seatList]);

  const reservedSeats = useMemo(
    () => seatList.filter((seat) => seat.isBooked).map((seat) => seat.seatCode),
    [seatList]
  );

  const totalPrice = (selectedShowtime?.ticketPrice || 0) * selectedSeats.length;

  const toggleSeat = (seat) => {
    if (reservedSeats.includes(seat)) return;

    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((item) => item !== seat)
        : [...current, seat].slice(-8)
    );
  };

  const handleBooking = async () => {
    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu trước khi đặt vé.");
      return;
    }

    if (!selectedSeats.length) {
      alert("Vui lòng chọn ít nhất một ghế trước khi đặt vé.");
      return;
    }

    const userId = Number(localStorage.getItem("userId"));

    if (!userId) {
      alert("Bạn cần đăng nhập để đặt vé.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/tickets/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          movieId: Number(selectedMovie.movieId),
          showtimeId: Number(selectedShowtime.showtimeId),
          seatCodes: selectedSeats,
          ticketPrice: Number(selectedShowtime.ticketPrice || 0),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Đặt vé thất bại.");
      }

      setSeatList((current) =>
        current.map((seat) =>
          selectedSeats.includes(seat.seatCode)
            ? { ...seat, isBooked: true }
            : seat
        )
      );
      setSelectedSeats([]);

      alert(
        `Đặt vé thành công!\nPhim: ${selectedMovie.title}\nRạp: ${selectedShowtime.cinemaName}\nSuất: ${formatTime(selectedShowtime.startTime)}\nGhế: ${data.bookedSeats?.join(", ") || selectedSeats.join(", ")}`
      );
    } catch (error) {
      console.error("Lỗi đặt vé:", error);
      alert(error.message || "Có lỗi xảy ra khi đặt vé.");
    }
  };

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-loading">
          <FaFilm />
          <h2>Đang tải trang đặt vé...</h2>
        </div>
      </main>
    );
  }

  if (!selectedMovie) {
    return (
      <main className="booking-page">
        <div className="booking-empty">
          <h2>Không tìm thấy phim để đặt vé.</h2>
          <button type="button" onClick={() => navigate("/")}>
            <FaChevronLeft />
            Quay lại trang chủ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="booking-shell">
        <button type="button" className="booking-back" onClick={() => navigate(-1)}>
          <FaChevronLeft />
          Quay lại
        </button>

        <section className="booking-header-card">
          <img
            src={selectedMovie.posterUrl || ""}
            alt={selectedMovie.title}
            className="booking-poster"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          <div className="booking-movie-info">
            <span className="booking-label">Đặt vé</span>
            <h1>{selectedMovie.title}</h1>
            <p>{selectedMovie.genre || "Chưa cập nhật thể loại"}</p>

            <div className="booking-meta">
              <span>
                <FaCalendarAlt />
                {selectedMovie.releaseDate ? formatDate(selectedMovie.releaseDate) : "Chưa cập nhật"}
              </span>
              <span>
                <FaClock />
                {selectedMovie.duration ? `${selectedMovie.duration} phút` : "Chưa cập nhật"}
              </span>
            </div>
          </div>
        </section>

        <div className="booking-content">
          <section className="booking-panel">
            <div className="booking-section-title">
              <FaTicketAlt />
              <h2>Chọn suất chiếu</h2>
            </div>

            <div className="booking-date-list">
              {dates.length ? (
                dates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={`date-button ${selectedDate === date ? "active" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))
              ) : (
                <p className="booking-empty-text">Hiện chưa có suất chiếu cho phim này.</p>
              )}
            </div>

            <div className="booking-showtime-group">
              {timeOptions.length ? (
                timeOptions.map((group) => (
                  <div key={`${group.cinemaName}-${group.roomName}`} className="cinema-block">
                    <div className="cinema-header">
                      <span>
                        <FaMapMarkerAlt />
                        {group.cinemaName}
                      </span>
                      <small>{group.roomName}</small>
                    </div>

                    <div className="time-list">
                      {group.times.map((slot) => (
                        <button
                          key={`${group.cinemaName}-${slot.time}-${slot.showtimeId}`}
                          type="button"
                          className={`time-button ${
                            selectedCinema === group.cinemaName && selectedTime === slot.time ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedCinema(group.cinemaName);
                            setSelectedTime(slot.time);
                          }}
                        >
                          <span>{slot.time}</span>
                          <small>{currency(slot.price)}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="booking-empty-state">
                  <FaClock />
                  <p>Chưa có suất chiếu phù hợp với ngày bạn chọn.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="booking-panel booking-summary">
            <div className="booking-section-title">
              <FaChair />
              <h2>Chọn ghế</h2>
            </div>

            <div className="screen">MÀN HÌNH</div>

            <div className="seat-grid">
              {seatList.length ? (
                seatList.map((seat) => {
                  const seatCode = seat.seatCode;
                  const isReserved = reservedSeats.includes(seatCode);
                  const isSelected = selectedSeats.includes(seatCode);

                  return (
                    <button
                      key={seatCode}
                      type="button"
                      className={`seat ${isReserved ? "reserved" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleSeat(seatCode)}
                      disabled={isReserved}
                      aria-label={`Ghế ${seatCode}`}
                    >
                      {seatCode.replace(/[0-9]/g, "")}
                      {seatCode.replace(/[^0-9]/g, "")}
                    </button>
                  );
                })
              ) : (
                <p className="booking-empty-text">Sơ đồ ghế đang được cập nhật từ backend.</p>
              )}
            </div>

            <div className="seat-legend">
              <span><i className="legend available" /> Có sẵn</span>
              <span><i className="legend selected" /> Đang chọn</span>
              <span><i className="legend reserved" /> Đã đặt</span>
            </div>

            <div className="booking-summary-box">
              <div>
                <small>Phim</small>
                <strong>{selectedMovie.title}</strong>
              </div>

              <div>
                <small>Rạp</small>
                <strong>{selectedShowtime?.cinemaName || "Chưa chọn"}</strong>
              </div>

              <div>
                <small>Suất chiếu</small>
                <strong>
                  {selectedShowtime ? `${formatDate(selectedShowtime.showDate)} • ${formatTime(selectedShowtime.startTime)}` : "Chưa chọn"}
                </strong>
              </div>

              <div>
                <small>Ghế</small>
                <strong>{selectedSeats.length ? selectedSeats.join(", ") : "Chưa chọn"}</strong>
              </div>

              <div className="booking-total-row">
                <span>Tổng tiền</span>
                <strong>{currency(totalPrice)}</strong>
              </div>
            </div>

            <button type="button" className="booking-confirm-btn" onClick={handleBooking}>
              Xác nhận đặt vé
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Booking;
