import { useEffect, useState } from "react";
import {
  FaSearch,
  FaTicketAlt,
  FaTrash,
  FaSyncAlt,
} from "react-icons/fa";
import NotificationPopup from "../../components/NotificationPopup";

import "./TicketAdmin.css";

const API_URL = "http://localhost:5000/api/tickets";

function TicketAdmin() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách vé");
      }

      const data = await response.json();

      setTickets(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách vé:", error);

      setError(
        error.message || "Không thể tải danh sách vé"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const deleteTicket = async (ticketId) => {
    try {
      const response = await fetch(
        `${API_URL}/${ticketId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Không thể xóa vé");
      }

      setTickets((currentTickets) =>
        currentTickets.filter(
          (ticket) => ticket.ticketId !== ticketId
        )
      );
      showNotification("success", "Thành công", "Xóa vé thành công");
    } catch (error) {
      console.error("Lỗi xóa vé:", error);

      showNotification(
        "error",
        "Không thể xóa vé",
        error.message || "Không thể xóa vé"
      );
    }
  };

  const requestDeleteTicket = (ticketId) => {
    showNotification(
      "warning",
      "Xác nhận xóa vé",
      "Bạn có chắc muốn xóa vé này không?",
      () => {
        closeNotification();
        void deleteTicket(ticketId);
      }
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) {
      return "Chưa cập nhật";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Chưa cập nhật";
    }

    return date.toLocaleString("vi-VN");
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString(
      "vi-VN"
    ) + " ₫";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Đã đặt":
        return "booked";

      case "Đã thanh toán":
        return "paid";

      case "Đã hủy":
        return "cancelled";

      default:
        return "other";
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const keyword = search
      .toLowerCase()
      .trim();

    if (!keyword) {
      return true;
    }

    return (
      ticket.ticketId
        ?.toString()
        .includes(keyword) ||
      ticket.userName
        ?.toLowerCase()
        .includes(keyword) ||
      ticket.movieTitle
        ?.toLowerCase()
        .includes(keyword) ||
      ticket.seatNumber
        ?.toLowerCase()
        .includes(keyword) ||
      ticket.status
        ?.toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="ticket-admin">
      <div className="ticket-admin-header">
        <div>
          <h1>Quản lý vé</h1>

          <p>
            Xem và quản lý các vé đặt trong CinemaPass
          </p>
        </div>

        <button
          className="ticket-refresh-button"
          onClick={loadTickets}
          disabled={loading}
        >
          <FaSyncAlt
            className={
              loading
                ? "ticket-refresh-icon spinning"
                : "ticket-refresh-icon"
            }
          />

          Làm mới
        </button>
      </div>

      <div className="ticket-toolbar">
        <div className="ticket-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Tìm mã vé, khách hàng, phim, ghế..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="ticket-count">
          <FaTicketAlt />

          <span>
            {filteredTickets.length} vé
          </span>
        </div>
      </div>

      <div className="ticket-table-container">
        <table className="ticket-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã vé</th>
              <th>Khách hàng</th>
              <th>Phim</th>
              <th>Ghế</th>
              <th>Suất chiếu</th>
              <th>Giá vé</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="10"
                  className="ticket-empty"
                >
                  Đang tải dữ liệu vé...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="10"
                  className="ticket-empty ticket-error"
                >
                  {error}
                </td>
              </tr>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map(
                (ticket, index) => (
                  <tr key={ticket.ticketId}>
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <span className="ticket-id">
                        #{ticket.ticketId}
                      </span>
                    </td>

                    <td>
                      <div className="ticket-user">
                        <div className="ticket-avatar">
                          {ticket.userName
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <strong>
                          {ticket.userName ||
                            "Không xác định"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="ticket-movie">
                        {ticket.movieTitle ||
                          "Không xác định"}
                      </span>
                    </td>

                    <td>
                      <span className="ticket-seat">
                        {ticket.seatNumber}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        ticket.showtime
                      )}
                    </td>

                    <td>
                      <strong className="ticket-price">
                        {formatPrice(
                          ticket.ticketPrice
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`ticket-status ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {ticket.status ||
                          "Không xác định"}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(
                        ticket.createdAt
                      )}
                    </td>

                    <td>
                      <button
                        className="ticket-delete-button"
                        title="Xóa vé"
                        onClick={() =>
                          requestDeleteTicket(
                            ticket.ticketId
                          )
                        }
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan="10"
                  className="ticket-empty"
                >
                  Chưa có vé nào trong cơ sở dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default TicketAdmin;