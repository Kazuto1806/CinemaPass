import { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
} from "react-icons/fa";
import NotificationPopup from "../../components/NotificationPopup";
import "./CinemaAdmin.css";

const API_URL = "http://localhost:5000/api/cinemas";

function CinemaAdmin() {
  const [cinemas, setCinemas] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    status: "Đang hoạt động",
  });

  const [loading, setLoading] = useState(false);
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

  // =========================
  // LẤY DANH SÁCH RẠP
  // =========================
  const fetchCinemas = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách rạp");
      }

      const data = await response.json();

      setCinemas(data);
    } catch (error) {
      console.error(error);
      showNotification("error", "Lỗi kết nối", "Không thể kết nối đến API rạp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  // =========================
  // MỞ FORM THÊM
  // =========================
  const handleAdd = () => {
    setEditingCinema(null);

    setFormData({
      name: "",
      address: "",
      phone: "",
      status: "Đang hoạt động",
    });

    setShowModal(true);
  };

  // =========================
  // MỞ FORM SỬA
  // =========================
  const handleEdit = (cinema) => {
    setEditingCinema(cinema);

    setFormData({
      name: cinema.name || "",
      address: cinema.address || "",
      phone: cinema.phone || "",
      status: cinema.status || "Đang hoạt động",
    });

    setShowModal(true);
  };

  // =========================
  // ĐÓNG FORM
  // =========================
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCinema(null);
  };

  // =========================
  // NHẬP FORM
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // THÊM / CẬP NHẬT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification("warning", "Thiếu thông tin", "Vui lòng nhập tên rạp");
      return;
    }

    if (!formData.address.trim()) {
      showNotification("warning", "Thiếu thông tin", "Vui lòng nhập địa chỉ");
      return;
    }

    try {
      let response;

      if (editingCinema) {
        // =========================
        // CẬP NHẬT
        // =========================
        response = await fetch(
          `${API_URL}/${editingCinema.cinemaId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );
      } else {
        // =========================
        // THÊM MỚI
        // =========================
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Có lỗi xảy ra");
      }

      showNotification("success", "Thành công", data.message || "Lưu rạp thành công");

      handleCloseModal();

      // Lấy lại dữ liệu thật từ SQL
      fetchCinemas();
    } catch (error) {
      console.error(error);
      showNotification("error", "Không thể lưu dữ liệu", error.message || "Không thể lưu dữ liệu");
    }
  };

  // =========================
  // XÓA RẠP
  // =========================
  const deleteCinema = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể xóa rạp");
      }

      showNotification("success", "Thành công", data.message || "Xóa rạp thành công");

      // Lấy lại dữ liệu từ SQL
      fetchCinemas();
    } catch (error) {
      console.error(error);
      showNotification("error", "Không thể xóa rạp", error.message || "Không thể xóa rạp");
    }
  };

  const handleDelete = (id) => {
    showNotification(
      "warning",
      "Xác nhận xóa rạp",
      "Bạn có chắc muốn xóa rạp này không?",
      () => {
        closeNotification();
        void deleteCinema(id);
      }
    );
  };

  // =========================
  // TÌM KIẾM
  // =========================
  const filteredCinemas = cinemas.filter((cinema) => {
    const keyword = search.toLowerCase();

    return (
      cinema.name?.toLowerCase().includes(keyword) ||
      cinema.address?.toLowerCase().includes(keyword) ||
      cinema.phone?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="cinema-admin">
      {/* HEADER */}
      <div className="admin-page-header">
        <div>
          <h1>Quản lý rạp chiếu phim</h1>
          <p>Quản lý danh sách các rạp trong hệ thống</p>
        </div>

        <button className="btn-add" onClick={handleAdd}>
          <FaPlus />
          Thêm rạp
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="admin-toolbar">
        <div className="search-box">
          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm rạp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="cinema-table-container">
        {loading ? (
          <div className="empty-state">
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredCinemas.length === 0 ? (
          <div className="empty-state">
            <FaBuilding />
            <h3>Chưa có rạp</h3>
            <p>Không tìm thấy rạp nào trong hệ thống.</p>
          </div>
        ) : (
          <table className="cinema-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên rạp</th>
                <th>Địa chỉ</th>
                <th>Số điện thoại</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredCinemas.map((cinema) => (
                <tr key={cinema.cinemaId}>
                  <td>#{cinema.cinemaId}</td>

                  <td>
                    <div className="cinema-name">
                      <div className="cinema-icon">
                        <FaBuilding />
                      </div>

                      <span>{cinema.name}</span>
                    </div>
                  </td>

                  <td>
                    <div className="cinema-info">
                      <FaMapMarkerAlt />
                      <span>{cinema.address}</span>
                    </div>
                  </td>

                  <td>
                    <div className="cinema-info">
                      <FaPhone />
                      <span>{cinema.phone || "Chưa cập nhật"}</span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        cinema.status === "Đang hoạt động"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {cinema.status}
                    </span>
                  </td>

                  <td>
                    {cinema.createdAt
                      ? new Date(
                          cinema.createdAt
                        ).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(cinema)}
                        title="Sửa"
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDelete(cinema.cinemaId)
                        }
                        title="Xóa"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="cinema-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingCinema
                    ? "Chỉnh sửa rạp"
                    : "Thêm rạp mới"}
                </h2>

                <p>
                  {editingCinema
                    ? "Cập nhật thông tin rạp"
                    : "Nhập thông tin rạp mới"}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={handleCloseModal}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên rạp</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Nhập tên rạp"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>

                <input
                  type="text"
                  name="address"
                  placeholder="Nhập địa chỉ rạp"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>

                <input
                  type="text"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
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

                  <option value="Ngừng hoạt động">
                    Ngừng hoạt động
                  </option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="btn-save"
                >
                  {editingCinema
                    ? "Lưu thay đổi"
                    : "Thêm rạp"}
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

export default CinemaAdmin;