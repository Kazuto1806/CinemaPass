import { useEffect, useState } from "react";
import NotificationPopup from "../../components/NotificationPopup";
import { API_BASE } from "../../constants";
import "./ShowtimeAdmin.css";

const API_URL = `${API_BASE}/api/showtimes`;
const MOVIE_API_URL = `${API_BASE}/api/movies`;
const CINEMA_API_URL = `${API_BASE}/api/cinemas`;

const normalizeShowtimeStatus = (status) => {
  const value = String(status || "").trim();

  if (
    !value ||
    value.toLowerCase() === "active" ||
    value.toLowerCase() === "đang hoạt động"
  )
   {
    return "Đang hoạt động";
  }
  return value;
};

function ShowtimeAdmin() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const showNotification = (type, title, message, onConfirm = null) => {
    setNotification({ show: true, type, title, message, onConfirm });
  };

  const closeNotification = () => {
    setNotification((current) => ({ ...current, show: false, onConfirm: null }));
  };

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
  movieId: "",
  roomId: "",
  startTime: "",
  endTime: "",
  ticketPrice: "",
  status: "Đang hoạt động",
});

  useEffect(() => {
    loadShowtimes();
    loadMovies();
    loadCinemas();

    const refreshInterval = window.setInterval(loadShowtimes, 30_000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  const loadShowtimes = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách suất chiếu");
      }

      const data = await response.json();
      setShowtimes(
        data.map((showtime) => ({
          ...showtime,
          status: normalizeShowtimeStatus(showtime.status),
        }))
      );
    } catch (error) {
      console.error(error);
      showNotification("error", "Lỗi tải dữ liệu", "Không thể tải danh sách suất chiếu");
    }
  };

  const loadMovies = async () => {
    try {
      const response = await fetch(MOVIE_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách phim");
      }

      const data = await response.json();
      setMovies(data);
    } catch (error) {
      console.error(error);
      showNotification("error", "Lỗi tải dữ liệu", "Không thể tải danh sách phim");
    }
  };

  const loadCinemas = async () => {
    try {
      const response = await fetch(CINEMA_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách rạp");
      }

      const data = await response.json();
      setCinemas(data);
    } catch (error) {
      console.error(error);
      showNotification("error", "Lỗi tải dữ liệu", "Không thể tải danh sách rạp");
    }
  };

  const calculateEndDateTime = (movieId, startDateTime) => {
    const movie = movies.find(
      (item) => String(item.movieId) === String(movieId)
    );
    const duration = Number(movie?.duration);

    if (!startDateTime || !Number.isFinite(duration) || duration <= 0) {
      return "";
    }

    const endDate = new Date(startDateTime);

    if (Number.isNaN(endDate.getTime())) {
      return "";
    }

    endDate.setMinutes(endDate.getMinutes() + duration);

    const pad = (value) => String(value).padStart(2, "0");

    return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(
      endDate.getDate()
    )}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;
  };

const formatShowtime = (showDate, time) => {
  if (!showDate || !time) {
    return "-";
  }

  const date = String(showDate).substring(0, 10);

  const timeText = String(time).substring(0, 5);

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year} ${timeText}`;
};

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

  return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(
    endDate.getDate()
  )}`;
};
  const resetForm = () => {
  setFormData({
    movieId: "",
    roomId: "",
    startTime: "",
    endTime: "",
    ticketPrice: "",
    status: "Đang hoạt động",
  });

  setEditingId(null);
};

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (showtime) => {
  setEditingId(showtime.showtimeId);

  const formatTime = (time) => {
    if (!time) return "";

    // TimeSpan từ ASP.NET thường có dạng:
    // 12:54:00
    // hoặc 12:54:00.0000000
    return String(time).substring(0, 5);
  };

  const showDate = showtime.showDate
    ? String(showtime.showDate).substring(0, 10)
    : "";

  const startTime = formatTime(showtime.startTime);
  const endTime = formatTime(showtime.endTime);
  const startDateTime =
    showDate && startTime
      ? `${showDate}T${startTime}`
      : "";

  setFormData({
    movieId: showtime.movieId?.toString() || "",
    roomId: showtime.roomId?.toString() || "",

    startTime: startDateTime,

    endTime:
      calculateEndDateTime(showtime.movieId, startDateTime) ||
      (showDate && endTime ? `${showDate}T${endTime}` : ""),

    ticketPrice:
      showtime.ticketPrice?.toString() || "",

    status: normalizeShowtimeStatus(showtime.status),
  });

  setShowModal(true);
};

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (name === "movieId" || name === "startTime") {
        next.endTime = calculateEndDateTime(
          name === "movieId" ? value : previous.movieId,
          name === "startTime" ? value : previous.startTime
        );
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  // ==============================
  // KIỂM TRA DỮ LIỆU
  // ==============================

  if (
    !formData.movieId ||
    !formData.roomId ||
    !formData.startTime ||
    !formData.endTime ||
    !formData.ticketPrice
  ) {
    showNotification("warning", "Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin bắt buộc");
    return;
  }

  // ==============================
  // TÁCH NGÀY + GIỜ
  // ==============================

  const [showDate, startTime] =
    formData.startTime.split("T");

  let endTime = "";

  if (formData.endTime) {
    const parts = formData.endTime.split("T");

    endTime = parts[1] || "";
  }

  // ==============================
  // PAYLOAD MỚI
  // ==============================

  const payload = {
    movieId: Number(formData.movieId),

    roomId: Number(formData.roomId),

    showDate: showDate,

    startTime: `${startTime}:00`,

    endTime: endTime
      ? `${endTime}:00`
      : `${startTime}:00`,

    ticketPrice: Number(formData.ticketPrice),

    status: formData.status || "Đang hoạt động",
  };

  console.log("PAYLOAD GỬI BACKEND:", payload);

  try {
    let response;

    // ==============================
    // UPDATE
    // ==============================

    if (editingId) {
      response = await fetch(
        `${API_URL}/${editingId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );
    }

    // ==============================
    // CREATE
    // ==============================

    else {
      response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );
    }

    // ==============================
    // ĐỌC RESPONSE
    // ==============================

    const data = await response.json();

    console.log("BACKEND RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.title ||
        "Có lỗi xảy ra"
      );
    }

    // ==============================
    // THÀNH CÔNG
    // ==============================

    showNotification(
      "success",
      "Thành công",
      editingId
        ? "Cập nhật suất chiếu thành công"
        : "Thêm suất chiếu thành công"
    );

    closeModal();

    await loadShowtimes();

  } catch (error) {
    console.error(
      "Lỗi lưu suất chiếu:",
      error
    );

    showNotification(
      "error",
      "Không thể lưu suất chiếu",
      error.message ||
      "Không thể lưu suất chiếu"
    );
  }
};

  const deleteShowtime = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa suất chiếu");
      }

      showNotification("success", "Thành công", "Xóa suất chiếu thành công");
      loadShowtimes();
    } catch (error) {
      console.error(error);
      showNotification("error", "Không thể xóa suất chiếu", error.message || "Không thể xóa suất chiếu");
    }
  };

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

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + " đ";
  };

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
      <div className="showtime-admin-header">
        <div>
          <h1>Quản lý suất chiếu</h1>
          <p>Quản lý lịch chiếu phim tại các rạp</p>
        </div>

        <button className="showtime-add-btn" onClick={openAddModal}>
          + Thêm suất chiếu
        </button>
      </div>

      <div className="showtime-toolbar">
        <input
          type="text"
          placeholder="Tìm phim, rạp, phòng..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="showtime-table-container">
        <table className="showtime-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Phim</th>
              <th>Rạp</th>
              <th>Thời gian</th>
              <th>Phòng</th>
              <th>Giá vé</th>
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

                  <td>{formatPrice(showtime.ticketPrice)}</td>

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
                className="showtime-close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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
              </div>

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

              <div className="showtime-form-row">
                <div className="showtime-form-group">
                  <label>Phòng *</label>

                  <input
  type="number"
  name="roomId"
  placeholder="Nhập Room ID, ví dụ: 4"
  min="1"
  value={formData.roomId}
  onChange={handleChange}
  required
/>
                </div>

                <div className="showtime-form-group">
                  <label>Giá vé *</label>

                  <input
                    type="number"
                    name="ticketPrice"
                    placeholder="Ví dụ: 75000"
                    min="0"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                  {editingId ? "Cập nhật" : "Thêm suất chiếu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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