import { useEffect, useState } from "react";

import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilm,
  FaTimes,
} from "react-icons/fa";

import "./MovieAdmin.css";

const API_URL = "http://localhost:5000/api/movies";

/*
  Lấy các file ảnh trong src/assets
  Ví dụ:
  src/assets/bat-tien.jpeg
  src/assets/avatar.jpg
  src/assets/movie.webp
*/
const posterAssets = import.meta.glob(
  "../../assets/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);


// =========================
// CHUYỂN POSTER URL TỪ SQL
// THÀNH URL ẢNH CÓ THỂ HIỂN THỊ
// =========================

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) {
    return "";
  }

  // Nếu SQL lưu link online
  if (
    posterUrl.startsWith("http://") ||
    posterUrl.startsWith("https://")
  ) {
    return posterUrl;
  }

  /*
    SQL:
    /assets/bat-tien.jpeg

    Lấy ra:
    bat-tien.jpeg
  */

  const fileName = posterUrl
    .split("/")
    .pop();

  if (!fileName) {
    return "";
  }

  /*
    Tìm file tương ứng trong:
    src/assets/
  */

  const asset = Object.entries(
    posterAssets
  ).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );

  if (asset) {
    return asset[1];
  }

  /*
    Nếu không tìm thấy trong src/assets
    thì giữ nguyên URL SQL
  */

  return posterUrl;
};


function MovieAdmin() {

  // =========================
  // DANH SÁCH PHIM
  // =========================

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


  // =========================
  // FORM RỖNG
  // =========================

  const emptyForm = {
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
  };

  const [form, setForm] =
    useState(emptyForm);


  // =========================
  // LẤY DỮ LIỆU TỪ SQL
  // =========================

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

      alert(
        error.message ||
        "Không thể tải danh sách phim"
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================
  // LOAD KHI MỞ TRANG
  // =========================

  useEffect(() => {
    loadMovies();
  }, []);


  // =========================
  // MỞ FORM THÊM
  // =========================

  const openAddForm = () => {

    setEditingMovie(null);

    setForm({
      ...emptyForm,
    });

    setShowForm(true);
  };


  // =========================
  // MỞ FORM SỬA
  // =========================

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

      /*
        Giữ nguyên PosterUrl từ SQL
        để khi lưu không thay đổi dữ liệu
      */
      posterUrl:
        movie.posterUrl || "",

      trailerUrl:
        movie.trailerUrl || "",

      status:
        movie.status || "ComingSoon",
    });

    setShowForm(true);
  };


  // =========================
  // THAY ĐỔI FORM
  // =========================

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


  // =========================
  // THÊM / SỬA PHIM
  // =========================

  const handleSave = async (e) => {

    e.preventDefault();


    // Kiểm tra tên phim

    if (!form.title.trim()) {

      alert(
        "Vui lòng nhập tên phim!"
      );

      return;
    }


    // Kiểm tra thời lượng

    if (
      !form.duration ||
      Number(form.duration) <= 0
    ) {

      alert(
        "Vui lòng nhập thời lượng phim hợp lệ!"
      );

      return;
    }


    // =========================
    // DỮ LIỆU GỬI API
    // =========================

    const movieData = {

      title:
        form.title.trim(),

      description:
        form.description.trim() ||
        null,

      genre:
        form.genre.trim() ||
        null,

      duration:
        Number(form.duration),

      releaseDate:
        form.releaseDate ||
        null,

      director:
        form.director.trim() ||
        null,

      ageRating:
        form.ageRating ||
        null,

      /*
        Lưu đúng PosterUrl trong SQL
        Ví dụ:
        /assets/bat-tien.jpeg
      */
      posterUrl:
        form.posterUrl.trim() ||
        null,

      trailerUrl:
        form.trailerUrl.trim() ||
        null,

      status:
        form.status ||
        "ComingSoon",
    };


    try {

      setSaving(true);

      let response;


      // =========================
      // SỬA PHIM
      // =========================

      if (editingMovie) {

        response = await fetch(
          `${API_URL}/${editingMovie.movieId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              movieData
            ),
          }
        );

      }


      // =========================
      // THÊM PHIM
      // =========================

      else {

        response = await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              movieData
            ),
          }
        );

      }


      // =========================
      // KIỂM TRA RESPONSE
      // =========================

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


      // =========================
      // LOAD LẠI TỪ SQL
      // =========================

      await loadMovies();


      // =========================
      // ĐÓNG FORM
      // =========================

      setShowForm(false);

      setEditingMovie(null);

      setForm({
        ...emptyForm,
      });


      alert(
        editingMovie
          ? "Cập nhật phim thành công!"
          : "Thêm phim thành công!"
      );

    } catch (error) {

      console.error(
        "Lỗi lưu phim:",
        error
      );

      alert(
        error.message ||
        "Không thể lưu phim"
      );

    } finally {

      setSaving(false);

    }
  };


  // =========================
  // XÓA PHIM
  // =========================

  const handleDelete = async (id) => {

    const movie =
      movies.find(
        (item) =>
          item.movieId === id
      );

    if (!movie) {
      return;
    }


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


      // Load lại từ SQL

      await loadMovies();


      alert(
        "Xóa phim thành công!"
      );

    } catch (error) {

      console.error(
        "Lỗi xóa phim:",
        error
      );

      alert(
        error.message ||
        "Không thể xóa phim"
      );
    }
  };


  // =========================
  // TÌM KIẾM
  // =========================

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


  // =========================
  // FORMAT NGÀY
  // =========================

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


  // =========================
  // TRẠNG THÁI
  // =========================

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
        status === "Ended"
      ) {
        return "Đã kết thúc";
      }

      return (
        status ||
        "Chưa xác định"
      );
    };


  return (
    <div className="movie-admin">


      {/* =========================
          HEADER
      ========================= */}

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
          onClick={
            openAddForm
          }
        >

          <FaPlus />

          Thêm phim

        </button>

      </div>


      {/* =========================
          TOOLBAR
      ========================= */}

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


      {/* =========================
          TABLE
      ========================= */}

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

            {/* LOADING */}

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


              /* DANH SÁCH PHIM */

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


                    {/* TÊN PHIM + POSTER */}

                    <td>

                      <div className="movie-name-cell">

                        <div className="movie-mini-poster">

                          {movie.posterUrl ? (

                            <img
                              src={getPosterUrl(
                                movie.posterUrl
                              )}
                              alt={
                                movie.title
                              }
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


                    {/* NGÀY CHIẾU */}

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


              /* KHÔNG CÓ PHIM */

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


      {/* =========================
          FORM THÊM / SỬA
      ========================= */}

      {showForm && (

        <div className="movie-modal-overlay">

          <div className="movie-modal">


            {/* HEADER FORM */}

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

                  setEditingMovie(
                    null
                  );

                }}
              >

                <FaTimes />

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSave
              }
            >

              <div className="movie-form-grid">


                {/* =========================
                    TÊN PHIM
                ========================= */}

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


                {/* =========================
                    MÔ TẢ
                ========================= */}

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


                {/* =========================
                    THỂ LOẠI
                ========================= */}

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


                {/* =========================
                    THỜI LƯỢNG
                ========================= */}

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


                {/* =========================
                    NGÀY KHỞI CHIẾU
                ========================= */}

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


                {/* =========================
                    ĐẠO DIỄN
                ========================= */}

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


                {/* =========================
                    ĐỘ TUỔI
                ========================= */}

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


                {/* =========================
                    TRẠNG THÁI
                ========================= */}

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


                {/* =========================
                    POSTER URL
                ========================= */}

                <div className="movie-form-field full">

                  <label>
                    Poster URL
                  </label>

                  <input
                    type="text"
                    name="posterUrl"
                    value={
                      form.posterUrl
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="/assets/bat-tien.jpeg"
                  />

                </div>


                {/* =========================
                    TRAILER URL
                ========================= */}

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


              {/* =========================
                  BUTTON FORM
              ========================= */}

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

    </div>
  );
}

export default MovieAdmin;