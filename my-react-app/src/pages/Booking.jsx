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
  FaCreditCard,
  FaQrcode,
  FaWallet,
  FaCheckCircle,
} from "react-icons/fa";
import "./Booking.css";
import { API_BASE } from '../constants';
const MOVIE_API_URL = `${API_BASE}/api/movies`;
const SHOWTIME_API_URL = `${API_BASE}/api/showtimes`;
const SEAT_API_URL = `${API_BASE}/api/seats`;

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
    Number.isFinite(selectedMovieIdFromUrl)
      ? selectedMovieIdFromUrl
      : null
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  // 1 = chọn suất + ghế
  // 2 = thanh toán
  const [bookingStep, setBookingStep] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState("qr");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

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

    if (
      !selectedMovieId ||
      !movies.some((movie) => movie.movieId === selectedMovieId)
    ) {
      setSelectedMovieId(movies[0].movieId);
    }
  }, [movies, selectedMovieId]);

  const selectedMovie = useMemo(
    () =>
      movies.find((movie) => movie.movieId === selectedMovieId) ||
      movies[0] ||
      null,
    [movies, selectedMovieId]
  );

  const movieShowtimes = useMemo(() => {
    if (!selectedMovie) return [];

    return showtimes.filter(
      (item) => Number(item.movieId) === Number(selectedMovie.movieId)
    );
  }, [selectedMovie, showtimes]);

  const dates = useMemo(() => {
    const uniqueDates = [
      ...new Set(movieShowtimes.map((item) => item.showDate)),
    ];

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

    setSelectedDate((current) =>
      current && dates.includes(current) ? current : firstDate
    );
  }, [dates]);

  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];

    const filtered = movieShowtimes.filter(
      (item) => item.showDate === selectedDate
    );

    const unique = filtered.reduce((acc, item) => {
      const key = `${item.cinemaName || "Cinema"}-${
        item.roomName || "Phòng"
      }`;

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

    if (
      !selectedCinema ||
      !timeOptions.some((group) => group.cinemaName === selectedCinema)
    ) {
      setSelectedCinema(firstGroup.cinemaName);
    }

    const currentGroup =
      timeOptions.find((group) => group.cinemaName === selectedCinema) ||
      firstGroup;

    const firstTime = currentGroup?.times[0]?.time || "";

    setSelectedTime((value) =>
      currentGroup?.times.some((item) => item.time === value)
        ? value
        : firstTime
    );
  }, [selectedCinema, selectedDate, timeOptions]);

  const selectedShowtime = useMemo(() => {
    if (!selectedDate || !selectedCinema || !selectedTime) return null;

    return movieShowtimes.find(
      (item) =>
        item.showDate === selectedDate &&
        (item.cinemaName || "") === selectedCinema &&
        formatTime(item.startTime) === selectedTime
    );
  }, [
    movieShowtimes,
    selectedCinema,
    selectedDate,
    selectedTime,
  ]);

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
          {
            signal: controller.signal,
          }
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
      current.filter(
        (seat) =>
          !seatList.some(
            (item) => item.isBooked && item.seatCode === seat
          )
      )
    );
  }, [seatList]);

  const reservedSeats = useMemo(
    () =>
      seatList
        .filter((seat) => seat.isBooked)
        .map((seat) => seat.seatCode),
    [seatList]
  );

  const totalPrice =
    (selectedShowtime?.ticketPrice || 0) * selectedSeats.length;

  const toggleSeat = (seat) => {
    if (reservedSeats.includes(seat)) return;

    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((item) => item !== seat)
        : [...current, seat].slice(-8)
    );
  };

  const handleContinuePayment = () => {
    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu trước khi tiếp tục.");
      return;
    }

    if (!selectedSeats.length) {
      alert("Vui lòng chọn ít nhất một ghế trước khi tiếp tục.");
      return;
    }

    setBookingStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleBackToSeats = () => {
    setBookingStep(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleBooking = async () => {
    if (!selectedShowtime) {
      alert("Vui lòng chọn suất chiếu.");
      return;
    }

    if (!selectedSeats.length) {
      alert("Vui lòng chọn ít nhất một ghế.");
      return;
    }

    if (!paymentConfirmed) {
      alert("Vui lòng xác nhận bạn đã thanh toán trước khi tiếp tục.");
      return;
    }

    const userId = Number(localStorage.getItem("userId"));

    if (!userId) {
      alert("Bạn cần đăng nhập để đặt vé.");
      navigate("/login");
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/tickets/book",
        {
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
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Thanh toán thất bại.");
      }

      setBookingResult({
        ...data,
        bookedSeats:
          data.bookedSeats?.length
            ? data.bookedSeats
            : selectedSeats,
      });

      setBookingSuccess(true);
    } catch (error) {
      console.error("Lỗi thanh toán:", error);

      alert(error.message || "Có lỗi xảy ra khi thanh toán.");
    } finally {
      setPaymentLoading(false);
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

  if (bookingSuccess) {
    return (
      <main className="booking-page">
        <div className="booking-success-page">
          <div className="booking-success-icon">
            <FaCheckCircle />
          </div>

          <h1>Đặt vé thành công!</h1>

          <p className="success-message">
            Vé của bạn đã được xác nhận.
          </p>

          <div className="success-ticket">
            <div>
              <span>Phim</span>
              <strong>{selectedMovie.title}</strong>
            </div>

            <div>
              <span>Rạp</span>
              <strong>
                {selectedShowtime?.cinemaName || "Chưa cập nhật"}
              </strong>
            </div>

            <div>
              <span>Suất chiếu</span>
              <strong>
                {selectedShowtime
                  ? `${formatDate(selectedShowtime.showDate)} • ${formatTime(
                      selectedShowtime.startTime
                    )}`
                  : "Chưa cập nhật"}
              </strong>
            </div>

            <div>
              <span>Ghế</span>
              <strong>
                {bookingResult?.bookedSeats?.join(", ") ||
                  selectedSeats.join(", ")}
              </strong>
            </div>

            <div className="success-total">
              <span>Tổng thanh toán</span>
              <strong>{currency(totalPrice)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="success-home-btn"
            onClick={() => navigate("/")}
          >
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="booking-shell">

        <button
          type="button"
          className="booking-back"
          onClick={() => {
            if (bookingStep === 2) {
              handleBackToSeats();
            } else {
              navigate(-1);
            }
          }}
        >
          <FaChevronLeft />
          {bookingStep === 2 ? "Quay lại chọn ghế" : "Quay lại"}
        </button>

        {bookingStep === 1 ? (
          <>
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
                <span className="booking-label">
                  Đặt vé
                </span>

                <h1>{selectedMovie.title}</h1>

                <p>
                  {selectedMovie.genre ||
                    "Chưa cập nhật thể loại"}
                </p>

                <div className="booking-meta">
                  <span>
                    <FaCalendarAlt />
                    {selectedMovie.releaseDate
                      ? formatDate(selectedMovie.releaseDate)
                      : "Chưa cập nhật"}
                  </span>

                  <span>
                    <FaClock />
                    {selectedMovie.duration
                      ? `${selectedMovie.duration} phút`
                      : "Chưa cập nhật"}
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
                        className={`date-button ${
                          selectedDate === date ? "active" : ""
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        {formatDate(date)}
                      </button>
                    ))
                  ) : (
                    <p className="booking-empty-text">
                      Hiện chưa có suất chiếu cho phim này.
                    </p>
                  )}
                </div>

                <div className="booking-showtime-group">
                  {timeOptions.length ? (
                    timeOptions.map((group) => (
                      <div
                        key={`${group.cinemaName}-${group.roomName}`}
                        className="cinema-block"
                      >
                        <div className="cinema-header">
                          <span>
                            <FaMapMarkerAlt />
                            {group.cinemaName}
                          </span>

                          <small>
                            {group.roomName}
                          </small>
                        </div>

                        <div className="time-list">
                          {group.times.map((slot) => (
                            <button
                              key={`${group.cinemaName}-${slot.time}-${slot.showtimeId}`}
                              type="button"
                              className={`time-button ${
                                selectedCinema ===
                                  group.cinemaName &&
                                selectedTime === slot.time
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedCinema(
                                  group.cinemaName
                                );
                                setSelectedTime(slot.time);
                                setBookingStep(1);
                              }}
                            >
                              <span>{slot.time}</span>
                              <small>
                                {currency(slot.price)}
                              </small>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="booking-empty-state">
                      <FaClock />
                      <p>
                        Chưa có suất chiếu phù hợp với
                        ngày bạn chọn.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="booking-panel booking-summary">
                <div className="booking-section-title">
                  <FaChair />
                  <h2>Chọn ghế</h2>
                </div>

                <div className="screen">
                  MÀN HÌNH
                </div>

                <div className="seat-grid">
                  {seatList.length ? (
                    seatList.map((seat) => {
                      const seatCode = seat.seatCode;
                      const isReserved =
                        reservedSeats.includes(seatCode);
                      const isSelected =
                        selectedSeats.includes(seatCode);

                      return (
                        <button
                          key={seatCode}
                          type="button"
                          className={`seat ${
                            isReserved ? "reserved" : ""
                          } ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() =>
                            toggleSeat(seatCode)
                          }
                          disabled={isReserved}
                          aria-label={`Ghế ${seatCode}`}
                        >
                          {seatCode.replace(/[0-9]/g, "")}
                          {seatCode.replace(
                            /[^0-9]/g,
                            ""
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="booking-empty-text">
                      Sơ đồ ghế đang được cập nhật từ
                      backend.
                    </p>
                  )}
                </div>

                <div className="seat-legend">
                  <span>
                    <i className="legend available" />
                    Có sẵn
                  </span>

                  <span>
                    <i className="legend selected" />
                    Đang chọn
                  </span>

                  <span>
                    <i className="legend reserved" />
                    Đã đặt
                  </span>
                </div>

                <div className="booking-summary-box">
                  <div>
                    <small>Phim</small>
                    <strong>
                      {selectedMovie.title}
                    </strong>
                  </div>

                  <div>
                    <small>Rạp</small>
                    <strong>
                      {selectedShowtime?.cinemaName ||
                        "Chưa chọn"}
                    </strong>
                  </div>

                  <div>
                    <small>Suất chiếu</small>
                    <strong>
                      {selectedShowtime
                        ? `${formatDate(
                            selectedShowtime.showDate
                          )} • ${formatTime(
                            selectedShowtime.startTime
                          )}`
                        : "Chưa chọn"}
                    </strong>
                  </div>

                  <div>
                    <small>Ghế</small>
                    <strong>
                      {selectedSeats.length
                        ? selectedSeats.join(", ")
                        : "Chưa chọn"}
                    </strong>
                  </div>

                  <div className="booking-total-row">
                    <span>Tổng tiền</span>

                    <strong>
                      {currency(totalPrice)}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="booking-confirm-btn"
                  onClick={handleContinuePayment}
                >
                  Tiếp tục thanh toán
                </button>
              </aside>
            </div>
          </>
        ) : (
          <section className="payment-page">

            <div className="payment-title">
              <span className="booking-label">
                Bước 2 / 2
              </span>

              <h1>Thanh toán</h1>

              <p>
                Kiểm tra thông tin và chọn phương thức
                thanh toán.
              </p>
            </div>

            <div className="payment-layout">

              <div className="payment-main">

                <div className="payment-card">
                  <div className="payment-card-title">
                    <FaCreditCard />
                    <div>
                      <h2>Phương thức thanh toán</h2>
                      <p>
                        Chọn một phương thức để tiếp tục
                      </p>
                    </div>
                  </div>

                  <div className="payment-method-list">

                    <button
                      type="button"
                      className={`payment-method ${
                        paymentMethod === "qr"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setPaymentMethod("qr");
                        setPaymentConfirmed(false);
                      }}
                    >
                      <div className="payment-method-icon">
                        <FaQrcode />
                      </div>

                      <div>
                        <strong>
                          QR Banking
                        </strong>

                        <span>
                          Thanh toán bằng mã QR ngân hàng
                        </span>
                      </div>

                      <i
                        className={`payment-radio ${
                          paymentMethod === "qr"
                            ? "checked"
                            : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      className={`payment-method ${
                        paymentMethod === "card"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setPaymentMethod("card");
                        setPaymentConfirmed(false);
                      }}
                    >
                      <div className="payment-method-icon">
                        <FaCreditCard />
                      </div>

                      <div>
                        <strong>
                          Thẻ ngân hàng
                        </strong>

                        <span>
                          Visa, Mastercard, ATM nội địa
                        </span>
                      </div>

                      <i
                        className={`payment-radio ${
                          paymentMethod === "card"
                            ? "checked"
                            : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      className={`payment-method ${
                        paymentMethod === "wallet"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setPaymentMethod("wallet");
                        setPaymentConfirmed(false);
                      }}
                    >
                      <div className="payment-method-icon">
                        <FaWallet />
                      </div>

                      <div>
                        <strong>
                          Ví điện tử
                        </strong>

                        <span>
                          Thanh toán qua ví điện tử
                        </span>
                      </div>

                      <i
                        className={`payment-radio ${
                          paymentMethod === "wallet"
                            ? "checked"
                            : ""
                        }`}
                      />
                    </button>

                  </div>
                </div>

                <div className="payment-info-card">

                  {paymentMethod === "qr" && (
                    <div className="qr-payment-box">
                      <div className="fake-qr">
                        <div className="qr-pattern">
                          QR
                        </div>
                      </div>

                      <div>
                        <h3>
                          Quét mã QR để thanh toán
                        </h3>

                        <p>
                          Mở ứng dụng ngân hàng và quét
                          mã QR để hoàn tất thanh toán.
                        </p>

                        <strong>
                          Số tiền: {currency(totalPrice)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="card-payment-box">
                      <h3>
                        Thanh toán bằng thẻ
                      </h3>

                      <div className="fake-input">
                        Số thẻ
                      </div>

                      <div className="fake-card-row">
                        <div className="fake-input">
                          MM/YY
                        </div>

                        <div className="fake-input">
                          CVV
                        </div>
                      </div>

                      <p>
                        Đây là giao diện mô phỏng thanh
                        toán thẻ.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "wallet" && (
                    <div className="wallet-payment-box">
                      <FaWallet />

                      <h3>
                        Thanh toán qua ví điện tử
                      </h3>

                      <p>
                        Chọn ví điện tử của bạn ở bước
                        thanh toán.
                      </p>

                      <strong>
                        Số tiền: {currency(totalPrice)}
                      </strong>
                    </div>
                  )}

                </div>

                <button
                  type="button"
                  className="payment-confirmed-btn"
                  onClick={() => setPaymentConfirmed(true)}
                  disabled={paymentConfirmed}
                >
                  {paymentConfirmed
                    ? "✓ Đã xác nhận thanh toán"
                    : "Tôi đã thanh toán"}
                </button>

                <button
                  type="button"
                  className="payment-submit-btn"
                  onClick={handleBooking}
                  disabled={paymentLoading || !paymentConfirmed}
                >
                  {paymentLoading
                    ? "Đang xử lý thanh toán..."
                    : !paymentConfirmed
                    ? "Xác nhận thanh toán trước"
                    : `Hoàn tất đặt vé • ${currency(totalPrice)}`}
                </button>

              </div>

              <aside className="payment-order-card">

                <div className="payment-order-title">
                  <FaTicketAlt />
                  <h2>Thông tin vé</h2>
                </div>

                <div className="payment-movie">
                  {selectedMovie.posterUrl ? (
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                    />
                  ) : (
                    <div className="payment-poster-empty">
                      <FaFilm />
                    </div>
                  )}

                  <div>
                    <strong>
                      {selectedMovie.title}
                    </strong>

                    <span>
                      {selectedMovie.genre ||
                        "Phim điện ảnh"}
                    </span>
                  </div>
                </div>

                <div className="payment-order-details">

                  <div>
                    <span>Rạp</span>
                    <strong>
                      {selectedShowtime?.cinemaName ||
                        "Chưa chọn"}
                    </strong>
                  </div>

                  <div>
                    <span>Phòng</span>
                    <strong>
                      {selectedShowtime?.roomName ||
                        "Chưa cập nhật"}
                    </strong>
                  </div>

                  <div>
                    <span>Ngày</span>
                    <strong>
                      {selectedShowtime
                        ? formatDate(
                            selectedShowtime.showDate
                          )
                        : "Chưa chọn"}
                    </strong>
                  </div>

                  <div>
                    <span>Suất</span>
                    <strong>
                      {selectedShowtime
                        ? formatTime(
                            selectedShowtime.startTime
                          )
                        : "Chưa chọn"}
                    </strong>
                  </div>

                  <div>
                    <span>Ghế</span>
                    <strong>
                      {selectedSeats.join(", ")}
                    </strong>
                  </div>

                </div>

                <div className="payment-price">

                  <div>
                    <span>
                      {selectedSeats.length} vé ×{" "}
                      {currency(
                        selectedShowtime?.ticketPrice || 0
                      )}
                    </span>

                    <strong>
                      {currency(totalPrice)}
                    </strong>
                  </div>

                  <div className="payment-final-total">
                    <span>Tổng thanh toán</span>

                    <strong>
                      {currency(totalPrice)}
                    </strong>
                  </div>

                </div>

              </aside>

            </div>
          </section>
        )}

      </div>
    </main>
  );
}

export default Booking;