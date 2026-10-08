import { useEffect, useMemo, useState } from "react";

import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaChair,
  FaDoorOpen,
  FaLayerGroup,
} from "react-icons/fa";

import "./SeatAdmin.css";

import { API_BASE } from "../../constants";

const ROOM_API_URL = `${API_BASE}/api/rooms`;
const SEAT_API_URL = `${API_BASE}/api/seats`;
const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
};
function SeatAdmin() {
  const [rooms, setRooms] = useState([]);
  const [seats, setSeats] = useState([]);

  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [searchText, setSearchText] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    rows: 0,
    seatsPerRow: 10,
    seatType: "Normal",
  });

  const [loadingRooms, setLoadingRooms] = useState(true);

  const [loadingSeats, setLoadingSeats] = useState(false);

  // =====================================================
  // LOAD ROOMS
  // =====================================================

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);

      const response = await fetch(ROOM_API_URL);

      if (!response.ok) {
        throw new Error(
          "Không thể tải danh sách phòng."
        );
      }

      const data = await response.json();

      const roomList = Array.isArray(data)
        ? data
        : [];

      setRooms(roomList);

      if (
        roomList.length > 0 &&
        !selectedRoomId
      ) {
        setSelectedRoomId(
          String(roomList[0].roomId)
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Không thể tải danh sách phòng chiếu."
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // =====================================================
  // LOAD SEATS
  // =====================================================

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
        throw new Error(
          "Không thể tải danh sách ghế."
        );
      }

      const data = await response.json();

      setSeats(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);

      alert(
        "Không thể tải danh sách ghế."
      );

      setSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadRooms();
  }, []);

  // =====================================================
  // LOAD WHEN ROOM CHANGES
  // =====================================================

  useEffect(() => {
    if (selectedRoomId) {
      loadSeats(selectedRoomId);
    }
  }, [selectedRoomId]);

  // =====================================================
  // SELECTED ROOM
  // =====================================================

  const selectedRoom = useMemo(() => {
    return rooms.find(
      (room) =>
        Number(room.roomId) ===
        Number(selectedRoomId)
    );
  }, [
    rooms,
    selectedRoomId,
  ]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredSeats = useMemo(() => {
    const keyword = searchText
      .toLowerCase()
      .trim();

    if (!keyword) {
      return seats;
    }

    return seats.filter((seat) => {
      const seatCode =
        seat.seatCode
          ?.toLowerCase() || "";

      const rowName =
        seat.rowName
          ?.toLowerCase() || "";

      const seatType =
        seat.seatType
          ?.toLowerCase() || "";

      return (
        seatCode.includes(keyword) ||
        rowName.includes(keyword) ||
        seatType.includes(keyword)
      );
    });
  }, [
    seats,
    searchText,
  ]);

  // =====================================================
  // GROUP SEATS BY ROW
  // =====================================================

  const seatRows = useMemo(() => {
    const grouped = {};

    filteredSeats.forEach((seat) => {
      const row =
        seat.rowName || "?";

      if (!grouped[row]) {
        grouped[row] = [];
      }

      grouped[row].push(seat);
    });

    Object.values(grouped).forEach(
      (rowSeats) => {
        rowSeats.sort(
          (a, b) =>
            Number(a.seatNumber || 0) -
            Number(b.seatNumber || 0)
        );
      }
    );

    return Object.entries(grouped).sort(
      ([a], [b]) =>
        a.localeCompare(b)
    );
  }, [filteredSeats]);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    const capacity =
      Number(
        selectedRoom?.capacity || 0
      );

    const defaultRows =
      capacity > 0
        ? Math.ceil(capacity / 10)
        : 5;

    setFormData({
      rows: defaultRows,
      seatsPerRow: 10,
      seatType: "Normal",
    });

    setShowForm(false);
  };

  // =====================================================
  // OPEN CREATE FORM
  // =====================================================

  const handleAddSeat = () => {
    if (!selectedRoomId) {
      alert(
        "Vui lòng chọn phòng chiếu."
      );
      return;
    }

    const capacity =
      Number(
        selectedRoom?.capacity || 0
      );

    const defaultRows =
      capacity > 0
        ? Math.ceil(capacity / 10)
        : 5;

    setFormData({
      rows: defaultRows,
      seatsPerRow: 10,
      seatType: "Normal",
    });

    setShowForm(true);
  };

  // =====================================================
  // HANDLE FORM
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "rows" ||
        name === "seatsPerRow"
          ? Number(value)
          : value,
    }));
  };

  // =====================================================
  // GENERATE SEATS
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoomId) {
      alert(
        "Vui lòng chọn phòng chiếu."
      );
      return;
    }

    const rows =
      Number(formData.rows);

    const seatsPerRow =
      Number(
        formData.seatsPerRow
      );

    const capacity =
      Number(
        selectedRoom?.capacity || 0
      );

    if (rows <= 0) {
      alert(
        "Số hàng phải lớn hơn 0."
      );
      return;
    }

    if (rows > 26) {
      alert(
        "Chỉ hỗ trợ tối đa 26 hàng từ A đến Z."
      );
      return;
    }

    if (seatsPerRow <= 0) {
      alert(
        "Số ghế mỗi hàng phải lớn hơn 0."
      );
      return;
    }

    if (seatsPerRow > 50) {
      alert(
        "Số ghế mỗi hàng không được vượt quá 50."
      );
      return;
    }

    if (capacity <= 0) {
      alert(
        "Phòng chưa có sức chứa hợp lệ."
      );
      return;
    }

    const expectedTotal = Math.min(
      rows * seatsPerRow,
      capacity
    );

    if (seats.length > 0) {
      alert(
        "Phòng này đã có ghế. Hãy xóa sơ đồ cũ trước khi tạo lại."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${SEAT_API_URL}/bulk`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            roomId:
              Number(
                selectedRoomId
              ),

            rows,

            seatsPerRow,

            seatType:
              formData.seatType,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
          `Không thể tạo sơ đồ ghế.HTTP ${response.status}`
        );
      }

      alert(
        `Đã tạo ${data.createdCount || expectedTotal} ghế thành công.`
      );

      setShowForm(false);

      await loadSeats(
        selectedRoomId
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
        `Không thể tạo sơ đồ ghế. HTTP ${response.status}`
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE ONE SEAT
  // =====================================================

  const handleDeleteSeat = async (
    seat
  ) => {
    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa ghế ${seat.seatCode}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${SEAT_API_URL}/${seat.seatId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Không thể xóa ghế."
        );
      }

      await loadSeats(
        selectedRoomId
      );

      alert(
        "Xóa ghế thành công."
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
        "Không thể xóa ghế."
      );
    }
  };

  // =====================================================
  // DELETE ALL SEATS IN ROOM
  // =====================================================

  const handleClearRoom = async () => {
    if (!selectedRoomId) {
      return;
    }

    if (seats.length === 0) {
      alert(
        "Phòng này chưa có ghế."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa toàn bộ ${seats.length} ghế của ${selectedRoom?.roomName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `${SEAT_API_URL}/room/${selectedRoomId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
          `Không thể xóa sơ đồ ghế. HTTP ${response.status}`
        );
      }

      await loadSeats(
        selectedRoomId
      );

      alert(
        "Đã xóa toàn bộ sơ đồ ghế."
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
        "Không thể xóa sơ đồ ghế."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // STATS
  // =====================================================

  const totalSeats =
    seats.length;

  const capacity =
    Number(
      selectedRoom?.capacity || 0
    );

  const remainingSeats =
    Math.max(
      capacity - totalSeats,
      0
    );

  const previewTotal = Math.min(
    Number(formData.rows || 0) *
      Number(
        formData.seatsPerRow || 0
      ),
    capacity
  );

  // =====================================================
  // SEAT TYPE TEXT
  // =====================================================

  const getSeatTypeText = (
    seatType
  ) => {
    if (seatType === "VIP") {
      return "VIP";
    }

    if (seatType === "Couple") {
      return "Couple";
    }

    return "Thường";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="seat-admin">

      {/* HEADER */}

      <div className="seat-admin-header">

        <div>

          <div className="seat-admin-title-row">

            <FaChair />

            <h1>
              Quản lý ghế ngồi
            </h1>

          </div>

          <p>
            Quản lý sơ đồ ghế theo từng phòng chiếu
          </p>

        </div>

        <div className="seat-header-actions">

          <button
            type="button"
            className="seat-add-btn"
            onClick={
              handleAddSeat
            }
          >
            <FaPlus />

            Tạo sơ đồ ghế
          </button>

          {seats.length > 0 && (
            <button
              type="button"
              className="seat-clear-btn"
              onClick={
                handleClearRoom
              }
              disabled={deleting}
            >
              <FaTrash />

              {deleting
                ? "Đang xóa..."
                : "Xóa sơ đồ"}
            </button>
          )}

        </div>

      </div>

      {/* ROOM SELECT */}

      <div className="seat-room-selector">

        <div className="seat-room-selector-icon">

          <FaDoorOpen />

        </div>

        <div className="seat-room-selector-content">

          <label>
            Phòng chiếu
          </label>

          <select
            value={
              selectedRoomId
            }
            onChange={(event) =>
              setSelectedRoomId(
                event.target.value
              )
            }
            disabled={
              loadingRooms
            }
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
                  key={
                    room.roomId
                  }
                  value={
                    room.roomId
                  }
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

            <span>
              Tổng ghế
            </span>

            <strong>
              {totalSeats}
            </strong>

          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon green">

            <FaLayerGroup />

          </div>

          <div>

            <span>
              Chưa tạo
            </span>

            <strong>
              {remainingSeats}
            </strong>

          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon blue">

            <FaDoorOpen />

          </div>

          <div>

            <span>
              Sức chứa
            </span>

            <strong>
              {capacity}
            </strong>

          </div>

        </div>

        <div className="seat-stat-card">

          <div className="seat-stat-icon orange">

            <FaChair />

          </div>

          <div>

            <span>
              Phòng
            </span>

            <strong>
              {selectedRoom?.roomName ||
                "-"}
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
            placeholder="Tìm mã ghế, hàng hoặc loại ghế..."
            value={
              searchText
            }
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
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

            <h2>
              Sơ đồ ghế
            </h2>

            <p>
              {selectedRoom?.roomName ||
                "Chưa chọn phòng"}
            </p>

          </div>

        </div>

        <div className="cinema-screen">
          MÀN HÌNH
        </div>

        {loadingSeats ? (

          <div className="seat-empty">
            Đang tải sơ đồ ghế...
          </div>

        ) : seatRows.length === 0 ? (

          <div className="seat-empty">

            <FaChair />

            <p>
              Phòng này chưa có ghế.
            </p>

            <button
              type="button"
              className="seat-create-empty-btn"
              onClick={
                handleAddSeat
              }
            >
              <FaPlus />
              Tạo sơ đồ ghế
            </button>

          </div>

        ) : (

          <div className="seat-map">

            {seatRows.map(
              ([
                rowName,
                rowSeats,
              ]) => (

                <div
                  className="seat-row"
                  key={rowName}
                >

                  <div className="seat-row-label">
                    {rowName}
                  </div>

                  <div className="seat-row-list">

                    {rowSeats.map(
                      (seat) => {

                        const seatType =
                          seat.seatType ||
                          "Normal";

                        return (

                          <button
                            type="button"
                            key={
                              seat.seatId
                            }
                            className={`seat-item ${seatType.toLowerCase()}`}
                            title={`${seat.seatCode} - ${getSeatTypeText(
                              seatType
                            )}`}
                          >
                            {seat.seatCode}
                          </button>

                        );
                      }
                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

        <div className="seat-legend">

          <div>

            <span className="legend-box normal"></span>

            Ghế thường

          </div>

          <div>

            <span className="legend-box vip"></span>

            Ghế VIP

          </div>

          <div>

            <span className="legend-box couple"></span>

            Ghế Couple

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="seat-table-card">

        <div className="seat-table-header">

          <div>

            <h2>
              Danh sách ghế
            </h2>

            <p>
              Chi tiết ghế của phòng đang chọn
            </p>

          </div>

        </div>

        <div className="seat-table-wrapper">

          <table className="seat-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Mã ghế
                </th>

                <th>
                  Hàng
                </th>

                <th>
                  Số ghế
                </th>

                <th>
                  Loại ghế
                </th>

                <th>
                  Thao tác
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredSeats.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="seat-empty"
                  >
                    Chưa có ghế

                  </td>

                </tr>

              ) : (

                filteredSeats.map(
                  (seat) => (

                    <tr
                      key={
                        seat.seatId
                      }
                    >

                      <td>
                        #
                        {
                          seat.seatId
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            seat.seatCode
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          seat.rowName
                        }
                      </td>

                      <td>
                        {
                          seat.seatNumber
                        }
                      </td>

                      <td>

                        <span
                          className={`seat-type-badge ${
                            (
                              seat.seatType ||
                              "Normal"
                            ).toLowerCase()
                          }`}
                        >
                          {getSeatTypeText(
                            seat.seatType
                          )}
                        </span>

                      </td>

                      <td>

                        <button
                          type="button"
                          className="seat-delete-btn"
                          onClick={() =>
                            handleDeleteSeat(
                              seat
                            )
                          }
                          title="Xóa ghế"
                        >
                          <FaTrash />
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* GENERATE MODAL */}

      {showForm && (

        <div className="seat-modal-overlay">

          <div className="seat-modal">

            <div className="seat-modal-header">

              <div>

                <h2>
                  Tạo sơ đồ ghế
                </h2>

                <p>
                  {
                    selectedRoom?.roomName
                  }
                </p>

              </div>

              <button
                type="button"
                className="seat-modal-close"
                onClick={
                  resetForm
                }
              >
                ×
              </button>

            </div>

            <form
              className="seat-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="seat-form-group">

                <label>
                  Số hàng
                </label>

                <input
                  type="number"
                  name="rows"
                  value={
                    formData.rows
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  max="26"
                  required
                />

                <small>
                  Ví dụ: 10 hàng = A → J
                </small>

              </div>

              <div className="seat-form-group">

                <label>
                  Số ghế mỗi hàng
                </label>

                <input
                  type="number"
                  name="seatsPerRow"
                  value={
                    formData.seatsPerRow
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  max="50"
                  required
                />

                <small>
                  Ví dụ: 10 ghế / hàng
                </small>

              </div>

              <div className="seat-form-group">

                <label>
                  Loại ghế
                </label>

                <select
                  name="seatType"
                  value={
                    formData.seatType
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value="Normal">
                    Ghế thường
                  </option>

                  <option value="VIP">
                    Ghế VIP
                  </option>

                  <option value="Couple">
                    Ghế Couple
                  </option>

                </select>

              </div>

              <div className="seat-preview">

                <span>
                  Sẽ tạo
                </span>

                <strong>
                  {previewTotal} ghế
                </strong>

                <small>
                  Sức chứa phòng:{" "}
                  {capacity} ghế
                </small>

              </div>

              <div className="seat-form-warning">

                Hệ thống tự động đánh số:

                <br />

                A1 → A{formData.seatsPerRow}

                <br />

                B1 → B{formData.seatsPerRow}

                <br />

                C1 → C{formData.seatsPerRow}

              </div>

              <div className="seat-form-actions">

                <button
                  type="button"
                  className="seat-cancel-btn"
                  onClick={
                    resetForm
                  }
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="seat-save-btn"
                  disabled={
                    saving ||
                    seats.length > 0
                  }
                >
                  {saving
                    ? "Đang tạo..."
                    : "Tạo sơ đồ"}
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