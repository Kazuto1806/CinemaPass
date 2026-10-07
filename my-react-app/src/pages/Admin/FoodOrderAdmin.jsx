import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../constants";
import "./FoodOrderAdmin.css";

function FoodOrderAdmin() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/foodorders`);

      if (!response.ok) {
        throw new Error("Không thể tải danh sách đơn bắp nước.");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !keyword ||
        String(order.foodOrderId).includes(keyword) ||
        String(order.userId).includes(keyword) ||
        (order.userName || "").toLowerCase().includes(keyword) ||
        (order.userEmail || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "Tất cả" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Chờ xử lý"
  ).length;

  const preparingOrders = orders.filter(
    (order) => order.status === "Đang chuẩn bị"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Đã hoàn thành"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "Đã hủy"
  ).length;

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Chờ xử lý":
        return "status-pending";

      case "Đang chuẩn bị":
        return "status-preparing";

      case "Đã hoàn thành":
        return "status-completed";

      case "Đã hủy":
        return "status-cancelled";

      default:
        return "";
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);

      const response = await fetch(
        `${API_BASE}/api/foodorders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể cập nhật trạng thái đơn."
        );
      }

      await loadOrders();

      const updatedOrder = await fetch(
        `${API_BASE}/api/foodorders/${orderId}`
      );

      if (updatedOrder.ok) {
        const orderData = await updatedOrder.json();
        setSelectedOrder(orderData);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="food-order-admin">
      <div className="food-order-header">
        <div>
          <h1>Quản lý đơn bắp nước</h1>
          <p>Theo dõi và xử lý các đơn hàng bắp nước của khách hàng.</p>
        </div>

        <button
          type="button"
          className="food-order-refresh-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      <div className="food-order-stats">
        <div className="food-order-stat-card">
          <span className="stat-label">Tổng đơn</span>
          <strong>{totalOrders}</strong>
        </div>

        <div className="food-order-stat-card">
          <span className="stat-label">Chờ xử lý</span>
          <strong>{pendingOrders}</strong>
        </div>

        <div className="food-order-stat-card">
          <span className="stat-label">Đang chuẩn bị</span>
          <strong>{preparingOrders}</strong>
        </div>

        <div className="food-order-stat-card">
          <span className="stat-label">Đã hoàn thành</span>
          <strong>{completedOrders}</strong>
        </div>

        <div className="food-order-stat-card">
          <span className="stat-label">Đã hủy</span>
          <strong>{cancelledOrders}</strong>
        </div>
      </div>

      <div className="food-order-toolbar">
        <div className="food-order-search">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, người dùng, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="food-order-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đang chuẩn bị">Đang chuẩn bị</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="food-order-error">
          {error}
        </div>
      )}

      <div className="food-order-table-wrapper">
        <table className="food-order-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Số món</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="food-order-empty">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="food-order-empty">
                  Không có đơn bắp nước nào.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.foodOrderId}>
                  <td>
                    <strong>#{order.foodOrderId}</strong>
                  </td>

                  <td>
                    <div className="customer-name">
                      {order.userName || `User #${order.userId}`}
                    </div>

                    <div className="customer-email">
                      {order.userEmail || "-"}
                    </div>
                  </td>

                  <td>
                    {Array.isArray(order.items)
                      ? order.items.reduce(
                          (total, item) => total + Number(item.quantity || 0),
                          0
                        )
                      : 0}
                  </td>

                  <td className="order-total">
                    {formatMoney(order.totalAmount)}
                  </td>

                  <td>
                    <span
                      className={`order-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>{formatDate(order.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className="view-order-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div
          className="food-order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="food-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="food-order-modal-header">
              <div>
                <h2>
                  Chi tiết đơn #{selectedOrder.foodOrderId}
                </h2>

                <p>
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                className="food-order-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="food-order-customer">
              <h3>Thông tin khách hàng</h3>

              <p>
                <strong>Tên:</strong>{" "}
                {selectedOrder.userName ||
                  `User #${selectedOrder.userId}`}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {selectedOrder.userEmail || "-"}
              </p>
            </div>

            <div className="food-order-items">
              <h3>Danh sách món</h3>

              {selectedOrder.items?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Món</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.foodOrderItemId}>
                        <td>{item.foodName}</td>

                        <td>{item.quantity}</td>

                        <td>
                          {formatMoney(item.unitPrice)}
                        </td>

                        <td>
                          {formatMoney(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Đơn hàng không có món.</p>
              )}
            </div>

            <div className="food-order-total">
              <span>Tổng cộng</span>

              <strong>
                {formatMoney(selectedOrder.totalAmount)}
              </strong>
            </div>

            <div className="food-order-status-control">
              <label htmlFor="food-order-status">
                Cập nhật trạng thái
              </label>

              <select
                id="food-order-status"
                value={selectedOrder.status}
                disabled={updating}
                onChange={(e) =>
                  updateStatus(
                    selectedOrder.foodOrderId,
                    e.target.value
                  )
                }
              >
                <option value="Chờ xử lý">
                  Chờ xử lý
                </option>

                <option value="Đang chuẩn bị">
                  Đang chuẩn bị
                </option>

                <option value="Đã hoàn thành">
                  Đã hoàn thành
                </option>

                <option value="Đã hủy">
                  Đã hủy
                </option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodOrderAdmin;