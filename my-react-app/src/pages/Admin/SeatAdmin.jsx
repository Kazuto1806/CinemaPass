import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaChair,
  FaDoorOpen,
} from "react-icons/fa";
import "./SeatAdmin.css";
import { API_BASE } from "../../constants";
const ROOM_API_URL = `${API_BASE}/api/rooms`;
const SEAT_API_URL = `${API_BASE}/api/seats`;

function SeatAdmin() {
  const [rooms, setRooms] = useState([]);
  const [seats, setSeats] = useState([]);

  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [searchText, setSearchText] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    seatCode: "",
    rowName: "",
    seatNumber: "",
  });

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // =========================
  // LOAD ROOMS
  // =========================

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);

      const response = await fetch(ROOM_API_URL);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách phòng.");
      }

      const data = await response.json();

      const roomList = Array.isArray(data) ? data : [];

      setRooms(roomList);

      if (roomList.length > 0 && !selectedRoomId) {
        setSelectedRoomId(String(roomList[0].roomId));
      }
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách phòng chiếu.");
    } finally {
      setLoadingRooms(false);
    }
  };

  // =========================
  // LOAD SEATS
  // =========================

  const loadSeats = async (roomId) => {
    if (!roomId) {
      setSeats([]);
      return;
    }

    try {
      setLoadingSeats(true);

      const response = await fetch(
        `${SEAT_API_URL}?roomId=${roomId}`
      );

      if (!response.ok) {
        throw new Error("Không thể tải danh sách ghế.");
      }

      const data = await response.json();

      setSeats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách ghế.");
      setSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadRooms();
  }, []);

  // =========================
  // LOAD WHEN ROOM CHANGES
  // =========================

  useEffect(() => {
    if (selectedRoomId) {
      loadSeats(selectedRoomId);
    }
  }, [selectedRoomId]);

  // =========================
  // SELECTED ROOM
  // =========================

  const selectedRoom = useMemo(() => {
    return rooms.find(
      (room) =>
        Number(room.roomId) === Number(selectedRoomId)
    );
  }, [rooms, selectedRoomId]);

  // =========================
  // FILTER SEATS
  // =========================

  const filteredSeats = useMemo(() => {
    const keyword = searchText
      .toLowerCase()
      .trim();

    if (!keyword) {
      return seats;
    }

    return seats.filter((seat) => {
      const seatCode =
        seat.seatCode?.toLowerCase() || "";

      const rowName =
        seat.rowName?.toLowerCase() || "";

      return (
        seatCode.includes(keyword) ||
        rowName.includes(keyword)
      );
    });
  }, [seats, searchText]);

  // =========================
  // GROUP SEATS BY ROW
  // =========================

  const seatRows = useMemo(() => {
    const grouped = {};

    filteredSeats.forEach((seat) => {
      const row = seat.rowName || "?";

      if (!grouped[row]) {
        grouped[row] = [];
      }

      grouped[row].push(seat);
    });

    return Object.entries(grouped).sort(
      ([a], [b]) => a.localeCompare(b)
    );
  }, [filteredSeats]);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setFormData({
      seatCode: "",
      rowName: "",
      seatNumber: "",
    });

    setShowForm(false);
  };

  // =========================
  // HANDLE FORM
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // ADD SEAT
  // =========================

  const handleAddSeat = () => {
    if (!selectedRoomId) {
      alert("Vui lòng chọn phòng chiếu.");
      return;
    }

    setFormData({
      seatCode: "",
      rowName: "",
      seatNumber: "",
    });

    setShowForm(true);
  };

  // =========================
  // SAVE SEAT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoomId) {
      alert("Vui lòng chọn phòng chiếu.");
      return;
    }

    if (!formData.seatCode.trim()) {
      alert("Vui lòng nhập mã ghế.");
      return;
    }

    if (!formData.rowName.trim()) {
      alert("Vui lòng nhập hàng ghế.");
      return;
    }

    if (!formData.seatNumber) {
      alert("Vui lòng nhập số ghế.");
      return;
    }

    /*
      Hiện tại backend SeatsController chỉ có GET.
      Vì vậy giao diện này chưa gửi POST để tránh
      gọi API chưa tồn tại.
    */

    alert(
      "Giao diện thêm ghế đã sẵn sàng. Backend POST ghế sẽ được làm ở bước tiếp theo."
    );

    resetForm();
  };

  // =========================
  // STATS
  // =========================

  const totalSeats = seats.length;

  const bookedSeats = seats.filter(
    (seat) => seat.isBooked
  ).length;

  const availableSeats =
    totalSeats - bookedSeats;

  // =========================
  // RENDER
  // =========================

  return (
    <div className="seat-admin">

      {/* HEADER */}

      <div className="seat-admin-header">

        <div>

          <div className="seat-admin-title-row">

            <FaChair />

            <h1>Quản lý ghế ngồi</h1>

          </div>

          <p>
            Quản lý sơ đồ ghế theo từng phòng chiếu
          </p>

        </div>

        <button
          type="button"
          className="seat-add-btn"
          onClick={handleAddSeat}
        >
          <FaPlus />
          Thêm ghế
        </button>

      </div>

      {/* ROOM SELECT */}

      <div className="seat-room-selector">

        <div className="seat-room-selector-icon">
          <FaDoorOpen />
        </div>

        <div className="seat-room-selector-content">

          <label>Phòng chiếu</label>

          <select
            value={selectedRoomId}
            onChange={(event) =>
              setSelectedRoomId(event.target.value)
            }
            disabled={loadingRooms}
          >

            {loadingRooms ? (

              <option value="">
                Đang tải phòng...
              </option>

            ) : rooms.length === 0 ? (

              <option value="">
                Chưa có phòng
              </option>

            ) : (

              rooms.map((room) => (

                <option
                  key={room.roomId}
                  value={room.roomId}
                >
                  {room.roomName}
                </option>

              ))

            )}

          </select>

        </div>

        {selectedRoom && (

          <div className="seat-room-info">

            <span>
              Sức chứa
            </span>

            <strong>
              {selectedRoom.capacity} ghế
            </strong>

          </div>

        )}

      </div>

      {/* STATISTICS */}

      <div className="seat-stat-grid">

        <div className="seat-stat-card">

          <div className="seat-stat-icon purple">
            <FaChair />
          </div>

          <div>
            <span>Tổng ghế</span>
            <strong>{totalSeats}</strong>
          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon green">
            <FaChair />
          </div>

          <div>
            <span>Ghế trống</span>
            <strong>{availableSeats}</strong>
          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon orange">
            <FaChair />
          </div>

          <div>
            <span>Đã đặt</span>
            <strong>{bookedSeats}</strong>
          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon blue">
            <FaDoorOpen />
          </div>

          <div>
            <span>Phòng</span>
            <strong>
              {selectedRoom?.roomName || "-"}
            </strong>
          </div>

        </div>

      </div>

      {/* TOOLBAR */}

      <div className="seat-toolbar">

        <div className="seat-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Tìm mã ghế..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />

        </div>

        <span className="seat-count">
          {filteredSeats.length} ghế
        </span>

      </div>

      {/* SEAT MAP */}

      <div className="seat-map-card">

        <div className="seat-map-header">

          <div>

            <h2>Sơ đồ ghế</h2>

            <p>
              {selectedRoom?.roomName || "Chưa chọn phòng"}
            </p>

          </div>

        </div>

        {/* SCREEN */}

        <div className="cinema-screen">
          MÀN HÌNH
        </div>

        {loadingSeats ? (

          <div className="seat-empty">
            Đang tải sơ đồ ghế...
          </div>

        ) : seatRows.length === 0 ? (

          <div className="seat-empty">
            Phòng này chưa có ghế.
          </div>

        ) : (

          <div className="seat-map">

            {seatRows.map(([rowName, rowSeats]) => (

              <div
                className="seat-row"
                key={rowName}
              >

                <div className="seat-row-label">
                  {rowName}
                </div>

                <div className="seat-row-list">

                  {rowSeats.map((seat) => (

                    <button
                      type="button"
                      key={seat.seatId}
                      className={
                        seat.isBooked
                          ? "seat-item booked"
                          : "seat-item available"
                      }
                      title={
                        seat.isBooked
                          ? `${seat.seatCode} - Đã đặt`
                          : `${seat.seatCode} - Còn trống`
                      }
                    >
                      {seat.seatCode}
                    </button>

                  ))}

                </div>

              </div>

            ))}

          </div>

        )}

        {/* LEGEND */}

        <div className="seat-legend">

          <div>
            <span className="legend-box available"></span>
            Ghế trống
          </div>

          <div>
            <span className="legend-box booked"></span>
            Đã đặt
          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="seat-table-card">

        <div className="seat-table-header">

          <div>

            <h2>Danh sách ghế</h2>

            <p>
              Chi tiết ghế của phòng đang chọn
            </p>

          </div>

        </div>

        <div className="seat-table-wrapper">

          <table className="seat-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>Mã ghế</th>
                <th>Hàng</th>
                <th>Số ghế</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>

            </thead>

            <tbody>

              {filteredSeats.map((seat) => (

                <tr key={seat.seatId}>

                  <td>
                    #{seat.seatId}
                  </td>

                  <td>

                    <strong>
                      {seat.seatCode}
                    </strong>

                  </td>

                  <td>
                    {seat.rowName}
                  </td>

                  <td>
                    {seat.seatNumber}
                  </td>

                  <td>

                    <span
                      className={
                        seat.isBooked
                          ? "seat-status booked"
                          : "seat-status available"
                      }
                    >
                      {seat.isBooked
                        ? "Đã đặt"
                        : "Còn trống"}
                    </span>

                  </td>

                  <td>

                    <button
                      type="button"
                      className="seat-delete-btn"
                      disabled={seat.isBooked}
                      title={
                        seat.isBooked
                          ? "Không thể xóa ghế đã được đặt"
                          : "Xóa ghế"
                      }
                    >
                      <FaTrash />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ADD SEAT MODAL */}

      {showForm && (

        <div className="seat-modal-overlay">

          <div className="seat-modal">

            <div className="seat-modal-header">

              <div>

                <h2>Thêm ghế</h2>

                <p>
                  {selectedRoom?.roomName || ""}
                </p>

              </div>

              <button
                type="button"
                className="seat-modal-close"
                onClick={resetForm}
              >
                ×
              </button>

            </div>

            <form
              className="seat-form"
              onSubmit={handleSubmit}
            >

              <div className="seat-form-group">

                <label>Mã ghế</label>

                <input
                  type="text"
                  name="seatCode"
                  value={formData.seatCode}
                  onChange={handleChange}
                  placeholder="Ví dụ: A1"
                  required
                />

              </div>

              <div className="seat-form-group">

                <label>Hàng ghế</label>

                <input
                  type="text"
                  name="rowName"
                  value={formData.rowName}
                  onChange={handleChange}
                  placeholder="Ví dụ: A"
                  required
                />

              </div>

              <div className="seat-form-group">

                <label>Số ghế</label>

                <input
                  type="number"
                  name="seatNumber"
                  value={formData.seatNumber}
                  onChange={handleChange}
                  min="1"
                  placeholder="Ví dụ: 1"
                  required
                />

              </div>

              <div className="seat-form-actions">

                <button
                  type="button"
                  className="seat-cancel-btn"
                  onClick={resetForm}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="seat-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : "Thêm ghế"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default SeatAdmin;