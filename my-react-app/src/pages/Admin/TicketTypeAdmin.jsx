import { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaTags,
  FaTicketAlt,
  FaCheckCircle,
  FaPauseCircle,
  FaMoneyBillWave,
} from "react-icons/fa";

import NotificationPopup from "../../components/NotificationPopup";
import { API_BASE } from "../../constants";

import "./TicketTypeAdmin.css";

const API_URL = `${API_BASE}/api/tickettypes`;

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  status: "Active",
};

function TicketTypeAdmin() {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const getId = (item) =>
    item.ticketTypeId ??
    item.id ??
    item.TicketTypeId;

  const getName = (item) =>
    item.name ??
    item.ticketTypeName ??
    item.typeName ??
    item.TicketTypeName ??
    "";

  const getDescription = (item) =>
    item.description ??
    item.Description ??
    "";

  const getPrice = (item) =>
    item.price ??
    item.ticketPrice ??
    item.TicketPrice ??
    0;

  const getStatus = (item) =>
    item.status ??
    item.Status ??
    "Active";

  const formatPrice = (value) => {
    const number = Number(value || 0);

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatStatus = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "active" ||
      normalized === "đang hoạt động" ||
      normalized === "hoạt động"
    ) {
      return "Đang hoạt động";
    }

    if (
      normalized === "inactive" ||
      normalized === "tạm ngưng" ||
      normalized === "ngừng hoạt động"
    ) {
      return "Tạm ngưng";
    }

    return status || "Tạm ngưng";
  };

  const isActive = (status) => {
    const normalized = String(status || "").toLowerCase();

    return (
      normalized === "active" ||
      normalized === "đang hoạt động" ||
      normalized === "hoạt động"
    );
  };

  const fetchTicketTypes = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setTicketTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải loại vé:", error);

      setTicketTypes([]);

      showNotification(
        "error",
        "Không thể lấy danh sách loại vé từ hệ thống."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketTypes();
  }, []);

  const filteredTicketTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return ticketTypes.filter((item) => {
      const name = getName(item).toLowerCase();
      const description = getDescription(item).toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        description.includes(keyword);

      const status = getStatus(item);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive(status)) ||
        (statusFilter === "inactive" && !isActive(status));

      return matchesSearch && matchesStatus;
    });
  }, [ticketTypes, search, statusFilter]);

  const totalCount = ticketTypes.length;

  const activeCount = ticketTypes.filter((item) =>
    isActive(getStatus(item))
  ).length;

  const inactiveCount = totalCount - activeCount;

  const averagePrice =
    totalCount > 0
      ? ticketTypes.reduce(
          (sum, item) => sum + Number(getPrice(item) || 0),
          0
        ) / totalCount
      : 0;

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(getId(item));

    setForm({
      name: getName(item),
      description: getDescription(item),
      price: getPrice(item),
      status: isActive(getStatus(item)) ? "Active" : "Inactive",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showNotification(
        "error",
        "Vui lòng nhập tên loại vé."
      );
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {
      showNotification(
        "error",
        "Giá vé không hợp lệ."
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      status: form.status,
    };

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Không thể lưu loại vé.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.title ||
            message;
        } catch {
          // Không có JSON lỗi.
        }

        throw new Error(message);
      }

      await fetchTicketTypes();

      closeModal();

      showNotification(
        "success",
        editingId
          ? "Cập nhật loại vé thành công."
          : "Thêm loại vé thành công."
      );
    } catch (error) {
      console.error("Lỗi lưu loại vé:", error);

      showNotification(
        "error",
        error.message ||
          "Không thể lưu loại vé."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const id = getId(item);
    const name = getName(item);

    if (!id) {
      showNotification(
        "error",
        "Không xác định được loại vé cần xóa."
      );
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa loại vé "${name}" không?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let message = "Không thể xóa loại vé.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.title ||
            message;
        } catch {
          // Không có JSON lỗi.
        }

        throw new Error(message);
      }

      await fetchTicketTypes();

      showNotification(
        "success",
        `Đã xóa loại vé "${name}".`
      );
    } catch (error) {
      console.error("Lỗi xóa loại vé:", error);

      showNotification(
        "error",
        error.message ||
          "Không thể xóa loại vé."
      );
    }
  };

  return (
    <div className="ticket-type-admin">
      {notification.show && (
        <NotificationPopup
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <div className="ticket-type-header">
        <div className="ticket-type-title-row">
          <FaTags />

          <div>
            <h1>Quản lý loại vé</h1>

            <p>
              Quản lý danh sách các loại vé trong hệ thống
            </p>
          </div>
        </div>

        <button
          type="button"
          className="ticket-type-add-btn"
          onClick={openAddModal}
        >
          <FaPlus />
          Thêm loại vé
        </button>
      </div>

      <div className="ticket-type-stat-grid">
        <div className="ticket-type-stat-card">
          <div className="ticket-type-stat-icon purple">
            <FaTags />
          </div>

          <div>
            <span>Tổng loại vé</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="ticket-type-stat-card">
          <div className="ticket-type-stat-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>Đang hoạt động</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="ticket-type-stat-card">
          <div className="ticket-type-stat-icon orange">
            <FaPauseCircle />
          </div>

          <div>
            <span>Tạm ngưng</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

        <div className="ticket-type-stat-card">
          <div className="ticket-type-stat-icon blue">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Giá trung bình</span>
            <strong>
              {formatPrice(averagePrice)}
            </strong>
          </div>
        </div>
      </div>

      <div className="ticket-type-toolbar">
        <div className="ticket-type-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Tìm kiếm loại vé..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="ticket-type-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            Tất cả trạng thái
          </option>

          <option value="active">
            Đang hoạt động
          </option>

          <option value="inactive">
            Tạm ngưng
          </option>
        </select>

        <div className="ticket-type-count">
          Hiển thị {filteredTicketTypes.length} /{" "}
          {totalCount} loại vé
        </div>
      </div>

      <div className="ticket-type-table-card">
        <div className="ticket-type-table-header">
          <div>
            <h2>Danh sách loại vé</h2>

            <p>
              Các loại vé đang được quản lý trong hệ thống
            </p>
          </div>
        </div>

        <div className="ticket-type-table-wrapper">
          <table className="ticket-type-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên loại vé</th>
                <th>Mô tả</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="ticket-type-empty"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredTicketTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="ticket-type-empty"
                  >
                    <FaTicketAlt />

                    <span>
                      Không có loại vé nào.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredTicketTypes.map(
                  (item, index) => (
                    <tr key={getId(item) || index}>
                      <td>
                        <span className="ticket-type-id">
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <div className="ticket-type-name-cell">
                          <div className="ticket-type-mini-icon">
                            <FaTicketAlt />
                          </div>

                          <strong>
                            {getName(item)}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="ticket-type-description">
                          {getDescription(item) ||
                            "Không có mô tả"}
                        </span>
                      </td>

                      <td>
                        <strong className="ticket-type-price">
                          {formatPrice(
                            getPrice(item)
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`ticket-type-status ${
                            isActive(
                              getStatus(item)
                            )
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {formatStatus(
                            getStatus(item)
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="ticket-type-actions">
                          <button
                            type="button"
                            className="ticket-type-action edit"
                            title="Sửa"
                            onClick={() =>
                              openEditModal(item)
                            }
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="ticket-type-action delete"
                            title="Xóa"
                            onClick={() =>
                              handleDelete(item)
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="ticket-type-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="ticket-type-modal">
            <div className="ticket-type-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Sửa loại vé"
                    : "Thêm loại vé"}
                </h2>

                <p>
                  Nhập thông tin loại vé
                </p>
              </div>

              <button
                type="button"
                className="ticket-type-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <FaTimes />
              </button>
            </div>

            <form
              className="ticket-type-form"
              onSubmit={handleSubmit}
            >
              <div className="ticket-type-form-group">
                <label>
                  Tên loại vé
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Vé người lớn"
                  disabled={saving}
                />
              </div>

              <div className="ticket-type-form-group">
                <label>Mô tả</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Mô tả loại vé..."
                  rows="4"
                  disabled={saving}
                />
              </div>

              <div className="ticket-type-form-row">
                <div className="ticket-type-form-group">
                  <label>
                    Giá vé
                    <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="75000"
                    min="0"
                    step="1000"
                    disabled={saving}
                  />
                </div>

                <div className="ticket-type-form-group">
                  <label>Trạng thái</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Active">
                      Đang hoạt động
                    </option>

                    <option value="Inactive">
                      Tạm ngưng
                    </option>
                  </select>
                </div>
              </div>

              <div className="ticket-type-form-actions">
                <button
                  type="button"
                  className="ticket-type-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="ticket-type-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId
                    ? "Cập nhật"
                    : "Thêm loại vé"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketTypeAdmin;