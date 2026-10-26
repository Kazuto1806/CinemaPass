import { useEffect, useState } from "react";
import NotificationPopup from "../../components/NotificationPopup";
import { API_BASE } from "../../constants";
import "./ShowtimeAdmin.css";

const API_URL = `${API_BASE}/api/showtimes`;
const MOVIE_API_URL = `${API_BASE}/api/movies`;
const CINEMA_API_URL = `${API_BASE}/api/cinemas`;
const TICKET_TYPES_API_URL = `${API_BASE}/api/tickettypes`;

// Chuẩn hóa trạng thái suất chiếu
const normalizeShowtimeStatus = (status) => {
  const value = String(status || "").trim();

  if (!value) {
    return "Đang hoạt động";
  }

  const normalized = value
    .replace(/Ð/g, "Đ")
    .replace(/\?/g, "")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const activePatterns = [
    "active",
    "dang hoat dong",
    "dang hot dong",
    "hoat dong",
  ];

  const pausedPatterns = [
    "tam ngung",
    "ngung",
  ];

  const endedPatterns = [
    "da ket thuc",
    "da kt thuc",
    "ket thuc",
    "kt thuc",
  ];

  if (activePatterns.some((term) => normalized.includes(term))) {
    return "Đang hoạt động";
  }

  if (pausedPatterns.some((term) => normalized.includes(term))) {
    return "Tạm ngưng";
  }

  if (endedPatterns.some((term) => normalized.includes(term))) {
    return "Đã kết thúc";
  }

  return value;
};

// Định dạng ngày giờ hiển thị
const formatShowtime = (showDate, time) => {
  if (!showDate || !time) {
    return "-";
  }

  const date = String(showDate).substring(0, 10);
  const timeText = String(time).substring(0, 5);

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year} ${timeText}`;
};

// Xác định ngày kết thúc nếu suất chiếu qua ngày mới
const getShowtimeEndDate = (showtime) => {
  const showDate = String(showtime.showDate || "").substring(0, 10);
  const startTime = String(showtime.startTime || "").substring(0, 5);
  const endTime = String(showtime.endTime || "").substring(0, 5);

  if (!showDate || !startTime || !endTime || endTime >= startTime) {
    return showDate;
  }

  const endDate = new Date(`${showDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);

  const pad = (value) => String(value).padStart(2, "0");

  return `${endDate.getFullYear()}-${pad(
    endDate.getMonth() + 1
  )}-${pad(endDate.getDate())}`;
};

// Kiểm tra loại vé trẻ em
const isChildTicket = (ticketType) => {
  const name = String(ticketType?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    name.includes("tre em") ||
    name.includes("thieu nhi") ||
    name.includes("child") ||
    name.includes("kid")
  );
};

// Kiểm tra loại vé người lớn
const isAdultTicket = (ticketType) => {
  const name = String(ticketType?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return /nguoi lon|adult/.test(name);
};

function ShowtimeAdmin() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);

  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Không còn sử dụng ticketPrice chung trong form.
  // Mỗi loại vé có giá riêng trong ticketTypePrices.
  const [formData, setFormData] = useState({
    movieId: "",
    cinemaId: "",
    roomId: "",
    startTime: "",
    endTime: "",
    ticketTypePrices: [],
    status: "Đang hoạt động",
  });

  // Phim đang được chọn
  const selectedMovie = movies.find(
    (movie) => Number(movie.movieId) === Number(formData.movieId)
  );

  // Phim T18 không được chọn loại vé trẻ em
  const isT18Movie = /^T18$/i.test(
    String(selectedMovie?.ageRating || "").trim()
  );

  const availableTicketTypes = ticketTypes.filter(
    (ticketType) => !(isT18Movie && isChildTicket(ticketType))
  );

  // Thông báo
  const showNotification = (
    type,
    title,
    message,
    onConfirm = null
  ) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closeNotification = () => {
    setNotification((current) => ({
      ...current,
      show: false,
      onConfirm: null,
    }));
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    loadShowtimes();
    loadMovies();
    loadCinemas();
    loadTicketTypes();

    const refreshInterval = window.setInterval(loadShowtimes, 30000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  // Tải danh sách suất chiếu
  const loadShowtimes = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách suất chiếu");
      }

      const data = await response.json();

      setShowtimes(
        Array.isArray(data)
          ? data.map((showtime) => ({
              ...showtime,
              status: normalizeShowtimeStatus(showtime.status),
            }))
          : []
      );
    } catch (error) {
      console.error(error);

      showNotification(
        "error",
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách suất chiếu"
      );
    }
  };

  // Tải danh sách phim
  const loadMovies = async () => {
    try {
      const response = await fetch(MOVIE_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách phim");
      }

      const data = await response.json();
      setMovies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      showNotification(
        "error",
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách phim"
      );
    }
  };

  // Tải danh sách rạp
  const loadCinemas = async () => {
    try {
      const response = await fetch(CINEMA_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách rạp");
      }

      const data = await response.json();
      setCinemas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);

      showNotification(
        "error",
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách rạp"
      );
    }
  };

  // Tải danh sách loại vé đang hoạt động
  const loadTicketTypes = async () => {
    try {
      const response = await fetch(TICKET_TYPES_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách chính sách vé");
      }

      const data = await response.json();

      setTicketTypes(
        Array.isArray(data)
          ? data.filter(
              (ticketType) =>
                String(ticketType.status || "Active").toLowerCase() !==
                "inactive"
            )
          : []
      );
    } catch (error) {
      console.error(error);

      showNotification(
        "error",
        "Lỗi tải dữ liệu",
        "Không thể tải danh sách chính sách vé"
      );
    }
  };

  // Tính giờ kết thúc theo thời lượng phim
  const calculateEndDateTime = (movieId, startDateTime) => {
    const movie = movies.find(
      (item) => String(item.movieId) === String(movieId)
    );

    const duration = Number(movie?.duration);

    if (
      !startDateTime ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return "";
    }

    const endDate = new Date(startDateTime);

    if (Number.isNaN(endDate.getTime())) {
      return "";
    }

    endDate.setMinutes(endDate.getMinutes() + duration);

    const pad = (value) => String(value).padStart(2, "0");

    return `${endDate.getFullYear()}-${pad(
      endDate.getMonth() + 1
    )}-${pad(endDate.getDate())}T${pad(
      endDate.getHours()
    )}:${pad(endDate.getMinutes())}`;
  };

  // Đặt lại form
  const resetForm = () => {
    setFormData({
      movieId: "",
      cinemaId: "",
      roomId: "",
      startTime: "",
      endTime: "",
      ticketTypePrices: [],
      status: "Đang hoạt động",
    });

    setEditingId(null);
  };

  // Mở form thêm suất chiếu
  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Chuyển giờ từ dữ liệu Backend sang input
  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    return String(time).substring(0, 5);
  };

  // Mở form sửa suất chiếu
  const openEditModal = (showtime) => {
    setEditingId(showtime.showtimeId);

    const showDate = showtime.showDate
      ? String(showtime.showDate).substring(0, 10)
      : "";

    const startTime = formatTime(showtime.startTime);
    const endTime = formatTime(showtime.endTime);

    const startDateTime =
      showDate && startTime
        ? `${showDate}T${startTime}`
        : "";

    const ticketTypePrices = Array.isArray(showtime.ticketTypePrices)
      ? showtime.ticketTypePrices.map((assignment) => ({
          ticketTypeId: Number(assignment.ticketTypeId),
          price:
            assignment.price === null ||
            assignment.price === undefined
              ? ""
              : String(assignment.price),
        }))
      : [];

    setFormData({
      movieId: showtime.movieId?.toString() || "",
      cinemaId: showtime.cinemaId?.toString() || "",
      roomId: showtime.roomId?.toString() || "",
      startTime: startDateTime,
      endTime:
        calculateEndDateTime(showtime.movieId, startDateTime) ||
        (showDate && endTime
          ? `${showDate}T${endTime}`
          : ""),
      ticketTypePrices,
      status: normalizeShowtimeStatus(showtime.status),
    });

    setShowModal(true);
  };

  // Đóng form
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Xử lý thay đổi dữ liệu form
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      // Tự động tính giờ kết thúc khi đổi phim hoặc giờ bắt đầu
      if (name === "movieId" || name === "startTime") {
        next.endTime = calculateEndDateTime(
          name === "movieId" ? value : previous.movieId,
          name === "startTime" ? value : previous.startTime
        );
      }

      // Nếu chọn phim T18, loại bỏ vé trẻ em đã chọn
      if (name === "movieId") {
        const movie = movies.find(
          (item) => Number(item.movieId) === Number(value)
        );

        const selectedIsT18 = /^T18$/i.test(
          String(movie?.ageRating || "").trim()
        );

        if (selectedIsT18) {
          next.ticketTypePrices =
            previous.ticketTypePrices.filter((assignment) => {
              const ticketType = ticketTypes.find(
                (item) =>
                  Number(item.ticketTypeId) ===
                  Number(assignment.ticketTypeId)
              );

              return ticketType && !isChildTicket(ticketType);
            });
        }
      }

      return next;
    });
  };

  // Chọn hoặc bỏ chọn một loại vé
  const toggleTicketType = (ticketType, checked) => {
    setFormData((previous) => ({
      ...previous,

      ticketTypePrices: checked
        ? [
            ...previous.ticketTypePrices,
            {
              ticketTypeId: Number(ticketType.ticketTypeId),

              // Để trống để người dùng tự nhập giá
              price: "",
            },
          ]
        : previous.ticketTypePrices.filter(
            (assignment) =>
              Number(assignment.ticketTypeId) !==
              Number(ticketType.ticketTypeId)
          ),
    }));
  };

  // Cập nhật giá riêng cho từng loại vé
  const updateTicketTypePrice = (ticketTypeId, price) => {
    setFormData((previous) => ({
      ...previous,

      ticketTypePrices: previous.ticketTypePrices.map((assignment) =>
        Number(assignment.ticketTypeId) === Number(ticketTypeId)
          ? {
              ...assignment,
              price,
            }
          : assignment
      ),
    }));
  };

  // Kiểm tra dữ liệu và lưu suất chiếu
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Kiểm tra thông tin bắt buộc
    if (
      !formData.movieId ||
      !formData.roomId ||
      !formData.startTime ||
      !formData.endTime ||
      formData.ticketTypePrices.length === 0
    ) {
      showNotification(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin và chọn ít nhất một loại vé."
      );

      return;
    }

    // Kiểm tra giá của từng loại vé
    const hasInvalidPrice = formData.ticketTypePrices.some(
      (assignment) =>
        assignment.price === "" ||
        assignment.price === null ||
        assignment.price === undefined ||
        !Number.isFinite(Number(assignment.price)) ||
        Number(assignment.price) <= 0 ||
        !Number.isInteger(Number(assignment.price))
    );

    if (hasInvalidPrice) {
      showNotification(
        "warning",
        "Giá vé không hợp lệ",
        "Vui lòng nhập giá cho từng loại vé. Giá vé phải là số nguyên lớn hơn 0."
      );

      return;
    }

    // Tách ngày và giờ
    const [showDate, startTime] = formData.startTime.split("T");

    const [, endTime] = formData.endTime.split("T");

    if (!showDate || !startTime || !endTime) {
      showNotification(
        "warning",
        "Thời gian không hợp lệ",
        "Vui lòng kiểm tra thời gian bắt đầu và kết thúc."
      );

      return;
    }

    // Tìm giá vé người lớn nếu có
    const adultTicket = formData.ticketTypePrices.find(
      (assignment) => {
        const ticketType = ticketTypes.find(
          (item) =>
            Number(item.ticketTypeId) ===
            Number(assignment.ticketTypeId)
        );

        return ticketType && isAdultTicket(ticketType);
      }
    );

    // Giá dự phòng để tương thích với Backend hiện tại.
    // Giá thực tế của từng loại vé vẫn được gửi riêng bên dưới.
    const fallbackTicketPrice =
      adultTicket?.price ??
      formData.ticketTypePrices[0]?.price;

    const payload = {
      movieId: Number(formData.movieId),

      roomId: Number(formData.roomId),

      showDate,

      startTime: `${startTime}:00`,

      endTime: `${endTime}:00`,

      // Giữ trường này nếu DTO Backend hiện tại còn yêu cầu.
      ticketPrice: Number(fallbackTicketPrice),

      // Giá riêng của từng loại vé
      ticketTypePrices: formData.ticketTypePrices.map(
        (assignment) => ({
          ticketTypeId: Number(assignment.ticketTypeId),
          price: Number(assignment.price),
        })
      ),

      status: formData.status || "Đang hoạt động",
    };

    console.log("PAYLOAD GỬI BACKEND:", payload);

    try {
      let response;

      if (editingId) {
        // Cập nhật suất chiếu
        response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        });
      } else {
        // Thêm suất chiếu
        response = await fetch(API_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        });
      }

      // Đọc phản hồi, kể cả khi Backend không trả JSON hợp lệ
      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      console.log("BACKEND RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.title ||
            responseText ||
            "Có lỗi xảy ra khi lưu suất chiếu."
        );
      }

      showNotification(
        "success",
        "Thành công",
        editingId
          ? "Cập nhật suất chiếu thành công."
          : "Thêm suất chiếu thành công."
      );

      closeModal();

      await loadShowtimes();
    } catch (error) {
      console.error("Lỗi lưu suất chiếu:", error);

      showNotification(
        "error",
        "Không thể lưu suất chiếu",
        error.message || "Không thể lưu suất chiếu."
      );
    }
  };

  // Xóa suất chiếu
  const deleteShowtime = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.title ||
            "Không thể xóa suất chiếu."
        );
      }

      showNotification(
        "success",
        "Thành công",
        "Xóa suất chiếu thành công."
      );

      await loadShowtimes();
    } catch (error) {
      console.error(error);

      showNotification(
        "error",
        "Không thể xóa suất chiếu",
        error.message || "Không thể xóa suất chiếu."
      );
    }
  };

  // Xác nhận trước khi xóa
  const handleDelete = (id) => {
    showNotification(
      "warning",
      "Xác nhận xóa suất chiếu",
      "Bạn có chắc muốn xóa suất chiếu này không?",
      () => {
        closeNotification();
        void deleteShowtime(id);
      }
    );
  };

  // Định dạng tiền Việt Nam
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + " đ";
  };

  // Lọc danh sách suất chiếu
  const filteredShowtimes = showtimes.filter((showtime) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    return (
      (showtime.movieTitle || "").toLowerCase().includes(keyword) ||
      (showtime.cinemaName || "").toLowerCase().includes(keyword) ||
      (showtime.roomName || "").toLowerCase().includes(keyword) ||
      String(showtime.showtimeId).includes(keyword)
    );
  });

  return (
    <div className="showtime-admin">
      {/* Tiêu đề */}
      <div className="showtime-admin-header">
        <div>
          <h1>Quản lý suất chiếu</h1>
          <p>Quản lý lịch chiếu phim tại các rạp</p>
        </div>

        <button
          className="showtime-add-btn"
          onClick={openAddModal}
        >
          + Thêm suất chiếu
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="showtime-toolbar">
        <input
          type="text"
          placeholder="Tìm phim, rạp, phòng..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Bảng suất chiếu */}
      <div className="showtime-table-container">
        <table className="showtime-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Phim</th>
              <th>Rạp</th>
              <th>Thời gian</th>
              <th>Phòng</th>
              <th>Giá vé theo loại</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filteredShowtimes.length === 0 ? (
              <tr>
                <td colSpan="8" className="showtime-empty">
                  Chưa có suất chiếu
                </td>
              </tr>
            ) : (
              filteredShowtimes.map((showtime) => (
                <tr key={showtime.showtimeId}>
                  <td>#{showtime.showtimeId}</td>

                  <td>{showtime.movieTitle || "-"}</td>

                  <td>{showtime.cinemaName || "-"}</td>

                  <td>
                    <div>
                      {formatShowtime(
                        showtime.showDate,
                        showtime.startTime
                      )}
                    </div>

                    {showtime.endTime && (
                      <small>
                        đến{" "}
                        {formatShowtime(
                          getShowtimeEndDate(showtime),
                          showtime.endTime
                        )}
                      </small>
                    )}
                  </td>

                  <td>{showtime.roomName || "-"}</td>

                  <td>
                    {Array.isArray(showtime.ticketTypePrices) &&
                    showtime.ticketTypePrices.length > 0 ? (
                      showtime.ticketTypePrices.map((assignment) => {
                        const ticketType = ticketTypes.find(
                          (item) =>
                            Number(item.ticketTypeId) ===
                            Number(assignment.ticketTypeId)
                        );

                        return (
                          <div key={assignment.ticketTypeId}>
                            <strong>
                              {ticketType?.name ||
                                `Loại vé #${assignment.ticketTypeId}`}
                              :
                            </strong>{" "}
                            {formatPrice(assignment.price)}
                          </div>
                        );
                      })
                    ) : (
                      formatPrice(showtime.ticketPrice)
                    )}
                  </td>

                  <td>
                    <span
                      className={`showtime-status ${
                        showtime.status === "Đang hoạt động"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {showtime.status}
                    </span>
                  </td>

                  <td>
                    <div className="showtime-actions">
                      <button
                        className="showtime-edit-btn"
                        onClick={() => openEditModal(showtime)}
                      >
                        Sửa
                      </button>

                      <button
                        className="showtime-delete-btn"
                        onClick={() =>
                          handleDelete(showtime.showtimeId)
                        }
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm / sửa suất chiếu */}
      {showModal && (
        <div className="showtime-modal-overlay">
          <div className="showtime-modal">
            <div className="showtime-modal-header">
              <h2>
                {editingId
                  ? "Cập nhật suất chiếu"
                  : "Thêm suất chiếu"}
              </h2>

              <button
                type="button"
                className="showtime-close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Chọn phim */}
              <div className="showtime-form-group">
                <label>Phim *</label>

                <select
                  name="movieId"
                  value={formData.movieId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn phim --</option>

                  {movies.map((movie) => (
                    <option
                      key={movie.movieId}
                      value={movie.movieId}
                    >
                      {movie.title}
                    </option>
                  ))}
                </select>

                {formData.movieId && (
                  <small className="showtime-rating-hint">
                    Phân loại phim:{" "}
                    {selectedMovie?.ageRating || "Chưa cập nhật"}
                  </small>
                )}

                {isT18Movie && (
                  <small className="showtime-rating-hint">
                    Phim T18 không áp dụng loại vé trẻ em.
                  </small>
                )}
              </div>

              {/* Chọn rạp */}
              <div className="showtime-form-group">
                <label>Rạp *</label>

                <select
                  name="cinemaId"
                  value={formData.cinemaId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn rạp --</option>

                  {cinemas.map((cinema) => (
                    <option
                      key={cinema.cinemaId}
                      value={cinema.cinemaId}
                    >
                      {cinema.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thời gian */}
              <div className="showtime-form-row">
                <div className="showtime-form-group">
                  <label>Bắt đầu *</label>

                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="showtime-form-group">
                  <label>Kết thúc (tự động)</label>

                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    readOnly
                  />
                </div>
              </div>

              {/* Phòng */}
              <div className="showtime-form-row">
                <div className="showtime-form-group">
                  <label>Phòng *</label>

                  <input
                    type="number"
                    name="roomId"
                    placeholder="Nhập Room ID, ví dụ: 4"
                    min="1"
                    step="1"
                    value={formData.roomId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Chính sách và giá riêng từng loại vé */}
              <div className="showtime-form-group">
                <label>Chính sách vé áp dụng *</label>

                <small className="showtime-policy-hint">
                  Chọn loại vé và tự nhập giá áp dụng cho từng loại.
                  Mỗi loại vé có mức giá độc lập.
                </small>

                {availableTicketTypes.length > 0 ? (
                  <div className="showtime-policy-list">
                    {availableTicketTypes.map((ticketType) => {
                      const assignment = formData.ticketTypePrices.find(
                        (item) =>
                          Number(item.ticketTypeId) ===
                          Number(ticketType.ticketTypeId)
                      );

                      return (
                        <div
                          className="showtime-policy-item"
                          key={ticketType.ticketTypeId}
                        >
                          <label className="showtime-policy-choice">
                            <input
                              type="checkbox"
                              checked={Boolean(assignment)}
                              onChange={(event) =>
                                toggleTicketType(
                                  ticketType,
                                  event.target.checked
                                )
                              }
                            />

                            <span>
                              <strong>{ticketType.name}</strong>

                              <small>
                                {ticketType.category === "Program"
                                  ? "Thời điểm / chương trình"
                                  : "Tư cách khách hàng"}
                              </small>
                            </span>
                          </label>

                          {assignment && (
                            <div className="showtime-policy-price-wrapper">
                              <label>
                                Giá {ticketType.name} (VNĐ)
                              </label>

                              <input
                                className="showtime-policy-price"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Nhập giá vé"
                                aria-label={`Giá ${ticketType.name}`}
                                value={assignment.price}
                                onChange={(event) =>
                                  updateTicketTypePrice(
                                    ticketType.ticketTypeId,
                                    event.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="showtime-policy-hint">
                    {isT18Movie
                      ? "Không có loại vé phù hợp cho phim T18. Hãy kiểm tra danh sách chính sách vé."
                      : "Chưa có chính sách vé đang hoạt động. Hãy tạo loại vé trước."}
                  </p>
                )}
              </div>

              {/* Trạng thái */}
              <div className="showtime-form-group">
                <label>Trạng thái</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Đang hoạt động">
                    Đang hoạt động
                  </option>

                  <option value="Tạm ngưng">
                    Tạm ngưng
                  </option>

                  <option value="Đã kết thúc">
                    Đã kết thúc
                  </option>
                </select>
              </div>

              {/* Nút thao tác */}
              <div className="showtime-modal-actions">
                <button
                  type="button"
                  className="showtime-cancel-btn"
                  onClick={closeModal}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="showtime-save-btn"
                >
                  {editingId
                    ? "Cập nhật"
                    : "Thêm suất chiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thông báo */}
      <NotificationPopup
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}

export default ShowtimeAdmin;