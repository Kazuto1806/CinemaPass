import { useEffect, useState } from "react";
import "./ShowtimeAdmin.css";

const API_URL = "http://localhost:5000/api/showtimes";
const MOVIE_API_URL = "http://localhost:5000/api/movies";
const CINEMA_API_URL = "http://localhost:5000/api/cinemas";

function ShowtimeAdmin() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    movieId: "",
    cinemaId: "",
    startTime: "",
    endTime: "",
    roomName: "",
    ticketPrice: "",
    status: "Đang hoạt động",
  });

  useEffect(() => {
    loadShowtimes();
    loadMovies();
    loadCinemas();
  }, []);

  const loadShowtimes = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách suất chiếu");
      }

      const data = await response.json();
      setShowtimes(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách suất chiếu");
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
      alert("Không thể tải danh sách phim");
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
      alert("Không thể tải danh sách rạp");
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: "",
      cinemaId: "",
      startTime: "",
      endTime: "",
      roomName: "",
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

    setFormData({
      movieId: showtime.movieId?.toString() || "",
      cinemaId: showtime.cinemaId?.toString() || "",
      startTime: formatDateTimeForInput(showtime.startTime),
      endTime: showtime.endTime
        ? formatDateTimeForInput(showtime.endTime)
        : "",
      roomName: showtime.roomName || "",
      ticketPrice: showtime.ticketPrice?.toString() || "",
      status: showtime.status || "Đang hoạt động",
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

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.movieId ||
      !formData.cinemaId ||
      !formData.startTime ||
      !formData.roomName ||
      !formData.ticketPrice
    ) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    const payload = {
      movieId: Number(formData.movieId),
      cinemaId: Number(formData.cinemaId),
      startTime: formData.startTime,
      endTime: formData.endTime || null,
      roomName: formData.roomName,
      ticketPrice: Number(formData.ticketPrice),
      status: formData.status,
    };

    try {
      let response;

      if (editingId) {
        response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra");
      }

      alert(
        editingId
          ? "Cập nhật suất chiếu thành công"
          : "Thêm suất chiếu thành công"
      );

      closeModal();
      loadShowtimes();
    } catch (error) {
      console.error(error);
      alert(error.message || "Không thể lưu suất chiếu");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa suất chiếu này không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa suất chiếu");
      }

      alert("Xóa suất chiếu thành công");
      loadShowtimes();
    } catch (error) {
      console.error(error);
      alert(error.message || "Không thể xóa suất chiếu");
    }
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
                    <div>{formatDateTime(showtime.startTime)}</div>

                    {showtime.endTime && (
                      <small>
                        đến {formatDateTime(showtime.endTime)}
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
                  <label>Kết thúc</label>

                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="showtime-form-row">
                <div className="showtime-form-group">
                  <label>Phòng *</label>

                  <input
                    type="text"
                    name="roomName"
                    placeholder="Ví dụ: Phòng 01"
                    value={formData.roomName}
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
    </div>
  );
}

export default ShowtimeAdmin;