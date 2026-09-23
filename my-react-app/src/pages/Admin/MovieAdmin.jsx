import { useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilm,
  FaTimes,
} from "react-icons/fa";

import "./MovieAdmin.css";

function MovieAdmin() {
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingMovie, setEditingMovie] = useState(null);

  // =====================================================
  // DỮ LIỆU MẪU
  // =====================================================
  const [movies, setMovies] = useState([
    {
      movieId: 1,
      title: "Bắt Tiên!",
      description: "Một bộ phim hoạt hình phiêu lưu.",
      genre: "Hoạt hình, Hài",
      duration: 120,
      releaseDate: "2026-09-11",
      director: "Mục Chí Dương",
      ageRating: "K",
      posterUrl: "",
      trailerUrl: "",
      status: "NowShowing",
    },
    {
      movieId: 2,
      title: "Avatar: Fire and Ash",
      description: "Phần phim mới trong thế giới Avatar.",
      genre: "Hành động, Phiêu lưu",
      duration: 197,
      releaseDate: "2026-12-19",
      director: "James Cameron",
      ageRating: "T13",
      posterUrl: "",
      trailerUrl: "",
      status: "ComingSoon",
    },
    {
      movieId: 3,
      title: "The Conjuring: Last Rites",
      description: "Một câu chuyện kinh dị mới.",
      genre: "Kinh dị",
      duration: 135,
      releaseDate: "2026-09-05",
      director: "Michael Chaves",
      ageRating: "T18",
      posterUrl: "",
      trailerUrl: "",
      status: "NowShowing",
    },
  ]);

  // =====================================================
  // FORM
  // =====================================================
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    duration: "",
    releaseDate: "",
    director: "",
    ageRating: "T13",
    posterUrl: "",
    trailerUrl: "",
    status: "ComingSoon",
  });

  // =====================================================
  // MỞ FORM THÊM
  // =====================================================
  const openAddForm = () => {
    setEditingMovie(null);

    setForm({
      title: "",
      description: "",
      genre: "",
      duration: "",
      releaseDate: "",
      director: "",
      ageRating: "T13",
      posterUrl: "",
      trailerUrl: "",
      status: "ComingSoon",
    });

    setShowForm(true);
  };

  // =====================================================
  // MỞ FORM SỬA
  // =====================================================
  const openEditForm = (movie) => {
    setEditingMovie(movie);

    setForm({
      title: movie.title || "",
      description: movie.description || "",
      genre: movie.genre || "",
      duration: movie.duration || "",
      releaseDate: movie.releaseDate
        ? movie.releaseDate.substring(0, 10)
        : "",
      director: movie.director || "",
      ageRating: movie.ageRating || "T13",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      status: movie.status || "ComingSoon",
    });

    setShowForm(true);
  };

  // =====================================================
  // THAY ĐỔI FORM
  // =====================================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // THÊM / SỬA PHIM
  // =====================================================
  const handleSave = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Vui lòng nhập tên phim!");
      return;
    }

    if (!form.duration || Number(form.duration) <= 0) {
      alert("Vui lòng nhập thời lượng phim hợp lệ!");
      return;
    }

    const movieData = {
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre.trim(),
      duration: Number(form.duration),
      releaseDate: form.releaseDate,
      director: form.director.trim(),
      ageRating: form.ageRating,
      posterUrl: form.posterUrl.trim(),
      trailerUrl: form.trailerUrl.trim(),
      status: form.status,
    };

    // =========================
    // SỬA PHIM
    // =========================
    if (editingMovie) {
      setMovies((prev) =>
        prev.map((movie) =>
          movie.movieId === editingMovie.movieId
            ? {
                ...movie,
                ...movieData,
              }
            : movie
        )
      );

      alert("Cập nhật phim thành công!");
    }

    // =========================
    // THÊM PHIM
    // =========================
    else {
      const newMovie = {
        movieId: Date.now(),
        ...movieData,
      };

      setMovies((prev) => [
        ...prev,
        newMovie,
      ]);

      alert("Thêm phim thành công!");
    }

    setShowForm(false);
    setEditingMovie(null);
  };

  // =====================================================
  // XÓA PHIM
  // =====================================================
  const handleDelete = (id) => {
    const movie = movies.find(
      (item) => item.movieId === id
    );

    if (!movie) {
      return;
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa phim "${movie.title}"?`
    );

    if (!confirmDelete) {
      return;
    }

    setMovies((prev) =>
      prev.filter(
        (movie) => movie.movieId !== id
      )
    );

    alert("Xóa phim thành công!");
  };

  // =====================================================
  // TÌM KIẾM
  // =====================================================
  const filteredMovies = movies.filter((movie) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    return (
      movie.title?.toLowerCase().includes(keyword) ||
      movie.genre?.toLowerCase().includes(keyword) ||
      movie.director?.toLowerCase().includes(keyword)
    );
  });

  // =====================================================
  // FORMAT NGÀY
  // =====================================================
  const formatDate = (date) => {
    if (!date) {
      return "Chưa cập nhật";
    }

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("vi-VN");
  };

  // =====================================================
  // TRẠNG THÁI
  // =====================================================
  const getStatusText = (status) => {
    if (status === "NowShowing") {
      return "Đang chiếu";
    }

    if (status === "ComingSoon") {
      return "Sắp chiếu";
    }

    if (status === "Ended") {
      return "Đã kết thúc";
    }

    return status;
  };

  return (
    <div className="movie-admin">

      {/* ================= HEADER ================= */}
      <div className="movie-admin-header">

        <div>
          <h1>Quản lý phim</h1>

          <p>
            Thêm, sửa và quản lý danh sách phim CinemaPass
          </p>
        </div>

        <button
          type="button"
          className="add-movie-button"
          onClick={openAddForm}
        >
          <FaPlus />
          Thêm phim
        </button>

      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="movie-toolbar">

        <div className="movie-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="movie-count">

          <FaFilm />

          <span>
            {filteredMovies.length} phim
          </span>

        </div>

      </div>

      {/* ================= TABLE ================= */}
      <div className="movie-table-container">

        <table className="movie-table">

          <thead>

            <tr>
              <th>STT</th>
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Khởi chiếu</th>
              <th>Độ tuổi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>

          </thead>

          <tbody>

            {filteredMovies.length > 0 ? (

              filteredMovies.map((movie, index) => (

                <tr key={movie.movieId}>

                  <td>
                    {index + 1}
                  </td>

                  <td>

                    <div className="movie-name-cell">

                      <div className="movie-mini-poster">

                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                          />
                        ) : (
                          <FaFilm />
                        )}

                      </div>

                      <strong>
                        {movie.title}
                      </strong>

                    </div>

                  </td>

                  <td>
                    {movie.genre || "Chưa cập nhật"}
                  </td>

                  <td>
                    {movie.duration} phút
                  </td>

                  <td>
                    {formatDate(movie.releaseDate)}
                  </td>

                  <td>

                    <span className="age-badge">
                      {movie.ageRating || "P"}
                    </span>

                  </td>

                  <td>

                    <span
                      className={`status-badge ${
                        movie.status === "NowShowing"
                          ? "showing"
                          : movie.status === "Ended"
                          ? "ended"
                          : "coming"
                      }`}
                    >
                      {getStatusText(movie.status)}
                    </span>

                  </td>

                  <td>

                    <div className="movie-actions">

                      <button
                        type="button"
                        className="edit-movie"
                        onClick={() =>
                          openEditForm(movie)
                        }
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        className="delete-movie"
                        onClick={() =>
                          handleDelete(movie.movieId)
                        }
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="8"
                  className="movie-empty"
                >
                  Không tìm thấy phim.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ================= FORM ================= */}
      {showForm && (

        <div className="movie-modal-overlay">

          <div className="movie-modal">

            <div className="movie-modal-header">

              <div>

                <h2>
                  {editingMovie
                    ? "Chỉnh sửa phim"
                    : "Thêm phim mới"}
                </h2>

                <p>
                  Nhập thông tin phim
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={() =>
                  setShowForm(false)
                }
              >
                <FaTimes />
              </button>

            </div>

            <form onSubmit={handleSave}>

              <div className="movie-form-grid">

                {/* TÊN */}
                <div className="movie-form-field full">

                  <label>
                    Tên phim *
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Nhập tên phim"
                  />

                </div>

                {/* MÔ TẢ */}
                <div className="movie-form-field full">

                  <label>
                    Mô tả
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Nhập mô tả phim"
                    rows="3"
                  />

                </div>

                {/* THỂ LOẠI */}
                <div className="movie-form-field">

                  <label>
                    Thể loại
                  </label>

                  <input
                    type="text"
                    name="genre"
                    value={form.genre}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: Hành động"
                  />

                </div>

                {/* THỜI LƯỢNG */}
                <div className="movie-form-field">

                  <label>
                    Thời lượng (phút)
                  </label>

                  <input
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: 120"
                    min="1"
                  />

                </div>

                {/* NGÀY */}
                <div className="movie-form-field">

                  <label>
                    Ngày khởi chiếu
                  </label>

                  <input
                    type="date"
                    name="releaseDate"
                    value={form.releaseDate}
                    onChange={handleFormChange}
                  />

                </div>

                {/* ĐẠO DIỄN */}
                <div className="movie-form-field">

                  <label>
                    Đạo diễn
                  </label>

                  <input
                    type="text"
                    name="director"
                    value={form.director}
                    onChange={handleFormChange}
                    placeholder="Nhập tên đạo diễn"
                  />

                </div>

                {/* ĐỘ TUỔI */}
                <div className="movie-form-field">

                  <label>
                    Độ tuổi
                  </label>

                  <select
                    name="ageRating"
                    value={form.ageRating}
                    onChange={handleFormChange}
                  >
                    <option value="P">
                      P
                    </option>

                    <option value="K">
                      K
                    </option>

                    <option value="T13">
                      T13
                    </option>

                    <option value="T16">
                      T16
                    </option>

                    <option value="T18">
                      T18
                    </option>
                  </select>

                </div>

                {/* TRẠNG THÁI */}
                <div className="movie-form-field">

                  <label>
                    Trạng thái
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                  >

                    <option value="NowShowing">
                      Đang chiếu
                    </option>

                    <option value="ComingSoon">
                      Sắp chiếu
                    </option>

                    <option value="Ended">
                      Đã kết thúc
                    </option>

                  </select>

                </div>

                {/* POSTER */}
                <div className="movie-form-field full">

                  <label>
                    Poster URL
                  </label>

                  <input
                    type="text"
                    name="posterUrl"
                    value={form.posterUrl}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: /assets/bat-tien.jpeg"
                  />

                </div>

                {/* TRAILER */}
                <div className="movie-form-field full">

                  <label>
                    Trailer URL
                  </label>

                  <input
                    type="text"
                    name="trailerUrl"
                    value={form.trailerUrl}
                    onChange={handleFormChange}
                    placeholder="Nhập đường dẫn trailer"
                  />

                </div>

              </div>

              {/* BUTTON */}
              <div className="movie-form-actions">

                <button
                  type="button"
                  className="cancel-movie"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="save-movie"
                >
                  {editingMovie
                    ? "Lưu thay đổi"
                    : "Thêm phim"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default MovieAdmin;