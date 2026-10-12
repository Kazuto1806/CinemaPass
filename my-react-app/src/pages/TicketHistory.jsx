
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTicketAlt,
  FaUtensils,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChair,
  FaReceipt,
  FaSyncAlt,
} from "react-icons/fa";
import "./TicketHistory.css";

const API_URL = "http://localhost:5000/api";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
}

function formatDate(value) {
  if (!value) return "Chưa có thông tin";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function Status({ value }) {
  const status = String(value ?? "").toLowerCase();

  let label = value || "Chưa xác định";
  let className = "history-status pending";

  if (
    ["paid", "completed", "success", "confirmed", "đã thanh toán", "đã xác nhận"].includes(status)
  ) {
    label = "Đã thanh toán";
    className = "history-status success";
  } else if (
    ["cancelled", "canceled", "failed", "đã hủy", "thất bại"].includes(status)
  ) {
    label = "Đã hủy / Thất bại";
    className = "history-status cancelled";
  } else if (
    ["pending", "unpaid", "chờ thanh toán", "đang chờ"].includes(status)
  ) {
    label = "Chờ thanh toán";
  }

  return <span className={className}>{label}</span>;
}

function TicketHistory() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");

  const loadHistory = async () => {
    if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
      setError("Không tìm thấy UserId. Ông hãy đăng nhập lại rồi thử lại nhé.");
      setTickets([]);
      setFoodOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [ticketResponse, foodResponse] = await Promise.all([
        fetch(`${API_URL}/tickets/user/${userId}`),
        fetch(`${API_URL}/foodorders/user/${userId}`),
      ]);

      if (!ticketResponse.ok || !foodResponse.ok) {
        throw new Error(
          `Không thể tải lịch sử. Vé: ${ticketResponse.status}, bắp nước: ${foodResponse.status}.`
        );
      }

      const [ticketData, foodData] = await Promise.all([
        ticketResponse.json(),
        foodResponse.json(),
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setFoodOrders(Array.isArray(foodData) ? foodData : []);
    } catch (err) {
      console.error("Lỗi tải lịch sử mua hàng:", err);
      setError(
        "Không tải được lịch sử mua hàng. Hãy kiểm tra backend có đang chạy tại localhost:5000 không."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  return (
    <div className="ticket-history-page">
      <div className="ticket-history-container">
        <button
          type="button"
          className="history-back-button"
          onClick={() => navigate("/account")}
        >
          <FaArrowLeft /> Quay lại tài khoản
        </button>

        <div className="history-heading">
          <div>
            <p className="history-eyebrow">CINEMAPASS</p>
            <h1>Lịch sử mua hàng</h1>
            <p className="history-subtitle">
              Theo dõi vé xem phim và các đơn bắp nước của ông.
            </p>
          </div>

          <button
            type="button"
            className="history-refresh-button"
            onClick={loadHistory}
            disabled={loading}
          >
            <FaSyncAlt /> Làm mới
          </button>
        </div>

        <div className="history-tabs">
          <button
            type="button"
            className={activeTab === "tickets" ? "active" : ""}
            onClick={() => setActiveTab("tickets")}
          >
            <FaTicketAlt /> Vé xem phim ({tickets.length})
          </button>

          <button
            type="button"
            className={activeTab === "food" ? "active" : ""}
            onClick={() => setActiveTab("food")}
          >
            <FaUtensils /> Đơn bắp nước ({foodOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="history-message">Đang tải lịch sử mua hàng...</div>
        ) : error ? (
          <div className="history-message history-error">
            <p>{error}</p>
            <button type="button" onClick={loadHistory}>
              Thử lại
            </button>
          </div>
        ) : activeTab === "tickets" ? (
          tickets.length === 0 ? (
            <div className="history-empty">
              <FaTicketAlt />
              <h3>Chưa có vé xem phim</h3>
              <p>Các vé đã đặt sẽ hiển thị tại đây.</p>
              <button type="button" onClick={() => navigate("/")}>
                Khám phá phim
              </button>
            </div>
          ) : (
            <div className="history-list">
              {tickets.map((ticket) => (
                <article
                  className="history-card"
                  key={ticket.ticketId}
                >
                  <div className="history-card-top">
                    <div className="history-card-icon">
                      <FaTicketAlt />
                    </div>

                    <div className="history-card-title">
                      <h3>{ticket.movieTitle || `Vé #${ticket.ticketId}`}</h3>
                      <p>Mã vé: #{ticket.ticketId}</p>
                    </div>

                    <Status value={ticket.paymentStatus || ticket.status} />
                  </div>

                  <div className="history-details">
                    <p>
                      <FaMapMarkerAlt />
                      <span>
                        {ticket.cinemaName || "Chưa có thông tin rạp"}
                        {ticket.roomName ? ` · ${ticket.roomName}` : ""}
                      </span>
                    </p>

                    <p>
                      <FaCalendarAlt />
                      <span>
                        {formatDate(ticket.showDate)} ·{" "}
                        {formatTime(ticket.startTime)}
                        {ticket.endTime ? ` - ${formatTime(ticket.endTime)}` : ""}
                      </span>
                    </p>

                    <p>
                      <FaChair />
                      <span>
                        Ghế: {ticket.seatCode || "Chưa có thông tin"}
                        {ticket.ticketTypeName
                          ? ` · ${ticket.ticketTypeName}`
                          : ""}
                      </span>
                    </p>

                    <p>
                      <FaReceipt />
                      <span>
                        Ngày đặt: {formatDate(ticket.createdAt)}
                      </span>
                    </p>
                  </div>

                  <div className="history-card-bottom">
                    <span>Giá vé</span>
                    <strong>{formatMoney(ticket.ticketPrice)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : foodOrders.length === 0 ? (
          <div className="history-empty">
            <FaUtensils />
            <h3>Chưa có đơn bắp nước</h3>
            <p>Các đơn bắp nước của ông sẽ hiển thị tại đây.</p>
            <button type="button" onClick={() => navigate("/food")}>
              Chọn bắp nước
            </button>
          </div>
        ) : (
          <div className="history-list">
            {foodOrders.map((order) => (
              <article
                className="history-card"
                key={order.foodOrderId}
              >
                <div className="history-card-top">
                  <div className="history-card-icon food-icon">
                    <FaUtensils />
                  </div>

                  <div className="history-card-title">
                    <h3>Đơn bắp nước #{order.foodOrderId}</h3>
                    <p>Ngày đặt: {formatDate(order.createdAt)}</p>
                  </div>

                  <Status value={order.status} />
                </div>

                <div className="food-order-items">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        className="food-order-item"
                        key={item.foodOrderItemId}
                      >
                        <span>
                          {item.foodName || `Món #${item.foodId}`}
                          {" "}× {item.quantity}
                        </span>
                        <strong>
                          {formatMoney(
                            item.amount ??
                              Number(item.unitPrice || 0) *
                                Number(item.quantity || 0)
                          )}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="food-no-items">
                      Không có thông tin chi tiết món ăn.
                    </p>
                  )}
                </div>

                <div className="history-card-bottom">
                  <span>Tổng tiền</span>
                  <strong>{formatMoney(order.totalAmount)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketHistory;