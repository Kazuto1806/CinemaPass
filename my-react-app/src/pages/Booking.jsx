import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../components/useNotification";
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
import { API_BASE, getMissingPosterFallback } from "../constants";

const MOVIE_API_URL = `${API_BASE}/api/movies`;
const SHOWTIME_API_URL = `${API_BASE}/api/showtimes`;
const SEAT_API_URL = `${API_BASE}/api/seats`;
const TICKET_TYPE_API_URL = `${API_BASE}/api/tickettypes`;

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

  const normalized = String(posterUrl).trim();
  const fallback = getMissingPosterFallback(normalized);

  if (fallback) return fallback;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }

  const fileName = normalized.split("/").pop()?.toLowerCase();

  if (!fileName) return normalized;

  const asset = Object.entries(posterAssets).find(
    ([path]) => path.split("/").pop()?.toLowerCase() === fileName
  );

  if (asset) {
    return asset[1];
  }

  return normalized;
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
  const { notify } = useNotification();

  // CHẶN ĐẶT VÉ KHI CHƯA ĐĂNG NHẬP
  // Lưu lại trang hiện tại để đăng nhập xong quay lại đúng suất/phim đang chọn.
  const isAuthenticated = () => {
    const userId = Number(localStorage.getItem("userId"));
    return (
      localStorage.getItem("isLoggedIn") === "true" &&
      Number.isInteger(userId) &&
      userId > 0
    );
  };

  const redirectToLogin = () => {
    if (isAuthenticated()) return false;

    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnTo)}`, {
      replace: true,
    });
    return true;
  };

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId"));
    const authenticated =
      localStorage.getItem("isLoggedIn") === "true" &&
      Number.isInteger(userId) &&
      userId > 0;

    if (!authenticated) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?returnUrl=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
    }
  }, [location.pathname, location.search, navigate]);

  const queryParams = new URLSearchParams(location.search);
  const selectedMovieNameFromUrl = queryParams.get("movieName")?.trim();
  const selectedMovieIdFromUrl = Number(queryParams.get("movieId"));
  const selectedShowtimeIdFromUrl = Number(queryParams.get("showtimeId"));

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seatList, setSeatList] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);

  // Mã phiên riêng cho tab trình duyệt này để backend biết
  // ghế nào đang được chính khách này giữ.
  const [holdToken] = useState(() => {
    const storageKey = "cinemapass.seatHoldToken";
    let token = sessionStorage.getItem(storageKey);

    if (!token) {
      token = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(storageKey, token);
    }

    return token;
  });
  const [seatActionLoading, setSeatActionLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const [selectedMovieId, setSelectedMovieId] = useState(
    !selectedMovieNameFromUrl && Number.isFinite(selectedMovieIdFromUrl)
      ? selectedMovieIdFromUrl
      : null
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [selectedTicketTypeId, setSelectedTicketTypeId] =
    useState(null);

  // 1 = chọn suất + ghế + loại vé
  // 2 = thanh toán
  const [bookingStep, setBookingStep] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState("qr");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    // Khong goi cac API dat ve khi nguoi dung chua dang nhap.
    if (!isAuthenticated()) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const [
          movieResponse,
          showtimeResponse,
          ticketTypeResponse,
        ] = await Promise.all([
          fetch(MOVIE_API_URL),
          fetch(SHOWTIME_API_URL),
          fetch(TICKET_TYPE_API_URL),
        ]);

        if (!movieResponse.ok) {
          throw new Error("Không lấy được danh sách phim");
        }

        if (!showtimeResponse.ok) {
          throw new Error("Không lấy được danh sách suất chiếu");
        }

        const movieData = await movieResponse.json();
        const showtimeData = await showtimeResponse.json();

        let ticketTypeData = [];

        if (ticketTypeResponse.ok) {
          ticketTypeData = await ticketTypeResponse.json();
        }

        const normalizedMovies = Array.isArray(movieData)
          ? movieData.map((movie) => ({
              ...movie,
              posterUrl: getPosterUrl(movie.posterUrl),
            }))
          : [];

        const normalizedTicketTypes = Array.isArray(ticketTypeData)
          ? ticketTypeData.filter(
              (ticketType) =>
                String(ticketType.status || "Active").toLowerCase() !==
                "inactive"
            )
          : [];

        setMovies(normalizedMovies);
        setShowtimes(
          Array.isArray(showtimeData) ? showtimeData : []
        );
        setTicketTypes(normalizedTicketTypes);

        if (normalizedTicketTypes.length) {
          setSelectedTicketTypeId(
            Number(normalizedTicketTypes[0].ticketTypeId)
          );
        }
      } catch (error) {
        console.error(
          "Lỗi tải dữ liệu đặt vé từ backend:",
          error
        );

        setMovies([]);
        setShowtimes([]);
        setTicketTypes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!movies.length) return;

    if (selectedMovieNameFromUrl) {
      const movieFromUrl = movies.find(
        (movie) =>
          String(movie.title || "").trim().toLocaleLowerCase() ===
          selectedMovieNameFromUrl.toLocaleLowerCase()
      );

      if (movieFromUrl) {
        setSelectedMovieId(movieFromUrl.movieId);
        return;
      }
    }

    const showtimeFromUrl = showtimes.find(
      (showtime) =>
        Number(showtime.showtimeId) === selectedShowtimeIdFromUrl
    );

    if (showtimeFromUrl) {
      setSelectedMovieId(Number(showtimeFromUrl.movieId));
      return;
    }

    if (
      Number.isInteger(selectedMovieIdFromUrl) &&
      selectedMovieIdFromUrl > 0 &&
      movies.some(
        (movie) => Number(movie.movieId) === selectedMovieIdFromUrl
      )
    ) {
      setSelectedMovieId(selectedMovieIdFromUrl);
      return;
    }

    if (
      !selectedMovieId ||
      !movies.some(
        (movie) => Number(movie.movieId) === Number(selectedMovieId)
      )
    ) {
      setSelectedMovieId(movies[0].movieId);
    }
  }, [
    movies,
    selectedMovieId,
    selectedMovieIdFromUrl,
    selectedMovieNameFromUrl,
    selectedShowtimeIdFromUrl,
    showtimes,
  ]);

  const selectedMovie = useMemo(
    () =>
      movies.find(
        (movie) => movie.movieId === selectedMovieId
      ) ||
      movies[0] ||
      null,
    [movies, selectedMovieId]
  );

  const movieShowtimes = useMemo(() => {
    if (!selectedMovie) return [];

    return showtimes.filter(
      (item) =>
        Number(item.movieId) ===
        Number(selectedMovie.movieId)
    );
  }, [selectedMovie, showtimes]);

  const dates = useMemo(() => {
    const uniqueDates = [
      ...new Set(
        movieShowtimes.map((item) => String(item.showDate).slice(0, 10))
      ),
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

    const requestedShowtime = movieShowtimes.find(
      (item) =>
        Number(item.showtimeId) === selectedShowtimeIdFromUrl
    );
    const requestedDate = requestedShowtime
      ? String(requestedShowtime.showDate).slice(0, 10)
      : "";
    const firstDate = dates[0];

    setSelectedDate((current) =>
      requestedDate && dates.includes(requestedDate)
        ? requestedDate
        : current && dates.includes(current)
          ? current
          : firstDate
    );
  }, [dates, movieShowtimes, selectedShowtimeIdFromUrl]);

  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];

    const filtered = movieShowtimes.filter(
      (item) =>
        String(item.showDate).slice(0, 10) === selectedDate
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
      times: group.times.sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));
  }, [movieShowtimes, selectedDate]);

  useEffect(() => {
    if (!timeOptions.length) {
      setSelectedCinema("");
      setSelectedTime("");
      return;
    }

    const firstGroup = timeOptions[0];
    const requestedShowtime = movieShowtimes.find(
      (item) =>
        Number(item.showtimeId) === selectedShowtimeIdFromUrl &&
        String(item.showDate).slice(0, 10) === selectedDate
    );
    const requestedCinema = requestedShowtime?.cinemaName || "";
    const preferredCinema =
      requestedCinema &&
      timeOptions.some((group) => group.cinemaName === requestedCinema)
        ? requestedCinema
        : "";

    const currentCinemaIsAvailable = timeOptions.some(
      (group) => group.cinemaName === selectedCinema
    );
    const nextCinema = preferredCinema ||
      (currentCinemaIsAvailable ? selectedCinema : firstGroup.cinemaName);
    setSelectedCinema(nextCinema);

    const currentGroup =
      timeOptions.find(
        (group) => group.cinemaName === nextCinema
      ) || firstGroup;

    const firstTime =
      currentGroup?.times[0]?.time || "";
    const requestedTime = requestedShowtime
      ? formatTime(requestedShowtime.startTime)
      : "";

    setSelectedTime((value) =>
      requestedTime &&
      currentGroup?.times.some((item) => item.time === requestedTime)
        ? requestedTime
        : currentGroup?.times.some((item) => item.time === value)
          ? value
          : firstTime
    );
  }, [
    movieShowtimes,
    selectedCinema,
    selectedDate,
    selectedShowtimeIdFromUrl,
    timeOptions,
  ]);

  const selectedShowtime = useMemo(() => {
    if (
      !selectedDate ||
      !selectedCinema ||
      !selectedTime
    ) {
      return null;
    }

    const requestedShowtime = movieShowtimes.find(
      (item) =>
        Number(item.showtimeId) === selectedShowtimeIdFromUrl &&
        String(item.showDate).slice(0, 10) === selectedDate &&
        (item.cinemaName || "") === selectedCinema &&
        formatTime(item.startTime) === selectedTime
    );

    if (requestedShowtime) return requestedShowtime;

    return movieShowtimes.find(
      (item) =>
        String(item.showDate).slice(0, 10) === selectedDate &&
        (item.cinemaName || "") === selectedCinema &&
        formatTime(item.startTime) === selectedTime
    );
  }, [
    movieShowtimes,
    selectedCinema,
    selectedDate,
    selectedShowtimeIdFromUrl,
    selectedTime,
  ]);

  const availableTicketTypes = useMemo(() => {
    const assignments = selectedShowtime?.ticketTypePrices;

    if (!Array.isArray(assignments)) {
      return ticketTypes;
    }

    return assignments
      .map((assignment) => {
        const ticketType = ticketTypes.find(
          (item) =>
            Number(item.ticketTypeId) === Number(assignment.ticketTypeId)
        );

        return ticketType
          ? {
              ...ticketType,
              category: assignment.category || ticketType.category,
              price: Number(assignment.price),
            }
          : null;
      })
      .filter(Boolean);
  }, [selectedShowtime, ticketTypes]);

  useEffect(() => {
    const availableIds = availableTicketTypes.map(
      (ticketType) => Number(ticketType.ticketTypeId)
    );

    if (!availableIds.length) {
      setSelectedTicketTypeId(null);
      return;
    }

    if (!availableIds.includes(Number(selectedTicketTypeId))) {
      setSelectedTicketTypeId(availableIds[0]);
    }
  }, [availableTicketTypes, selectedTicketTypeId]);

  useEffect(() => {
    const showtimeId = Number(selectedShowtime?.showtimeId);
    const roomId = Number(selectedShowtime?.roomId);

    if (!showtimeId) {
      setSeatList([]);
      setSelectedSeats([]);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;

    setSeatList([]);
    setSelectedSeats([]);

    const loadSeats = async () => {
      try {
        const response = await fetch(
          `${SEAT_API_URL}?showtimeId=${showtimeId}&holdToken=${encodeURIComponent(holdToken)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Không tải được sơ đồ ghế (${response.status}).`);
        }

        const data = await response.json();
        const roomSeats = Array.isArray(data)
          ? data.filter((seat) => Number(seat.roomId) === roomId)
          : [];

        const uniqueSeats = new Map();
        roomSeats.forEach((seat) => {
          const seatCode = String(seat.seatCode || "")
            .trim()
            .toUpperCase();

          if (seatCode && !uniqueSeats.has(seatCode)) {
            uniqueSeats.set(seatCode, { ...seat, seatCode });
          }
        });

        if (isActive) {
          setSeatList([...uniqueSeats.values()]);
        }
      } catch (error) {
        if (error.name !== "AbortError" && isActive) {
          console.error("Lỗi tải ghế từ backend:", error);
          setSeatList([]);
        }
      }
    };

    // Tải ngay và cập nhật định kỳ để khách khác thấy ghế đang được giữ.
    loadSeats();
    const pollId = window.setInterval(loadSeats, 2500);

    return () => {
      isActive = false;
      window.clearInterval(pollId);
      controller.abort();

      // Khi đổi suất chiếu hoặc rời trang, nhả các ghế của phiên này.
      fetch(`${SEAT_API_URL}/release-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showtimeId, holdToken }),
        keepalive: true,
      }).catch(() => {
        // Ghế vẫn tự hết hạn sau 5 phút nếu trình duyệt mất kết nối.
      });
    };
  }, [selectedShowtime?.showtimeId, selectedShowtime?.roomId, holdToken]);

  useEffect(() => {
    setSelectedSeats((current) =>
      current.filter((seatCode) =>
        !seatList.some((item) =>
          String(item.seatCode).toUpperCase() === seatCode &&
          (item.isBooked || (item.isHeld && !item.isHeldByMe))
        )
      )
    );
  }, [seatList]);

  const reservedSeats = useMemo(
    () =>
      seatList
        .filter((seat) => seat.isBooked || (seat.isHeld && !seat.isHeldByMe))
        .map((seat) => String(seat.seatCode).toUpperCase()),
    [seatList]
  );

  const selectedTicketType = useMemo(
    () =>
      availableTicketTypes.find(
        (ticketType) =>
          Number(ticketType.ticketTypeId) ===
          Number(selectedTicketTypeId)
      ) || null,
    [availableTicketTypes, selectedTicketTypeId]
  );

  const ticketUnitPrice =
    selectedTicketType?.price != null
      ? Number(selectedTicketType.price)
      : Number(selectedShowtime?.ticketPrice || 0);

  const totalPrice =
    ticketUnitPrice * selectedSeats.length;

  const toggleSeat = async (seat) => {
    const seatCode = String(seat || "").trim().toUpperCase();
    const showtimeId = Number(selectedShowtime?.showtimeId);

    if (!seatCode || !showtimeId || seatActionLoading) return;

    const currentlySelected = selectedSeats.includes(seatCode);

    if (!currentlySelected && reservedSeats.includes(seatCode)) {
      notify("Ghế này đã được đặt hoặc đang được khách khác giữ. Vui lòng chọn ghế khác.", "warning");
      return;
    }

    if (!currentlySelected && selectedSeats.length >= 8) {
      notify("Mỗi lần chỉ có thể chọn tối đa 8 ghế.", "warning");
      return;
    }

    setSeatActionLoading(true);

    try {
      const endpoint = currentlySelected ? "release" : "hold";
      const body = currentlySelected
        ? { showtimeId, seatCode, holdToken }
        : {
            showtimeId,
            seatCode,
            holdToken,
            userId: Number(localStorage.getItem("userId")) || null,
          };

      const response = await fetch(`${SEAT_API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Không thể ${currentlySelected ? "nhả" : "giữ"} ghế ${seatCode}.`);
      }

      if (currentlySelected) {
        setSelectedSeats((current) => current.filter((item) => item !== seatCode));
      } else {
        setSelectedSeats((current) =>
          current.includes(seatCode) ? current : [...current, seatCode]
        );
      }

      // Cập nhật ngay trạng thái ghế trên trình duyệt hiện tại.
      const refreshResponse = await fetch(
        `${SEAT_API_URL}?showtimeId=${showtimeId}&holdToken=${encodeURIComponent(holdToken)}`
      );
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        if (Array.isArray(refreshedData)) {
          setSeatList(refreshedData.map((item) => ({
            ...item,
            seatCode: String(item.seatCode || "").trim().toUpperCase(),
          })));
        }
      }
    } catch (error) {
      console.error("Lỗi giữ/nhả ghế:", error);
      notify(error.message || "Không thể cập nhật ghế. Vui lòng thử lại.");

      // Tải lại sơ đồ ngay nếu ghế vừa bị khách khác giữ.
      try {
        const refreshResponse = await fetch(
          `${SEAT_API_URL}?showtimeId=${showtimeId}&holdToken=${encodeURIComponent(holdToken)}`
        );
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          if (Array.isArray(refreshedData)) {
            setSeatList(refreshedData.map((item) => ({
              ...item,
              seatCode: String(item.seatCode || "").trim().toUpperCase(),
            })));
          }
        }
      } catch (refreshError) {
        console.error("Không thể làm mới sơ đồ ghế:", refreshError);
      }
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleContinuePayment = () => {
    if (redirectToLogin()) return;

    if (!selectedShowtime) {
      notify("Vui lòng chọn suất chiếu trước khi tiếp tục.", "warning");
      return;
    }

    if (!selectedSeats.length) {
      notify("Vui lòng chọn ít nhất một ghế trước khi tiếp tục.", "warning");
      return;
    }

    if (!availableTicketTypes.length) {
      notify(
        "Suất chiếu này chưa có chính sách vé. Vui lòng chọn suất khác hoặc liên hệ rạp.",
        "warning"
      );
      return;
    }

    if (
      !availableTicketTypes.some(
        (ticketType) =>
          Number(ticketType.ticketTypeId) === Number(selectedTicketTypeId)
      )
    ) {
      notify("Vui lòng chọn loại vé.", "warning");
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
    if (redirectToLogin()) return;

    if (!selectedShowtime) {
      notify("Vui lòng chọn suất chiếu.", "warning");
      return;
    }

    if (!selectedSeats.length) {
      notify("Vui lòng chọn ít nhất một ghế.", "warning");
      return;
    }

    if (!selectedTicketTypeId) {
      notify("Vui lòng chọn loại vé.", "warning");
      return;
    }

    if (!paymentConfirmed) {
      notify("Vui lòng xác nhận bạn đã thanh toán trước khi tiếp tục.", "warning");
      return;
    }

    const userId = Number(localStorage.getItem("userId"));

    if (!Number.isInteger(userId) || userId <= 0) {
      redirectToLogin();
      return;
    }

    try {
      setPaymentLoading(true);

      const response = await fetch(
        `${API_BASE}/api/tickets/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            movieId: Number(selectedMovie.movieId),
            showtimeId: Number(
              selectedShowtime.showtimeId
            ),
            seatCodes: selectedSeats,
            holdToken,
            ticketPrice: Number(ticketUnitPrice),
            ticketTypeId: Number(
              selectedTicketTypeId
            ),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Thanh toán thất bại."
        );
      }

      setBookingResult({
        ...data,
        bookedSeats:
          data.bookedSeats?.length
            ? data.bookedSeats
            : selectedSeats,
      });

      setBookingSuccess(true);

      // Vé đã được lưu; nhả các lượt giữ tạm để tránh dữ liệu giữ ghế cũ.
      await fetch(`${SEAT_API_URL}/release-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: Number(selectedShowtime.showtimeId),
          holdToken,
        }),
      }).catch(() => {});
    } catch (error) {
      console.error("Lỗi thanh toán:", error);

      notify(
        error.message ||
          "Có lỗi xảy ra khi thanh toán."
      );
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
          <h2>
            Không tìm thấy phim để đặt vé.
          </h2>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
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
              <span>Loại vé</span>
              <strong>
                {selectedTicketType?.name ||
                  "Chưa cập nhật"}
              </strong>
            </div>

            <div>
              <span>Rạp</span>
              <strong>
                {selectedShowtime?.cinemaName ||
                  "Chưa cập nhật"}
              </strong>
            </div>

            <div>
              <span>Suất chiếu</span>
              <strong>
                {selectedShowtime
                  ? `${formatDate(
                      selectedShowtime.showDate
                    )} • ${formatTime(
                      selectedShowtime.startTime
                    )}`
                  : "Chưa cập nhật"}
              </strong>
            </div>

            <div>
              <span>Ghế</span>
              <strong>
                {bookingResult?.bookedSeats?.join(
                  ", "
                ) ||
                  selectedSeats.join(", ")}
              </strong>
            </div>

            <div className="success-total">
              <span>Tổng thanh toán</span>
              <strong>
                {currency(totalPrice)}
              </strong>
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
          {bookingStep === 2
            ? "Quay lại chọn ghế"
            : "Quay lại"}
        </button>

        {bookingStep === 1 ? (
          <>
            <section className="booking-header-card">
              <img
                src={selectedMovie.posterUrl || ""}
                alt={selectedMovie.title}
                className="booking-poster"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
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
                      ? formatDate(
                          selectedMovie.releaseDate
                        )
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
                          selectedDate === date
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedDate(date)
                        }
                      >
                        {formatDate(date)}
                      </button>
                    ))
                  ) : (
                    <p className="booking-empty-text">
                      Hiện chưa có suất chiếu cho
                      phim này.
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
                          {group.times.map(
                            (slot) => (
                              <button
                                key={`${group.cinemaName}-${slot.time}-${slot.showtimeId}`}
                                type="button"
                                className={`time-button ${
                                  selectedCinema ===
                                    group.cinemaName &&
                                  selectedTime ===
                                    slot.time
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => {
                                  setSelectedCinema(
                                    group.cinemaName
                                  );
                                  setSelectedTime(
                                    slot.time
                                  );
                                  setBookingStep(1);
                                }}
                              >
                                <span>
                                  {slot.time}
                                </span>

                                <small>
                                  {currency(
                                    slot.price
                                  )}
                                </small>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="booking-empty-state">
                      <FaClock />

                      <p>
                        Chưa có suất chiếu phù
                        hợp với ngày bạn chọn.
                      </p>
                    </div>
                  )}
                </div>

                {/* LOẠI VÉ */}
                <div className="ticket-type-section">
                  <div className="booking-section-title">
                    <FaTicketAlt />
                    <h2>Chọn loại vé</h2>
                  </div>

                  {availableTicketTypes.length ? (
                    <div className="ticket-type-list">
                      {availableTicketTypes.map(
                        (ticketType) => {
                          const ticketTypeId =
                            Number(
                              ticketType.ticketTypeId
                            );

                          const isActive =
                            Number(
                              selectedTicketTypeId
                            ) === ticketTypeId;

                          return (
                            <button
                              key={ticketTypeId}
                              type="button"
                              className={`ticket-type-option ${isActive ? "active" : ""}`}
                              onClick={() =>
                                setSelectedTicketTypeId(
                                  ticketTypeId
                                )
                              }
                            >
                              <div className="ticket-type-option-content">
                                <div>
                                  <strong>
                                    {
                                      ticketType.name
                                    }
                                  </strong>

                                  <div className="ticket-type-category-label">
                                    {ticketType.category === "Program"
                                      ? "Thời điểm / chương trình"
                                      : "khách hàng"}
                                  </div>

                                  {ticketType.description && (
                                    <div className="ticket-type-description">
                                      {
                                        ticketType.description
                                      }
                                    </div>
                                  )}
                                </div>

                                <strong>
                                  {currency(
                                    ticketType.price
                                  )}
                                </strong>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <p className="booking-empty-text">
                      Suất chiếu này chưa được gán
                      chính sách vé.
                    </p>
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
                      const seatCode =
                        seat.seatCode;

                      const isBooked = Boolean(seat.isBooked);
                      const isHeldByOther = Boolean(seat.isHeld && !seat.isHeldByMe);
                      const isReserved = isBooked || isHeldByOther;

                      const isSelected =
                        selectedSeats.includes(
                          seatCode
                        );

                      return (
                        <button
                          key={seatCode}
                          type="button"
                          className={`seat ${
                            isReserved
                              ? "reserved"
                              : ""
                          } ${
                            isSelected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleSeat(
                              seatCode
                            )
                          }
                          disabled={isReserved || seatActionLoading}
                          title={
                            isBooked
                              ? `Ghế ${seatCode} đã được đặt`
                              : isHeldByOther
                              ? `Ghế ${seatCode} đang được khách khác giữ`
                              : `Chọn ghế ${seatCode}`
                          }
                          aria-label={
                            isBooked
                              ? `Ghế ${seatCode} đã được đặt`
                              : isHeldByOther
                              ? `Ghế ${seatCode} đang được giữ`
                              : `Ghế ${seatCode}`
                          }
                        >
                          {seatCode.replace(
                            /[0-9]/g,
                            ""
                          )}

                          {seatCode.replace(
                            /[^0-9]/g,
                            ""
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="booking-empty-text">
                      Sơ đồ ghế đang được cập nhập.
                      Vui lòng thử lại sau.
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
                    <small>Loại vé</small>

                    <strong>
                      {selectedTicketType?.name ||
                        "Chưa chọn"}
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
                  onClick={
                    handleContinuePayment
                  }
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
                Kiểm tra thông tin và chọn phương
                thức thanh toán.
              </p>
            </div>

            <div className="payment-layout">

              <div className="payment-main">

                <div className="payment-card">
                  <div className="payment-card-title">
                    <FaCreditCard />

                    <div>
                      <h2>
                        Phương thức thanh toán
                      </h2>

                      <p>
                        Chọn một phương thức để
                        tiếp tục
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
                        setPaymentConfirmed(
                          false
                        );
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
                          Thanh toán bằng mã QR
                          ngân hàng
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
                        setPaymentConfirmed(
                          false
                        );
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
                          Visa, Mastercard, ATM
                          nội địa
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
                        setPaymentMethod(
                          "wallet"
                        );
                        setPaymentConfirmed(
                          false
                        );
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
                          Thanh toán qua ví điện
                          tử
                        </span>
                      </div>

                      <i
                        className={`payment-radio ${
                          paymentMethod ===
                          "wallet"
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
                          Mở ứng dụng ngân hàng và
                          quét mã QR để hoàn tất
                          thanh toán.
                        </p>

                        <strong>
                          Số tiền:{" "}
                          {currency(totalPrice)}
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
                        Đây là giao diện mô phỏng
                        thanh toán thẻ.
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
                        Chọn ví điện tử của bạn ở
                        bước thanh toán.
                      </p>

                      <strong>
                        Số tiền:{" "}
                        {currency(totalPrice)}
                      </strong>
                    </div>
                  )}

                </div>

                <button
                  type="button"
                  className="payment-confirmed-btn"
                  onClick={() =>
                    setPaymentConfirmed(true)
                  }
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
                  disabled={
                    paymentLoading ||
                    !paymentConfirmed
                  }
                >
                  {paymentLoading
                    ? "Đang xử lý thanh toán..."
                    : !paymentConfirmed
                    ? "Xác nhận thanh toán trước"
                    : `Hoàn tất đặt vé • ${currency(
                        totalPrice
                      )}`}
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
                      src={
                        selectedMovie.posterUrl
                      }
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
                    <span>Loại vé</span>

                    <strong>
                      {selectedTicketType?.name ||
                        "Chưa chọn"}
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
                      {currency(ticketUnitPrice)}
                    </span>

                    <strong>
                      {currency(totalPrice)}
                    </strong>
                  </div>

                  <div className="payment-final-total">
                    <span>
                      Tổng thanh toán
                    </span>

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