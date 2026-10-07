import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../constants";
import "./PaymentAdmin.css";

const PAYMENT_STATUSES = [
  "Tất cả",
  "Chưa thanh toán",
  "Đã thanh toán",
  "Thanh toán thất bại",
  "Đã hoàn tiền",
];

const PAYMENT_METHODS = [
  "MoMo",
  "VNPay",
  "ZaloPay",
  "Chuyển khoản",
  "Tiền mặt",
];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("vi-VN");
}

function getPaymentClass(status) {
  switch (status) {
    case "Đã thanh toán":
      return "payment-status payment-paid";

    case "Thanh toán thất bại":
      return "payment-status payment-failed";

    case "Đã hoàn tiền":
      return "payment-status payment-refunded";

    default:
      return "payment-status payment-pending";
  }
}

export default function PaymentAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [paymentStatus, setPaymentStatus] =
    useState("Đã thanh toán");

  const [paymentMethod, setPaymentMethod] =
    useState("MoMo");

  const [transactionId, setTransactionId] =
    useState("");

  const [saving, setSaving] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/tickets`
      );

      if (!response.ok) {
        throw new Error(
          "Không thể tải danh sách thanh toán."
        );
      }

      const data = await response.json();

      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Có lỗi xảy ra khi tải thanh toán."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !keyword ||
        String(ticket.ticketId)
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.userName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.userEmail || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.movieTitle || "")
          .toLowerCase()
          .includes(keyword) ||
        String(ticket.paymentTransactionId || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "Tất cả" ||
        ticket.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const statistics = useMemo(() => {
    const totalTransactions = tickets.length;

    const paidTickets = tickets.filter(
      (ticket) =>
        ticket.paymentStatus ===
        "Đã thanh toán"
    );

    const pendingTickets = tickets.filter(
      (ticket) =>
        ticket.paymentStatus ===
        "Chưa thanh toán"
    );

    const failedTickets = tickets.filter(
      (ticket) =>
        ticket.paymentStatus ===
        "Thanh toán thất bại"
    );

    const refundedTickets = tickets.filter(
      (ticket) =>
        ticket.paymentStatus ===
        "Đã hoàn tiền"
    );

    const revenue = paidTickets.reduce(
      (sum, ticket) =>
        sum + Number(ticket.ticketPrice || 0),
      0
    );

    return {
      totalTransactions,
      paidCount: paidTickets.length,
      pendingCount: pendingTickets.length,
      failedCount: failedTickets.length,
      refundedCount: refundedTickets.length,
      revenue,
    };
  }, [tickets]);

  const openPayment = (ticket) => {
    setSelectedTicket(ticket);

    setPaymentStatus(
      ticket.paymentStatus ||
        "Chưa thanh toán"
    );

    setPaymentMethod(
      ticket.paymentMethod ||
        "MoMo"
    );

    setTransactionId(
      ticket.paymentTransactionId ||
        ""
    );
  };

  const closePayment = () => {
    if (saving) return;

    setSelectedTicket(null);
    setTransactionId("");
  };

  const updatePayment = async () => {
    if (!selectedTicket) return;

    if (
      paymentStatus === "Đã thanh toán" &&
      !paymentMethod
    ) {
      alert(
        "Vui lòng chọn phương thức thanh toán."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/api/tickets/${selectedTicket.ticketId}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            paymentStatus,
            paymentMethod:
              paymentStatus ===
              "Chưa thanh toán"
                ? null
                : paymentMethod,
            paymentTransactionId:
              transactionId.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Cập nhật thanh toán thất bại."
        );
      }

      alert(
        "Cập nhật thanh toán thành công."
      );

      setSelectedTicket(null);

      await loadTickets();
    } catch (err) {
      alert(
        err.message ||
          "Có lỗi khi cập nhật thanh toán."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payment-admin">
      <div className="payment-admin-header">
        <div>
          <h1>Quản lý thanh toán</h1>
          <p>
            Theo dõi và cập nhật trạng thái
            thanh toán vé xem phim.
          </p>
        </div>

        <button
          className="payment-refresh-btn"
          onClick={loadTickets}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      <div className="payment-stats">
        <div className="payment-stat-card">
          <span>Tổng giao dịch</span>
          <strong>
            {statistics.totalTransactions}
          </strong>
        </div>

        <div className="payment-stat-card">
          <span>Đã thanh toán</span>
          <strong>
            {statistics.paidCount}
          </strong>
        </div>

        <div className="payment-stat-card">
          <span>Chưa thanh toán</span>
          <strong>
            {statistics.pendingCount}
          </strong>
        </div>

        <div className="payment-stat-card">
          <span>Thất bại</span>
          <strong>
            {statistics.failedCount}
          </strong>
        </div>

        <div className="payment-stat-card payment-revenue">
          <span>Doanh thu đã thanh toán</span>
          <strong>
            {formatMoney(
              statistics.revenue
            )}
          </strong>
        </div>
      </div>

      <div className="payment-toolbar">
        <input
          type="text"
          placeholder="Tìm mã vé, khách hàng, email, phim..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          {PAYMENT_STATUSES.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="payment-error">
          {error}
        </div>
      )}

      <div className="payment-table-wrapper">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Mã vé</th>
              <th>Khách hàng</th>
              <th>Phim</th>
              <th>Ghế</th>
              <th>Giá</th>
              <th>Thanh toán</th>
              <th>Phương thức</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="payment-empty"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredTickets.length ===
              0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="payment-empty"
                >
                  Không có giao dịch nào.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.ticketId}>
                  <td>
                    #{ticket.ticketId}
                  </td>

                  <td>
                    <div className="payment-customer">
                      <strong>
                        {ticket.userName ||
                          "Khách hàng"}
                      </strong>

                      <small>
                        {ticket.userEmail ||
                          "-"}
                      </small>
                    </div>
                  </td>

                  <td>
                    {ticket.movieTitle ||
                      "-"}
                  </td>

                  <td>
                    {ticket.seatCode ||
                      "-"}
                  </td>

                  <td className="payment-price">
                    {formatMoney(
                      ticket.ticketPrice
                    )}
                  </td>

                  <td>
                    <span
                      className={getPaymentClass(
                        ticket.paymentStatus
                      )}
                    >
                      {ticket.paymentStatus ||
                        "Chưa thanh toán"}
                    </span>
                  </td>

                  <td>
                    {ticket.paymentMethod ||
                      "-"}
                  </td>

                  <td>
                    {formatDate(
                      ticket.createdAt
                    )}
                  </td>

                  <td>
                    <button
                      className="payment-view-btn"
                      onClick={() =>
                        openPayment(ticket)
                      }
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div
          className="payment-modal-overlay"
          onClick={closePayment}
        >
          <div
            className="payment-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="payment-modal-header">
              <div>
                <h2>
                  Thanh toán vé #
                  {selectedTicket.ticketId}
                </h2>

                <p>
                  {selectedTicket.movieTitle}
                </p>
              </div>

              <button
                className="payment-close-btn"
                onClick={closePayment}
              >
                ×
              </button>
            </div>

            <div className="payment-detail-grid">
              <div>
                <span>Khách hàng</span>
                <strong>
                  {selectedTicket.userName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selectedTicket.userEmail ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Ghế</span>
                <strong>
                  {selectedTicket.seatCode ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Loại vé</span>
                <strong>
                  {selectedTicket.ticketTypeName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Giá vé</span>
                <strong>
                  {formatMoney(
                    selectedTicket.ticketPrice
                  )}
                </strong>
              </div>

              <div>
                <span>Ngày đặt</span>
                <strong>
                  {formatDate(
                    selectedTicket.createdAt
                  )}
                </strong>
              </div>
            </div>

            <div className="payment-form">
              <label>
                Trạng thái thanh toán
              </label>

              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(
                    e.target.value
                  )
                }
              >
                {PAYMENT_STATUSES
                  .filter(
                    (status) =>
                      status !== "Tất cả"
                  )
                  .map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
              </select>

              <label>
                Phương thức thanh toán
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
                disabled={
                  paymentStatus ===
                  "Chưa thanh toán"
                }
              >
                {PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  )
                )}
              </select>

              <label>
                Mã giao dịch
              </label>

              <input
                type="text"
                placeholder="VD: MOMO123456"
                value={transactionId}
                onChange={(e) =>
                  setTransactionId(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="payment-modal-actions">
              <button
                className="payment-cancel-btn"
                onClick={closePayment}
                disabled={saving}
              >
                Hủy
              </button>

              <button
                className="payment-save-btn"
                onClick={updatePayment}
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : "Lưu thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}