import { useEffect, useState } from "react";

import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilm,
  FaTimes,
} from "react-icons/fa";

import NotificationPopup from "../../components/NotificationPopup";

import "./MovieAdmin.css";

const API_URL =
  "http://localhost:5000/api/movies";


// =====================================================
// LẤY ẢNH TRONG SRC/ASSETS
// HỖ TRỢ NHIỀU ĐỊNH DẠNG
// =====================================================

const posterAssets = import.meta.glob(
  "../../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);


// =====================================================
// CHUYỂN POSTER URL TỪ SQL
// THÀNH URL ẢNH HIỂN THỊ ĐƯỢC
// =====================================================

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  // URL online
  if (
    posterUrl.startsWith("http://") ||
    posterUrl.startsWith("https://")
  ) {
    return posterUrl;
  }

  // Poster đã được upload lên backend
  if (
    posterUrl.startsWith("/uploads/")
  ) {
    return `http://localhost:5000${posterUrl}`;
  }

  // Poster cũ lưu trong SQL
  // Ví dụ:
  // /assets/bat-tien.jpeg

  const fileName = posterUrl
    .split("/")
    .pop()
    ?.toLowerCase();

  if (!fileName) {
    return "";
  }

  const asset = Object.entries(
    posterAssets
  ).find(([path]) =>
    path
      .split("/")
      .pop()
      ?.toLowerCase() === fileName
  );

  if (asset) {
    return asset[1];
  }

  return posterUrl;
};


// =====================================================
// COMPONENT
// =====================================================

function MovieAdmin() {

  // =====================================================
  // STATE DANH SÁCH PHIM
  // =====================================================

  const [movies, setMovies] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingMovie, setEditingMovie] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  // =====================================================
  // STATE POPUP
  // =====================================================

  const [notification, setNotification] =
    useState({
      show: false,
      type: "success",
      title: "",
      message: "",
    });


  // =====================================================
  // FORM
  // =====================================================

  const emptyForm = {
    title: "",
    description: "",
    genre: "",
    duration: "",
    releaseDate: "",
    director: "",
    ageRating: "T13",

    // URL hiện tại trong SQL
    posterUrl: "",

    // File mới chọn từ máy
    posterFile: null,

    trailerUrl: "",
    status: "ComingSoon",
  };

  const [form, setForm] =
    useState(emptyForm);


  // =====================================================
  // HIỂN THỊ POPUP
  // =====================================================

  const showNotification = (
    type,
    title,
    message
  ) => {
    setNotification({
      show: true,
      type,
      title,
      message,
    });
  };


  // =====================================================
  // ĐÓNG POPUP
  // =====================================================

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };


  // =====================================================
  // LẤY PHIM TỪ SQL SERVER
  // =====================================================

  const loadMovies = async () => {
    try {

      setLoading(true);

      const response =
        await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          "Không thể lấy danh sách phim"
        );
      }

      const data =
        await response.json();

      setMovies(data);

    } catch (error) {

      console.error(
        "Lỗi lấy danh sách phim:",
        error
      );

      showNotification(
        "error",
        "Lỗi",
        error.message ||
          "Không thể tải danh sách phim"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD KHI MỞ TRANG
  // =====================================================

  useEffect(() => {
    loadMovies();
  }, []);


  // =====================================================
  // MỞ FORM THÊM PHIM
  // =====================================================

  const openAddForm = () => {

    setEditingMovie(null);

    setForm({
      ...emptyForm,
    });

    setShowForm(true);
  };


  // =====================================================
  // MỞ FORM SỬA PHIM
  // =====================================================

  const openEditForm = (movie) => {

    setEditingMovie(movie);

    setForm({
      title:
        movie.title || "",

      description:
        movie.description || "",

      genre:
        movie.genre || "",

      duration:
        movie.duration || "",

      releaseDate:
        movie.releaseDate
          ? movie.releaseDate.substring(
              0,
              10
            )
          : "",

      director:
        movie.director || "",

      ageRating:
        movie.ageRating || "T13",

      // Giữ PosterUrl hiện tại
      posterUrl:
        movie.posterUrl || "",

      // Chưa chọn poster mới
      posterFile:
        null,

      trailerUrl:
        movie.trailerUrl || "",

      status:
        movie.status ||
        "ComingSoon",
    });

    setShowForm(true);
  };


  // =====================================================
  // THAY ĐỔI INPUT
  // =====================================================

  const handleFormChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =====================================================
  // CHỌN POSTER
  // =====================================================

  const handlePosterChange = (e) => {

    const file =
      e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      posterFile: file,
    }));
  };


  // =====================================================
  // THÊM / SỬA PHIM
  // =====================================================

  const handleSave = async (e) => {

    e.preventDefault();


    // ===================================================
    // KIỂM TRA TÊN
    // ===================================================

    if (!form.title.trim()) {

      showNotification(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập tên phim!"
      );

      return;
    }


    // ===================================================
    // KIỂM TRA THỜI LƯỢNG
    // ===================================================

    if (
      !form.duration ||
      Number(form.duration) <= 0
    ) {

      showNotification(
        "warning",
        "Dữ liệu không hợp lệ",
        "Vui lòng nhập thời lượng phim hợp lệ!"
      );

      return;
    }


    // ===================================================
    // TẠO FORMDATA
    // ===================================================

    const formData =
      new FormData();


    formData.append(
      "Title",
      form.title.trim()
    );


    formData.append(
      "Description",
      form.description.trim()
    );


    formData.append(
      "Genre",
      form.genre.trim()
    );


    formData.append(
      "Duration",
      String(
        Number(form.duration)
      )
    );


    if (form.releaseDate) {

      formData.append(
        "ReleaseDate",
        form.releaseDate
      );

    }


    formData.append(
      "Director",
      form.director.trim()
    );


    formData.append(
      "AgeRating",
      form.ageRating
    );


    formData.append(
      "TrailerUrl",
      form.trailerUrl.trim()
    );


    formData.append(
      "Status",
      form.status
    );


    // ===================================================
    // POSTER MỚI
    // ===================================================

    if (form.posterFile) {

      formData.append(
        "PosterFile",
        form.posterFile
      );

    }


    // ===================================================
    // GỌI API
    // ===================================================

    try {

      setSaving(true);

      let response;


      // =================================================
      // CẬP NHẬT
      // =================================================

      if (editingMovie) {

        response =
          await fetch(
            `${API_URL}/${editingMovie.movieId}`,
            {
              method: "PUT",
              body: formData,
            }
          );

      }


      // =================================================
      // THÊM
      // =================================================

      else {

        response =
          await fetch(
            API_URL,
            {
              method: "POST",
              body: formData,
            }
          );

      }


      // =================================================
      // XỬ LÝ RESPONSE
      // =================================================

      if (!response.ok) {

        let errorMessage =
          "Thao tác thất bại";

        try {

          const errorData =
            await response.json();

          errorMessage =
            errorData.message ||
            errorMessage;

        } catch {
          // Không có JSON lỗi
        }

        throw new Error(
          errorMessage
        );
      }


      // =================================================
      // LOAD LẠI DỮ LIỆU TỪ SQL
      // =================================================

      await loadMovies();


      // =================================================
      // LƯU THÔNG TIN TRƯỚC KHI RESET
      // =================================================

      const wasEditing =
        Boolean(editingMovie);


      // =================================================
      // ĐÓNG FORM
      // =================================================

      setShowForm(false);

      setEditingMovie(null);

      setForm({
        ...emptyForm,
      });


      // =================================================
      // THÔNG BÁO THÀNH CÔNG
      // =================================================

      showNotification(

        "success",

        wasEditing
          ? "Cập nhật thành công"
          : "Thêm phim thành công",

        wasEditing
          ? "Thông tin phim đã được cập nhật."
          : "Phim mới đã được thêm vào hệ thống."

      );


    } catch (error) {

      console.error(
        "Lỗi lưu phim:",
        error
      );

      showNotification(
        "error",
        "Thao tác thất bại",
        error.message ||
          "Không thể lưu phim"
      );


    } finally {

      setSaving(false);

    }
  };


  // =====================================================
  // XÓA PHIM
  // =====================================================

  const handleDelete = async (id) => {

    const movie =
      movies.find(
        (item) =>
          item.movieId === id
      );

    if (!movie) {
      return;
    }


    // ===================================================
    // XÁC NHẬN XÓA
    // ===================================================

    const confirmDelete =
      window.confirm(
        `Bạn có chắc muốn xóa phim "${movie.title}"?`
      );

    if (!confirmDelete) {
      return;
    }


    try {

      const response =
        await fetch(
          `${API_URL}/${id}`,
          {
            method: "DELETE",
          }
        );


      // =================================================
      // KIỂM TRA
      // =================================================

      if (!response.ok) {

        let errorMessage =
          "Không thể xóa phim";

        try {

          const errorData =
            await response.json();

          errorMessage =
            errorData.message ||
            errorMessage;

        } catch {
          // Không có JSON lỗi
        }

        throw new Error(
          errorMessage
        );
      }


      // =================================================
      // LOAD LẠI SQL
      // =================================================

      await loadMovies();


      // =================================================
      // THÔNG BÁO
      // =================================================

      showNotification(
        "success",
        "Xóa phim thành công",
        `Phim "${movie.title}" đã được xóa khỏi hệ thống.`
      );


    } catch (error) {

      console.error(
        "Lỗi xóa phim:",
        error
      );

      showNotification(
        "error",
        "Xóa phim thất bại",
        error.message ||
          "Không thể xóa phim"
      );

    }
  };


  // =====================================================
  // TÌM KIẾM
  // =====================================================

  const filteredMovies =
    movies.filter((movie) => {

      const keyword =
        search
          .toLowerCase()
          .trim();

      if (!keyword) {
        return true;
      }

      return (

        movie.title
          ?.toLowerCase()
          .includes(keyword)

        ||

        movie.genre
          ?.toLowerCase()
          .includes(keyword)

        ||

        movie.director
          ?.toLowerCase()
          .includes(keyword)

      );
    });


  // =====================================================
  // FORMAT NGÀY
  // =====================================================

  const formatDate = (date) => {

    if (!date) {
      return "Chưa cập nhật";
    }

    const d =
      new Date(date);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {

      return date;

    }

    return d.toLocaleDateString(
      "vi-VN"
    );
  };


  // =====================================================
  // TRẠNG THÁI
  // =====================================================

  const getStatusText =
    (status) => {

      if (
        status ===
        "NowShowing"
      ) {

        return "Đang chiếu";

      }

      if (
        status ===
        "ComingSoon"
      ) {

        return "Sắp chiếu";

      }

      if (
        status ===
        "Ended"
      ) {

        return "Đã kết thúc";

      }

      return (
        status ||
        "Chưa xác định"
      );
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="movie-admin">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="movie-admin-header">

        <div>

          <h1>
            Quản lý phim
          </h1>

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


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="movie-toolbar">

        <div className="movie-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
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


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="movie-table-container">

        <table className="movie-table">

          <thead>

            <tr>

              <th>
                STT
              </th>

              <th>
                Tên phim
              </th>

              <th>
                Thể loại
              </th>

              <th>
                Thời lượng
              </th>

              <th>
                Khởi chiếu
              </th>

              <th>
                Độ tuổi
              </th>

              <th>
                Trạng thái
              </th>

              <th>
                Thao tác
              </th>

            </tr>

          </thead>


          <tbody>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <tr>

                <td
                  colSpan="8"
                  className="movie-empty"
                >

                  Đang tải dữ liệu phim...

                </td>

              </tr>

            ) : filteredMovies.length > 0 ? (

              filteredMovies.map(
                (movie, index) => (

                  <tr
                    key={
                      movie.movieId
                    }
                  >


                    {/* STT */}

                    <td>
                      {index + 1}
                    </td>


                    {/* TÊN + POSTER */}

                    <td>

                      <div className="movie-name-cell">

                        <div className="movie-mini-poster">

                          {movie.posterUrl ? (

                            <img
                              src={
                                getPosterUrl(
                                  movie.posterUrl
                                )
                              }
                              alt={
                                movie.title
                              }

                              onError={(
                                e
                              ) => {

                                e.currentTarget.style.display =
                                  "none";

                              }}

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


                    {/* THỂ LOẠI */}

                    <td>

                      {movie.genre ||
                        "Chưa cập nhật"}

                    </td>


                    {/* THỜI LƯỢNG */}

                    <td>

                      {
                        movie.duration
                      } phút

                    </td>


                    {/* KHỞI CHIẾU */}

                    <td>

                      {
                        formatDate(
                          movie.releaseDate
                        )
                      }

                    </td>


                    {/* ĐỘ TUỔI */}

                    <td>

                      <span className="age-badge">

                        {
                          movie.ageRating ||
                          "P"
                        }

                      </span>

                    </td>


                    {/* TRẠNG THÁI */}

                    <td>

                      <span
                        className={`status-badge ${
                          movie.status ===
                          "NowShowing"

                            ? "showing"

                            : movie.status ===
                              "Ended"

                              ? "ended"

                              : "coming"
                        }`}
                      >

                        {
                          getStatusText(
                            movie.status
                          )
                        }

                      </span>

                    </td>


                    {/* THAO TÁC */}

                    <td>

                      <div className="movie-actions">


                        {/* SỬA */}

                        <button
                          type="button"
                          className="edit-movie"
                          onClick={() =>
                            openEditForm(
                              movie
                            )
                          }
                          title="Chỉnh sửa"
                        >

                          <FaEdit />

                        </button>


                        {/* XÓA */}

                        <button
                          type="button"
                          className="delete-movie"
                          onClick={() =>
                            handleDelete(
                              movie.movieId
                            )
                          }
                          title="Xóa"
                        >

                          <FaTrash />

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            ) : (

              <tr>

                <td
                  colSpan="8"
                  className="movie-empty"
                >

                  Không có phim trong cơ sở dữ liệu.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          FORM THÊM / SỬA
      ================================================= */}

      {showForm && (

        <div className="movie-modal-overlay">

          <div className="movie-modal">


            {/* =================================================
                HEADER FORM
            ================================================= */}

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
                onClick={() => {

                  setShowForm(false);

                  setEditingMovie(null);

                  setForm({
                    ...emptyForm,
                  });

                }}
              >

                <FaTimes />

              </button>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={
                handleSave
              }
            >

              <div className="movie-form-grid">


                {/* =================================================
                    TÊN PHIM
                ================================================= */}

                <div className="movie-form-field full">

                  <label>
                    Tên phim *
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Nhập tên phim"
                  />

                </div>


                {/* =================================================
                    MÔ TẢ
                ================================================= */}

                <div className="movie-form-field full">

                  <label>
                    Mô tả
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Nhập mô tả phim"
                    rows="3"
                  />

                </div>


                {/* =================================================
                    THỂ LOẠI
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Thể loại
                  </label>

                  <input
                    type="text"
                    name="genre"
                    value={
                      form.genre
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Ví dụ: Hành động"
                  />

                </div>


                {/* =================================================
                    THỜI LƯỢNG
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Thời lượng (phút)
                  </label>

                  <input
                    type="number"
                    name="duration"
                    value={
                      form.duration
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Ví dụ: 120"
                    min="1"
                  />

                </div>


                {/* =================================================
                    NGÀY KHỞI CHIẾU
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Ngày khởi chiếu
                  </label>

                  <input
                    type="date"
                    name="releaseDate"
                    value={
                      form.releaseDate
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>


                {/* =================================================
                    ĐẠO DIỄN
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Đạo diễn
                  </label>

                  <input
                    type="text"
                    name="director"
                    value={
                      form.director
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Nhập tên đạo diễn"
                  />

                </div>


                {/* =================================================
                    ĐỘ TUỔI
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Độ tuổi
                  </label>

                  <select
                    name="ageRating"
                    value={
                      form.ageRating
                    }
                    onChange={
                      handleFormChange
                    }
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


                {/* =================================================
                    TRẠNG THÁI
                ================================================= */}

                <div className="movie-form-field">

                  <label>
                    Trạng thái
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFormChange
                    }
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


                {/* =================================================
                    POSTER
                ================================================= */}

                <div className="movie-form-field full">

                  <label>
                    Poster
                  </label>


                  <div className="poster-upload">

                    <label
                      htmlFor="posterFile"
                      className="poster-upload-button"
                    >

                      <FaFilm />

                      <span>
                        Chọn poster
                      </span>

                    </label>


                    <input
                      id="posterFile"
                      type="file"
                      name="posterFile"
                      accept="image/*"
                      className="poster-file-input"

                      onChange={
                        handlePosterChange
                      }
                    />


                    <div className="poster-file-name">

                      {form.posterFile
                        ? form.posterFile.name
                        : "Chưa chọn ảnh"}

                    </div>

                  </div>


                  {/* =================================================
                      PREVIEW POSTER MỚI
                  ================================================= */}

                  {form.posterFile && (

                    <div className="poster-preview">

                      <img
                        src={
                          URL.createObjectURL(
                            form.posterFile
                          )
                        }
                        alt="Poster preview"
                      />


                      <div className="poster-preview-info">

                        <strong>
                          Poster đã chọn
                        </strong>

                        <span>
                          {
                            form.posterFile
                              .name
                          }
                        </span>

                      </div>

                    </div>

                  )}


                  {/* =================================================
                      POSTER HIỆN TẠI
                  ================================================= */}

                  {!form.posterFile &&
                    editingMovie &&
                    form.posterUrl && (

                      <div className="poster-preview">

                        <img
                          src={
                            getPosterUrl(
                              form.posterUrl
                            )
                          }
                          alt="Poster hiện tại"
                        />


                        <div className="poster-preview-info">

                          <strong>
                            Poster hiện tại
                          </strong>

                          <span>
                            Không chọn ảnh mới sẽ giữ poster này
                          </span>

                        </div>

                      </div>

                    )}

                </div>


                {/* =================================================
                    TRAILER URL
                ================================================= */}

                <div className="movie-form-field full">

                  <label>
                    Trailer URL
                  </label>

                  <input
                    type="text"
                    name="trailerUrl"
                    value={
                      form.trailerUrl
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Nhập đường dẫn trailer"
                  />

                </div>


              </div>


              {/* =================================================
                  BUTTON FORM
              ================================================= */}

              <div className="movie-form-actions">


                {/* HỦY */}

                <button
                  type="button"
                  className="cancel-movie"

                  onClick={() => {

                    setShowForm(false);

                    setEditingMovie(
                      null
                    );

                    setForm({
                      ...emptyForm,
                    });

                  }}

                  disabled={
                    saving
                  }
                >

                  Hủy

                </button>


                {/* LƯU */}

                <button
                  type="submit"
                  className="save-movie"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Đang lưu..."
                    : editingMovie
                      ? "Lưu thay đổi"
                      : "Thêm phim"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          NOTIFICATION POPUP
      ================================================= */}

      <NotificationPopup
        show={
          notification.show
        }

        type={
          notification.type
        }

        title={
          notification.title
        }

        message={
          notification.message
        }

        onClose={
          closeNotification
        }
      />

    </div>

  );
}

export default MovieAdmin;