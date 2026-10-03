import { useEffect, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaUtensils,
} from "react-icons/fa";

import "./FoodAdmin.css";
import NotificationPopup from "../../components/NotificationPopup";

const API_URL = "http://localhost:5000/api/foods";

/* =====================================================
   LẤY DANH SÁCH ẢNH TRONG SRC/ASSETS
===================================================== */

const imageAssets = import.meta.glob(
  "../../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

/* =====================================================
   CHUYỂN TÊN FILE THÀNH URL ẢNH
===================================================== */

const getImageUrl = (fileName) => {
  if (!fileName) {
    return "";
  }

  // Nếu là URL online thì giữ nguyên
  if (
    fileName.startsWith("http://") ||
    fileName.startsWith("https://")
  ) {
    return fileName;
  }

  const target = fileName
    .split("/")
    .pop()
    .toLowerCase();

  const found = Object.entries(imageAssets).find(
    ([path]) => {
      const currentName = path
        .split("/")
        .pop()
        .toLowerCase();

      return currentName === target;
    }
  );

  return found ? found[1] : "";
};

/* =====================================================
   LẤY TÊN FILE ẢNH
===================================================== */

const getImageFileName = (path) => {
  return path
    .split("/")
    .pop();
};

/* =====================================================
   DANH SÁCH ẢNH
===================================================== */

const availableImages = Object.entries(imageAssets)
  .map(([path, url]) => ({
    name: getImageFileName(path),
    url,
  }))
  .sort((a, b) =>
    a.name.localeCompare(b.name)
  );

/* =====================================================
   COMPONENT
===================================================== */

function FoodAdmin() {
  const [foods, setFoods] = useState([]);
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

  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "Bắp nước",
    status: "Đang bán",
  });

  /* =====================================================
     LOAD FOODS
  ===================================================== */

  const loadFoods = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          "Không thể lấy danh sách bắp nước"
        );
      }

      const data = await response.json();

      setFoods(data);
    } catch (error) {
      console.error(
        "Lỗi lấy danh sách bắp nước:",
        error
      );

      setError(
        error.message ||
          "Không thể tải danh sách bắp nước"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "Bắp nước",
      status: "Đang bán",
    });

    setEditingFood(null);
  };

  /* =====================================================
     OPEN ADD
  ===================================================== */

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEditForm = (food) => {
    setEditingFood(food);

    setForm({
      name: food.name || "",
      description: food.description || "",
      price: food.price || "",
      imageUrl: food.imageUrl || "",
      category: food.category || "Bắp nước",
      status: food.status || "Đang bán",
    });

    setShowForm(true);
  };

  /* =====================================================
     CLOSE FORM
  ===================================================== */

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  /* =====================================================
     HANDLE CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =====================================================
     HANDLE SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showNotification("warning", "Thiếu thông tin", "Vui lòng nhập tên món");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      showNotification("warning", "Thông tin không hợp lệ", "Vui lòng nhập giá hợp lệ");
      return;
    }

    const foodData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim(),
      category: form.category,
      status: form.status,
    };

    try {
      const url = editingFood
        ? `${API_URL}/${editingFood.foodId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingFood ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(foodData),
      });

      if (!response.ok) {
        throw new Error(
          editingFood
            ? "Không thể cập nhật món"
            : "Không thể thêm món"
        );
      }

      showNotification(
        "success",
        "Thành công",
        editingFood
          ? "Cập nhật món thành công"
          : "Thêm món thành công"
      );

      closeForm();
      loadFoods();
    } catch (error) {
      console.error(
        "Lỗi lưu món:",
        error
      );

      showNotification(
        "error",
        "Không thể lưu món",
        error.message ||
          "Có lỗi xảy ra khi lưu món"
      );
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const deleteFood = async (foodId) => {
    try {
      const response = await fetch(
        `${API_URL}/${foodId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Không thể xóa món"
        );
      }

      setFoods((currentFoods) =>
        currentFoods.filter(
          (food) =>
            food.foodId !== foodId
        )
      );
      showNotification("success", "Thành công", "Xóa món thành công");
    } catch (error) {
      console.error(
        "Lỗi xóa món:",
        error
      );

      showNotification(
        "error",
        "Không thể xóa món",
        error.message ||
          "Không thể xóa món"
      );
    }
  };

  const requestDeleteFood = (foodId) => {
    showNotification(
      "warning",
      "Xác nhận xóa món",
      "Bạn có chắc muốn xóa món này không?",
      () => {
        closeNotification();
        void deleteFood(foodId);
      }
    );
  };

  /* =====================================================
     FORMAT PRICE
  ===================================================== */

  const formatPrice = (price) => {
    return (
      Number(price || 0).toLocaleString(
        "vi-VN"
      ) + " ₫"
    );
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredFoods = foods.filter(
    (food) => {
      const keyword = search
        .toLowerCase()
        .trim();

      if (!keyword) {
        return true;
      }

      return (
        food.name
          ?.toLowerCase()
          .includes(keyword) ||
        food.category
          ?.toLowerCase()
          .includes(keyword) ||
        food.status
          ?.toLowerCase()
          .includes(keyword)
      );
    }
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="food-admin">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="food-admin-header">

        <div>
          <h1>
            Quản lý bắp nước
          </h1>

          <p>
            Quản lý các sản phẩm bắp,
            nước và combo
          </p>
        </div>

        <div className="food-admin-actions">

          <button
            className="food-refresh-button"
            onClick={loadFoods}
            disabled={loading}
          >
            <FaSyncAlt
              className={
                loading
                  ? "food-refresh-icon spinning"
                  : "food-refresh-icon"
              }
            />

            Làm mới
          </button>

          <button
            className="food-add-button"
            onClick={openAddForm}
          >
            <FaPlus />

            Thêm món
          </button>

        </div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="food-toolbar">

        <div className="food-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Tìm tên món, danh mục, trạng thái..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="food-count">

          <FaUtensils />

          <span>
            {filteredFoods.length} món
          </span>

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="food-table-container">

        <table className="food-table">

          <thead>

            <tr>
              <th>STT</th>
              <th>Ảnh</th>
              <th>Tên món</th>
              <th>Mô tả</th>
              <th>Giá</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="8"
                  className="food-empty"
                >
                  Đang tải dữ liệu...
                </td>

              </tr>

            ) : error ? (

              <tr>

                <td
                  colSpan="8"
                  className="food-empty food-error"
                >
                  {error}
                </td>

              </tr>

            ) : filteredFoods.length > 0 ? (

              filteredFoods.map(
                (food, index) => (

                  <tr
                    key={food.foodId}
                  >

                    <td>
                      {index + 1}
                    </td>

                    {/* ẢNH */}

                    <td>

                      <div className="food-image">

                        {getImageUrl(
                          food.imageUrl
                        ) ? (

                          <img
                            src={getImageUrl(
                              food.imageUrl
                            )}
                            alt={food.name}
                          />

                        ) : (

                          <FaUtensils />

                        )}

                      </div>

                    </td>

                    {/* TÊN */}

                    <td>

                      <strong className="food-name">
                        {food.name}
                      </strong>

                    </td>

                    {/* MÔ TẢ */}

                    <td>

                      <span className="food-description">
                        {food.description ||
                          "Không có mô tả"}
                      </span>

                    </td>

                    {/* GIÁ */}

                    <td>

                      <strong className="food-price">
                        {formatPrice(
                          food.price
                        )}
                      </strong>

                    </td>

                    {/* DANH MỤC */}

                    <td>

                      <span className="food-category">
                        {food.category}
                      </span>

                    </td>

                    {/* TRẠNG THÁI */}

                    <td>

                      <span
                        className={`food-status ${
                          food.status ===
                          "Đang bán"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {food.status}
                      </span>

                    </td>

                    {/* THAO TÁC */}

                    <td>

                      <div className="food-actions">

                        <button
                          className="food-edit-button"
                          title="Sửa món"
                          onClick={() =>
                            openEditForm(
                              food
                            )
                          }
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="food-delete-button"
                          title="Xóa món"
                          onClick={() =>
                            requestDeleteFood(
                              food.foodId
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            ) : (

              <tr>

                <td
                  colSpan="8"
                  className="food-empty"
                >
                  Chưa có món bắp nước nào.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          FORM MODAL
      ================================================= */}

      {showForm && (

        <div
          className="food-form-overlay"
          onClick={closeForm}
        >

          <div
            className="food-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="food-form-header">

              <h2>
                {editingFood
                  ? "Chỉnh sửa món"
                  : "Thêm món mới"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
            >

              {/* TÊN */}

              <div className="food-form-group">

                <label>
                  Tên món
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên món"
                />

              </div>

              {/* MÔ TẢ */}

              <div className="food-form-group">

                <label>
                  Mô tả
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                  placeholder="Nhập mô tả món"
                  rows="3"
                />

              </div>

              {/* GIÁ + DANH MỤC */}

              <div className="food-form-row">

                <div className="food-form-group">

                  <label>
                    Giá
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Nhập giá"
                    min="0"
                  />

                </div>

                <div className="food-form-group">

                  <label>
                    Danh mục
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >

                    <option value="Bắp nước">
                      Bắp nước
                    </option>

                    <option value="Combo">
                      Combo
                    </option>

                    <option value="Bắp">
                      Bắp
                    </option>

                    <option value="Nước">
                      Nước
                    </option>

                    <option value="Nước suối">
                      Nước suối
                    </option>

                    <option value="Nước trái cây">
                      Nước trái cây
                    </option>

                    <option value="Snack">
                      Snack
                    </option>

                  </select>

                </div>

              </div>

              {/* =================================================
                  CHỌN ẢNH
              ================================================= */}

              <div className="food-form-group">

                <label>
                  Ảnh sản phẩm
                </label>

                <select
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                >

                  <option value="">
                    -- Chọn ảnh trong assets --
                  </option>

                  {availableImages.map(
                    (image) => (

                      <option
                        key={image.name}
                        value={image.name}
                      >
                        {image.name}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* =================================================
                  PREVIEW ẢNH
              ================================================= */}

              {form.imageUrl &&
                getImageUrl(
                  form.imageUrl
                ) && (

                  <div
                    style={{
                      marginTop: "-8px",
                      marginBottom: "18px",
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#172238",
                      border:
                        "1px solid #2b3950",
                    }}
                  >

                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      Xem trước ảnh
                    </div>

                    <img
                      src={getImageUrl(
                        form.imageUrl
                      )}
                      alt="Preview"
                      style={{
                        width: "140px",
                        height: "100px",
                        objectFit: "contain",
                        display: "block",
                        borderRadius: "6px",
                        background: "#0d1b38",
                      }}
                    />

                  </div>

                )}

              {/* TRẠNG THÁI */}

              <div className="food-form-group">

                <label>
                  Trạng thái
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >

                  <option value="Đang bán">
                    Đang bán
                  </option>

                  <option value="Ngừng bán">
                    Ngừng bán
                  </option>

                </select>

              </div>

              {/* FOOTER */}

              <div className="food-form-footer">

                <button
                  type="button"
                  className="food-cancel-button"
                  onClick={closeForm}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="food-save-button"
                >
                  {editingFood
                    ? "Lưu thay đổi"
                    : "Thêm món"}
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

export default FoodAdmin;