import { useEffect, useState } from "react";
import {
  FaFilm,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaGlassWhiskey,
  FaTint,
  FaCookieBite,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import NotificationPopup from "../components/NotificationPopup";

import "./Food.css";

// =====================================================
// API
// =====================================================

const API_URL = "http://localhost:5000/api/foods";

// =====================================================
// LẤY ẢNH TRONG SRC/ASSETS
// =====================================================

const assets = import.meta.glob("../assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

const getAsset = (fileName) => {
  if (!fileName) {
    return "";
  }

  const target = fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "");

  const found = Object.entries(assets).find(([path]) => {
    const currentName = path
      .split("/")
      .pop()
      .toLowerCase()
      .replace(/\.[^/.]+$/, "");

    return (
      currentName === target ||
      currentName.includes(target) ||
      target.includes(currentName)
    );
  });

  return found ? found[1] : "";
};

// =====================================================
// XỬ LÝ ẢNH
// =====================================================

const resolveImage = (imageUrl) => {
  if (!imageUrl) {
    return "";
  }

  const value = imageUrl.trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return getAsset(value);
};

// =====================================================
// DANH SÁCH RẠP
// =====================================================

const cinemas = [
  "CinemaPass Nguyễn Du",
  "CinemaPass Landmark 81",
  "CinemaPass Cộng Hòa",
  "CinemaPass Phạm Ngọc Thạch",
  "CinemaPass Thủ Đức",
];

// =====================================================
// CHUYỂN DANH MỤC SQL → DANH MỤC GIAO DIỆN
// =====================================================

const convertCategory = (category) => {
  const value = (category || "")
    .toLowerCase()
    .trim();

  if (
    value === "combo" ||
    value === "bắp nước"
  ) {
    return "combo";
  }

  if (value === "bắp") {
    return "bap";
  }

  if (value === "nước") {
    return "nuoc";
  }

  if (
    value === "nước suối" ||
    value === "nuocsuoi"
  ) {
    return "nuocsuoi";
  }

  if (
    value === "nước trái cây" ||
    value === "nuoctraicay"
  ) {
    return "nuoctraicay";
  }

  if (value === "snack") {
    return "snack";
  }

  return "combo";
};

// =====================================================
// FORMAT GIÁ
// =====================================================

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString("vi-VN") + "đ";
};

// =====================================================
// PRODUCT CARD
// =====================================================

function ProductCard({
  product,
  quantity,
  increase,
  decrease,
  addToCart,
}) {
  return (
    <div className="product-card">
      {product.badge && (
        <span className="product-badge">
          {product.badge}
        </span>
      )}

      <div className="product-image-wrapper">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="image-error">
            Không tìm thấy ảnh
          </div>
        )}
      </div>

      <div className="product-content">
        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description ||
            "Sản phẩm bắp nước tại CinemaPass"}
        </p>

        <div className="product-bottom">
          <div className="product-price">
            {formatPrice(product.price)}
          </div>

          <div className="quantity-control">
            <button
              type="button"
              onClick={() =>
                decrease(product.id)
              }
              aria-label={`Giảm ${product.name}`}
            >
              <FaMinus />
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={() =>
                increase(product.id)
              }
              aria-label={`Tăng ${product.name}`}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="add-cart-btn"
          onClick={() =>
            addToCart(product.id)
          }
        >
          <FaShoppingCart />
          THÊM VÀO GIỎ
        </button>
      </div>
    </div>
  );
}

// =====================================================
// FOOD
// =====================================================

function Food() {
  const [selectedCinema, setSelectedCinema] =
    useState("");

  const [products, setProducts] = useState([]);

  const [quantities, setQuantities] =
    useState({});

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notification, setNotification] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showNotification = (type, title, message) => {
    setNotification({ show: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification((current) => ({ ...current, show: false }));
  };

  // ===================================================
  // LOAD SẢN PHẨM TỪ DATABASE
  // ===================================================

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

      const convertedProducts = data
        .filter(
          (food) =>
            food.status !== "Ngừng bán"
        )
        .map((food) => ({
          id: food.foodId,
          name: food.name,
          description:
            food.description ||
            "Sản phẩm bắp nước tại CinemaPass",
          price: Number(food.price || 0),
          image: resolveImage(
            food.imageUrl
          ),
          badge: "",
          category: convertCategory(
            food.category
          ),
        }));

      setProducts(convertedProducts);
    } catch (error) {
      console.error(
        "Lỗi lấy sản phẩm bắp nước:",
        error
      );

      setError(
        "Không thể tải danh sách bắp nước từ hệ thống."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD LẦN ĐẦU
  // ===================================================

  useEffect(() => {
    loadFoods();
  }, []);

  // ===================================================
  // TĂNG SỐ LƯỢNG
  // ===================================================

  const increase = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  // ===================================================
  // THÊM VÀO GIỎ
  // ===================================================

  const addToCart = (id) => {
    setQuantities((prev) => {
      if ((prev[id] || 0) > 0) {
        return prev;
      }

      return {
        ...prev,
        [id]: 1,
      };
    });
  };

  // ===================================================
  // GIẢM SỐ LƯỢNG
  // ===================================================

  const decrease = (id) => {
    setQuantities((prev) => {
      const result = { ...prev };

      const current =
        result[id] || 0;

      if (current <= 1) {
        delete result[id];
      } else {
        result[id] =
          current - 1;
      }

      return result;
    });
  };

  // ===================================================
  // XÓA SẢN PHẨM KHỎI GIỎ
  // ===================================================

  const removeFromCart = (id) => {
    setQuantities((prev) => {
      const result = { ...prev };

      delete result[id];

      return result;
    });
  };

  // ===================================================
  // XÓA TOÀN BỘ GIỎ
  // ===================================================

  const clearCart = () => {
    setQuantities({});
  };

  // ===================================================
  // TỔNG SẢN PHẨM
  // ===================================================

  const totalItems =
    Object.values(quantities).reduce(
      (sum, quantity) =>
        sum + quantity,
      0
    );

  // ===================================================
  // TỔNG TIỀN
  // ===================================================

  const totalPrice =
    products.reduce(
      (sum, product) =>
        sum +
        product.price *
          (quantities[
            product.id
          ] || 0),
      0
    );

  // ===================================================
  // SẢN PHẨM TRONG GIỎ
  // ===================================================

  const cartItems =
    products.filter(
      (product) =>
        (quantities[
          product.id
        ] || 0) > 0
    );

  // ===================================================
  // ĐẶT HÀNG
  // ===================================================

  const handleOrder = () => {
    if (!selectedCinema) {
      showNotification(
        "warning",
        "Chưa chọn rạp",
        "Vui lòng chọn rạp trước khi đặt hàng."
      );

      return;
    }

    if (totalItems === 0) {
      showNotification(
        "warning",
        "Giỏ hàng trống",
        "Vui lòng chọn ít nhất một sản phẩm."
      );

      return;
    }

    showNotification(
      "success",
      "Đặt hàng thành công",
      `Rạp: ${selectedCinema} | Số sản phẩm: ${totalItems} | Tổng tiền: ${formatPrice(totalPrice)}`
    );
  };

  // ===================================================
  // PHÂN LOẠI
  // ===================================================

  const combos =
    products.filter(
      (product) =>
        product.category ===
        "combo"
    );

  const baps =
    products.filter(
      (product) =>
        product.category ===
        "bap"
    );

  const drinks =
    products.filter(
      (product) =>
        product.category ===
        "nuoc"
    );

  const waters =
    products.filter(
      (product) =>
        product.category ===
        "nuocsuoi"
    );

  const fruitDrinks =
    products.filter(
      (product) =>
        product.category ===
        "nuoctraicay"
    );

  const snacks =
    products.filter(
      (product) =>
        product.category ===
        "snack"
    );

  // ===================================================
  // GIAO DIỆN
  // ===================================================

  return (
    <main className="food-page">
      {/* ICON GIỎ HÀNG NỔI */}

      <button
        type="button"
        className="floating-cart-btn"
        onClick={() =>
          setIsCartOpen(true)
        }
        aria-label="Mở giỏ hàng"
      >
        <FaShoppingCart />

        {totalItems > 0 && (
          <span className="cart-count">
            {totalItems}
          </span>
        )}
      </button>

      {/* CHỌN RẠP */}

      <section className="cinema-selector">
        <div className="selector-icon">
          <FaFilm />
        </div>

        <div className="selector-info">
          <h2>CHỌN RẠP</h2>

          <p>
            Vui lòng chọn rạp để xem
            danh sách bắp nước
          </p>
        </div>

        <div className="select-wrapper">
          <FaMapMarkerAlt className="select-location-icon" />

          <select
            value={selectedCinema}
            onChange={(e) =>
              setSelectedCinema(
                e.target.value
              )
            }
          >
            <option value="">
              Chọn rạp
            </option>

            {cinemas.map(
              (cinema) => (
                <option
                  key={cinema}
                  value={cinema}
                >
                  {cinema}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {/* SẢN PHẨM */}

      <section className="products-section">
        {!selectedCinema ? (
          <div className="choose-cinema-message">
            <div className="choose-cinema-icon">
              🍿
            </div>

            <h3>
              VUI LÒNG CHỌN RẠP
            </h3>

            <p>
              Chọn rạp ở phía trên để
              xem các sản phẩm bắp nước.
            </p>
          </div>
        ) : loading ? (
          <div className="choose-cinema-message">
            <div className="choose-cinema-icon">
              🍿
            </div>

            <h3>
              ĐANG TẢI SẢN PHẨM
            </h3>

            <p>
              Đang lấy danh sách bắp
              nước từ hệ thống...
            </p>
          </div>
        ) : error ? (
          <div className="choose-cinema-message">
            <div className="choose-cinema-icon">
              ⚠️
            </div>

            <h3>
              KHÔNG TẢI ĐƯỢC SẢN PHẨM
            </h3>

            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* COMBO */}

            {combos.length > 0 && (
              <div className="food-category first-category">
                <div className="category-title">
                  <span>🍿</span>

                  <div>
                    <h2>
                      COMBO BẮP NƯỚC
                    </h2>

                    <p>
                      Combo ngon - Giá tốt
                      - Xem phim thêm vui!
                    </p>
                  </div>
                </div>

                <div className="products-grid combo-grid">
                  {combos.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* BẮP */}

            {baps.length > 0 && (
              <div className="food-category">
                <div className="category-title">
                  <span>🍿</span>

                  <div>
                    <h2>BẮP</h2>

                    <p>
                      Bắp rang thơm ngon
                    </p>
                  </div>
                </div>

                <div className="products-grid">
                  {baps.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* NƯỚC NGỌT */}

            {drinks.length > 0 && (
              <div className="food-category">
                <div className="category-title">
                  <span>
                    <FaGlassWhiskey />
                  </span>

                  <div>
                    <h2>
                      NƯỚC NGỌT
                    </h2>

                    <p>
                      Nước uống mát lạnh
                    </p>
                  </div>
                </div>

                <div className="products-grid">
                  {drinks.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* NƯỚC SUỐI */}

            {waters.length > 0 && (
              <div className="food-category">
                <div className="category-title">
                  <span>
                    <FaTint />
                  </span>

                  <div>
                    <h2>
                      NƯỚC SUỐI
                    </h2>

                    <p>
                      Giải khát nhẹ nhàng
                    </p>
                  </div>
                </div>

                <div className="products-grid">
                  {waters.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* NƯỚC TRÁI CÂY */}

            {fruitDrinks.length > 0 && (
              <div className="food-category">
                <div className="category-title">
                  <span>🧃</span>

                  <div>
                    <h2>
                      NƯỚC TRÁI CÂY
                    </h2>

                    <p>
                      Nước trái cây thơm ngon
                    </p>
                  </div>
                </div>

                <div className="products-grid">
                  {fruitDrinks.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* SNACK */}

            {snacks.length > 0 && (
              <div className="food-category">
                <div className="category-title">
                  <span>
                    <FaCookieBite />
                  </span>

                  <div>
                    <h2>SNACK</h2>

                    <p>
                      Đồ ăn nhẹ khi xem phim
                    </p>
                  </div>
                </div>

                <div className="products-grid">
                  {snacks.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={
                          quantities[
                            product.id
                          ] || 0
                        }
                        increase={increase}
                        decrease={decrease}
                        addToCart={
                          addToCart
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* KHÔNG CÓ SẢN PHẨM */}

            {products.length === 0 && (
              <div className="choose-cinema-message">
                <div className="choose-cinema-icon">
                  🍿
                </div>

                <h3>
                  CHƯA CÓ SẢN PHẨM
                </h3>

                <p>
                  Hãy thêm sản phẩm trong
                  trang quản trị bắp nước.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* THANH TỔNG TIỀN */}

      <section className="cart-summary">
        <div className="cart-info">
          <FaShoppingCart />

          <div>
            <span>Tạm tính</span>

            <small>
              ({totalItems} sản phẩm)
            </small>
          </div>

          <strong>
            {formatPrice(totalPrice)}
          </strong>
        </div>

        <button
          type="button"
          className="order-btn"
          onClick={handleOrder}
        >
          <FaShoppingCart />
          ĐẶT HÀNG
        </button>
      </section>

      {/* CART DRAWER */}

      {isCartOpen && (
        <div
          className="cart-overlay"
          onClick={() =>
            setIsCartOpen(false)
          }
        >
          <aside
            className="cart-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="cart-drawer-header">
              <div>
                <h2>GIỎ HÀNG</h2>

                <span>
                  {totalItems} sản phẩm
                </span>
              </div>

              <button
                type="button"
                className="cart-close-btn"
                onClick={() =>
                  setIsCartOpen(false)
                }
                aria-label="Đóng giỏ hàng"
              >
                <FaTimes />
              </button>
            </div>

            {/* BODY */}

            <div className="cart-drawer-body">
              {cartItems.length ===
              0 ? (
                <div className="empty-cart">
                  <FaShoppingCart />

                  <h3>
                    Giỏ hàng đang trống
                  </h3>

                  <p>
                    Hãy chọn món ăn hoặc
                    nước uống để thêm vào
                    giỏ hàng.
                  </p>
                </div>
              ) : (
                cartItems.map(
                  (product) => {
                    const quantity =
                      quantities[
                        product.id
                      ] || 0;

                    return (
                      <div
                        className="cart-item"
                        key={product.id}
                      >
                        <div className="cart-item-image">
                          {product.image && (
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                            />
                          )}
                        </div>

                        <div className="cart-item-info">
                          <h3>
                            {
                              product.name
                            }
                          </h3>

                          <p>
                            {formatPrice(
                              product.price
                            )}
                          </p>

                          <div className="cart-item-bottom">
                            <div className="cart-quantity">
                              <button
                                type="button"
                                onClick={() =>
                                  decrease(
                                    product.id
                                  )
                                }
                              >
                                <FaMinus />
                              </button>

                              <span>
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increase(
                                    product.id
                                  )
                                }
                              >
                                <FaPlus />
                              </button>
                            </div>

                            <strong>
                              {formatPrice(
                                product.price *
                                  quantity
                              )}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="remove-cart-item"
                          onClick={() =>
                            removeFromCart(
                              product.id
                            )
                          }
                          aria-label={`Xóa ${product.name}`}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {/* FOOTER */}

            <div className="cart-drawer-footer">
              {cartItems.length >
                0 && (
                <button
                  type="button"
                  className="clear-cart-btn"
                  onClick={
                    clearCart
                  }
                >
                  XÓA TẤT CẢ
                </button>
              )}

              <div className="cart-total-row">
                <span>
                  Tổng cộng
                </span>

                <strong>
                  {formatPrice(
                    totalPrice
                  )}
                </strong>
              </div>

              <button
                type="button"
                className="order-btn"
                onClick={
                  handleOrder
                }
              >
                <FaShoppingCart />
                ĐẶT HÀNG
              </button>
            </div>
          </aside>
        </div>
      )}
      <NotificationPopup
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />
    </main>
  );
}
 
export default Food;