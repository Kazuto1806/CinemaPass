import { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaDoorOpen,
  FaBuilding,
} from "react-icons/fa";

import NotificationPopup from "../../components/NotificationPopup";
import { API_BASE } from "../../constants";

import "./RoomAdmin.css";

const ROOM_API_URL = `${API_BASE}/api/rooms`;
const CINEMA_API_URL = `${API_BASE}/api/cinemas`;

function RoomAdmin() {
  // =========================================================
  // DATA
  // =========================================================

  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);

  const [search, setSearch] = useState("");

  // =========================================================
  // MODAL
  // =========================================================

  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // =========================================================
  // FORM
  // =========================================================

  const [formData, setFormData] = useState({
    cinemaId: "",
    roomName: "",
    capacity: 100,
    status: "Active",
  });

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  // =========================================================
  // NOTIFICATION FUNCTIONS
  // =========================================================

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

  // =========================================================
  // LẤY DANH SÁCH RẠP
  // =========================================================

  const fetchCinemas = async () => {
    try {
      const response = await fetch(CINEMA_API_URL);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách rạp");
      }

      const data = await response.json();

      setCinemas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách rạp:", error);

      showNotification(
        "error",
        "Lỗi kết nối",
        "Không thể lấy danh sách rạp từ hệ thống."
      );
    }
  };

  // =========================================================
  // LẤY DANH SÁCH PHÒNG
  // =========================================================

  const fetchRooms = async () => {
    try {
      setLoading(true);

      const response = await fetch(ROOM_API_URL);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách phòng chiếu");
      }

      const data = await response.json();

      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách phòng:", error);

      showNotification(
        "error",
        "Lỗi kết nối",
        "Không thể lấy danh sách phòng chiếu từ hệ thống."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    fetchCinemas();
    fetchRooms();
  }, []);

  // =========================================================
  // TÌM TÊN RẠP
  // =========================================================

  const getCinemaName = (cinemaId) => {
    const cinema = cinemas.find(
      (item) => Number(item.cinemaId) === Number(cinemaId)
    );

    return cinema?.name || "Chưa xác định";
  };

  // =========================================================
  // MỞ FORM THÊM
  // =========================================================

  const handleAdd = () => {
    setEditingRoom(null);

    setFormData({
      cinemaId: cinemas.length > 0 ? String(cinemas[0].cinemaId) : "",
      roomName: "",
      capacity: 100,
      status: "Active",
    });

    setShowModal(true);
  };

  // =========================================================
  // MỞ FORM SỬA
  // =========================================================

  const handleEdit = (room) => {
    setEditingRoom(room);

    setFormData({
      cinemaId: String(room.cinemaId || ""),
      roomName: room.roomName || "",
      capacity: room.capacity || 100,
      status:
        room.status === "Inactive"
          ? "Inactive"
          : "Active",
    });

    setShowModal(true);
  };

  // =========================================================
  // ĐÓNG FORM
  // =========================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingRoom(null);
  };

  // =========================================================
  // NHẬP FORM
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // THÊM / CẬP NHẬT PHÒNG
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -----------------------------------------
    // KIỂM TRA RẠP
    // -----------------------------------------

    if (!formData.cinemaId) {
      showNotification(
        "warning",
        "Thiếu thông tin",
        "Vui lòng chọn rạp chiếu."
      );

      return;
    }

    // -----------------------------------------
    // KIỂM TRA TÊN PHÒNG
    // -----------------------------------------

    if (!formData.roomName.trim()) {
      showNotification(
        "warning",
        "Thiếu thông tin",
        "Vui lòng nhập tên phòng chiếu."
      );

      return;
    }

    // -----------------------------------------
    // KIỂM TRA SỨC CHỨA
    // -----------------------------------------

    const capacity = Number(formData.capacity);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      showNotification(
        "warning",
        "Sức chứa không hợp lệ",
        "Sức chứa phải là số nguyên lớn hơn 0."
      );

      return;
    }

    try {
      setSaving(true);

      // -----------------------------------------
      // DATA GỬI BACKEND
      // -----------------------------------------

      const requestBody = {
        cinemaId: Number(formData.cinemaId),
        roomName: formData.roomName.trim(),
        capacity: capacity,
        status: formData.status,
      };

      let response;

      // -----------------------------------------
      // UPDATE
      // -----------------------------------------

      if (editingRoom) {
        response = await fetch(
          `${ROOM_API_URL}/${editingRoom.roomId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );
      }

      // -----------------------------------------
      // CREATE
      // -----------------------------------------

      else {
        response = await fetch(ROOM_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      // -----------------------------------------
      // ĐỌC RESPONSE
      // -----------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể lưu phòng chiếu."
        );
      }

      // -----------------------------------------
      // THÔNG BÁO THÀNH CÔNG
      // -----------------------------------------

      showNotification(
        "success",
        "Thành công",
        data.message ||
          (editingRoom
            ? "Cập nhật phòng chiếu thành công."
            : "Thêm phòng chiếu thành công.")
      );

      // -----------------------------------------
      // ĐÓNG MODAL
      // -----------------------------------------

      setShowModal(false);
      setEditingRoom(null);

      // -----------------------------------------
      // RESET FORM
      // -----------------------------------------

      setFormData({
        cinemaId:
          cinemas.length > 0
            ? String(cinemas[0].cinemaId)
            : "",
        roomName: "",
        capacity: 100,
        status: "Active",
      });

      // -----------------------------------------
      // LOAD LẠI DATABASE
      // -----------------------------------------

      await fetchRooms();
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);

      showNotification(
        "error",
        "Không thể lưu phòng",
        error.message || "Đã xảy ra lỗi khi lưu phòng chiếu."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // XÓA PHÒNG
  // =========================================================

  const deleteRoom = async (id) => {
    try {
      const response = await fetch(
        `${ROOM_API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể xóa phòng chiếu."
        );
      }

      showNotification(
        "success",
        "Thành công",
        data.message || "Xóa phòng chiếu thành công."
      );

      await fetchRooms();
    } catch (error) {
      console.error("Lỗi xóa phòng:", error);

      showNotification(
        "error",
        "Không thể xóa phòng",
        error.message || "Đã xảy ra lỗi khi xóa phòng."
      );
    }
  };

  // =========================================================
  // XÁC NHẬN XÓA
  // =========================================================

  const handleDelete = (id) => {
    showNotification(
      "warning",
      "Xác nhận xóa phòng",
      "Bạn có chắc muốn xóa phòng chiếu này không?",
      () => {
        closeNotification();
        void deleteRoom(id);
      }
    );
  };

  // =========================================================
  // TÌM KIẾM
  // =========================================================

  const filteredRooms = rooms.filter((room) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return true;
    }

    const cinemaName = getCinemaName(room.cinemaId);

    return (
      room.roomName
        ?.toLowerCase()
        .includes(keyword) ||
      cinemaName
        ?.toLowerCase()
        .includes(keyword) ||
      String(room.roomId).includes(keyword)
    );
  });

  // =========================================================
  // THỐNG KÊ
  // =========================================================

  const totalRooms = rooms.length;

  const activeRooms = rooms.filter(
    (room) => room.status !== "Inactive"
  ).length;

  const inactiveRooms = rooms.filter(
    (room) => room.status === "Inactive"
  ).length;

  const totalCapacity = rooms.reduce(
    (total, room) =>
      total + Number(room.capacity || 0),
    0
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="room-admin">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="room-admin-header">

        <div>
          <div className="room-admin-title-row">
            <FaDoorOpen />

            <h1>Quản lý phòng chiếu</h1>
          </div>

          <p>
            Quản lý danh sách các phòng chiếu trong hệ thống
          </p>
        </div>

        <button
          type="button"
          className="room-add-btn"
          onClick={handleAdd}
        >
          <FaPlus />
          Thêm phòng
        </button>

      </div>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="room-stat-grid">

        <div className="room-stat-card">

          <div className="room-stat-icon purple">
            <FaDoorOpen />
          </div>

          <div>
            <span>Tổng phòng</span>
            <strong>{totalRooms}</strong>
          </div>

        </div>

        <div className="room-stat-card">

          <div className="room-stat-icon green">
            <FaDoorOpen />
          </div>

          <div>
            <span>Đang hoạt động</span>
            <strong>{activeRooms}</strong>
          </div>

        </div>

        <div className="room-stat-card">

          <div className="room-stat-icon orange">
            <FaDoorOpen />
          </div>

          <div>
            <span>Tạm ngưng</span>
            <strong>{inactiveRooms}</strong>
          </div>

        </div>

        <div className="room-stat-card">

          <div className="room-stat-icon blue">
            <FaBuilding />
          </div>

          <div>
            <span>Tổng sức chứa</span>
            <strong>{totalCapacity}</strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div className="room-toolbar">

        <div className="room-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm phòng..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="room-count">
          Hiển thị {filteredRooms.length} / {rooms.length} phòng
        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="room-table-card">

        <div className="room-table-header">

          <h2>Danh sách phòng chiếu</h2>

          <p>
            Các phòng chiếu đang được quản lý trong hệ thống
          </p>

        </div>

        <div className="room-table-wrapper">

          {loading ? (
            <div className="room-empty">
              Đang tải dữ liệu phòng chiếu...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="room-empty">

              <FaDoorOpen size={32} />

              <p>
                Chưa có phòng chiếu nào.
              </p>

            </div>
          ) : (
            <table className="room-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Phòng chiếu</th>
                  <th>Rạp</th>
                  <th>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>

              </thead>

              <tbody>

                {filteredRooms.map((room) => (

                  <tr key={room.roomId}>

                    {/* ID */}

                    <td>
                      <span className="room-id">
                        #{room.roomId}
                      </span>
                    </td>

                    {/* ROOM NAME */}

                    <td>

                      <div className="room-name-cell">

                        <div className="room-mini-icon">
                          <FaDoorOpen />
                        </div>

                        <strong>
                          {room.roomName}
                        </strong>

                      </div>

                    </td>

                    {/* CINEMA */}

                    <td>

                      <div className="room-name-cell">

                        <div className="room-mini-icon">
                          <FaBuilding />
                        </div>

                        <span>
                          {getCinemaName(room.cinemaId)}
                        </span>

                      </div>

                    </td>

                    {/* CAPACITY */}

                    <td>

                      <span className="capacity-badge">
                        {room.capacity} ghế
                      </span>

                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`status-badge ${
                          room.status === "Inactive"
                            ? "inactive"
                            : "active"
                        }`}
                      >
                        {room.status === "Inactive"
                          ? "Tạm ngưng"
                          : "Đang hoạt động"}
                      </span>

                    </td>

                    {/* CREATED */}

                    <td>

                      {room.createdAt
                        ? new Date(
                            room.createdAt
                          ).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}

                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="room-actions">

                        <button
                          type="button"
                          className="room-action edit"
                          title="Sửa phòng"
                          onClick={() =>
                            handleEdit(room)
                          }
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="room-action delete"
                          title="Xóa phòng"
                          onClick={() =>
                            handleDelete(room.roomId)
                          }
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

      </div>

      {/* =====================================================
          MODAL
      ====================================================== */}

      {showModal && (

        <div className="room-modal-overlay">

          <div className="room-modal">

            {/* MODAL HEADER */}

            <div className="room-modal-header">

              <div>

                <h2>
                  {editingRoom
                    ? "Chỉnh sửa phòng chiếu"
                    : "Thêm phòng chiếu"}
                </h2>

                <p>
                  {editingRoom
                    ? "Cập nhật thông tin phòng chiếu"
                    : "Nhập thông tin phòng chiếu mới"}
                </p>

              </div>

              <button
                type="button"
                className="room-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
              >
                <FaTimes />
              </button>

            </div>

            {/* FORM */}

            <form
              className="room-form"
              onSubmit={handleSubmit}
            >

              {/* RẠP */}

              <div className="room-form-group">

                <label>Rạp chiếu</label>

                <select
                  name="cinemaId"
                  value={formData.cinemaId}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    -- Chọn rạp --
                  </option>

                  {cinemas.map((cinema) => (

                    <option
                      key={cinema.cinemaId}
                      value={cinema.cinemaId}
                    >
                      {cinema.name}
                    </option>

                  ))}

                </select>

                {cinemas.length === 0 && (
                  <small
                    style={{
                      display: "block",
                      marginTop: "8px",
                      color: "#ff8989",
                    }}
                  >
                    Chưa có rạp nào trong hệ thống.
                  </small>
                )}

              </div>

              {/* TÊN PHÒNG */}

              <div className="room-form-group">

                <label>Tên phòng</label>

                <input
                  type="text"
                  name="roomName"
                  placeholder="Ví dụ: Phòng 1"
                  value={formData.roomName}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* SỨC CHỨA */}

              <div className="room-form-group">

                <label>Sức chứa</label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* TRẠNG THÁI */}

              <div className="room-form-group">

                <label>Trạng thái</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >

                  <option value="Active">
                    Đang hoạt động
                  </option>

                  <option value="Inactive">
                    Tạm ngưng
                  </option>

                </select>

              </div>

              {/* BUTTONS */}

              <div className="room-form-actions">

                <button
                  type="button"
                  className="room-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="room-save-btn"
                  disabled={
                    saving ||
                    cinemas.length === 0
                  }
                >
                  {saving
                    ? "Đang lưu..."
                    : editingRoom
                    ? "Lưu thay đổi"
                    : "Thêm phòng"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          NOTIFICATION
      ====================================================== */}

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

export default RoomAdmin;