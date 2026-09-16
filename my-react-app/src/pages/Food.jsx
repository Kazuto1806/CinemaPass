import { useState } from "react";
import {
  FaFilm,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaGlassWhiskey,
  FaTint,
  FaCookieBite,
} from "react-icons/fa";

import "./Food.css";

// =====================================================
// LẤY ẢNH TRONG SRC/ASSETS
// =====================================================

const assets = import.meta.glob("../assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

const getAsset = (fileName) => {
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
// 14 SẢN PHẨM
// =====================================================

const products = [

  // =========================
  // COMBO
  // =========================

  {
    id: 1,
    name: "Combo Cờ Gấu",
    description:
      "1 Bắp lớn + 2 Coke 22oz + 2 Bắp nhỏ + Snack",
    price: 174000,
    image: getAsset("Combo_cogau.jpg"),
    badge: "BEST SELLER",
    category: "combo",
  },

  {
    id: 2,
    name: "Combo Gấu",
    description:
      "1 Bắp lớn + 2 Coke 22oz hoặc 2 nước bất kỳ",
    price: 134000,
    image: getAsset("Combo_gau.jpg"),
    badge: "",
    category: "combo",
  },

  {
    id: 3,
    name: "Combo Gia Đình Gấu",
    description:
      "Combo bắp nước dành cho nhóm và gia đình",
    price: 300000,
    image: getAsset("Combo_giadinhgau.jpg"),
    badge: "MỚI",
    category: "combo",
  },


  // =========================
  // BẮP
  // =========================

  {
    id: 4,
    name: "Bắp Phô Mai Caramel",
    description:
      "Bắp rang 2 ngăn vị phô mai và caramel",
    price: 65000,
    image: getAsset(
      "B_P_2_NG_N_V_PH_MAI_CARAMEL"
    ),
    badge: "",
    category: "bap",
  },


  // =========================
  // NƯỚC NGỌT
  // =========================

  {
    id: 5,
    name: "Coca-Cola",
    description:
      "Coca-Cola lon 320ml",
    price: 20000,
    image: getAsset("coca.png"),
    badge: "",
    category: "nuoc",
  },

  {
    id: 6,
    name: "Coca-Cola Zero",
    description:
      "Coca-Cola Zero lon 320ml",
    price: 20000,
    image: getAsset("COKE-ZERO.png"),
    badge: "",
    category: "nuoc",
  },

  {
    id: 7,
    name: "Fanta",
    description:
      "Fanta cam mát lạnh",
    price: 20000,
    image: getAsset("fanta.jpg"),
    badge: "",
    category: "nuoc",
  },

  {
    id: 8,
    name: "Sprite",
    description:
      "Sprite lon 320ml",
    price: 20000,
    image: getAsset("sprite.png"),
    badge: "",
    category: "nuoc",
  },


  // =========================
  // NƯỚC SUỐI
  // =========================

  {
    id: 9,
    name: "Dasani",
    description:
      "Nước suối Dasani",
    price: 15000,
    image: getAsset("dasani.png"),
    badge: "",
    category: "nuocsuoi",
  },


  // =========================
  // NƯỚC TRÁI CÂY
  // =========================

  {
    id: 10,
    name: "Teppy",
    description:
      "Nước cam Teppy",
    price: 25000,
    image: getAsset("TEPPY.png"),
    badge: "",
    category: "nuoctraicay",
  },

  {
    id: 11,
    name: "Nutriboost",
    description:
      "Nước trái cây Nutriboost",
    price: 25000,
    image: getAsset("NUTRI.png"),
    badge: "",
    category: "nuoctraicay",
  },


  // =========================
  // SNACK
  // =========================

  {
    id: 12,
    name: "Lay's Khoai Tây",
    description:
      "Snack khoai tây Lay's",
    price: 35000,
    image: getAsset("lays-khoai-tay.png"),
    badge: "",
    category: "snack",
  },

  {
    id: 13,
    name: "Lay's Vị Bò",
    description:
      "Snack khoai tây vị bò",
    price: 25000,

    // TÌM ẢNH LAY'S VỊ BÒ
    image: getAsset("lays-vi-bo_1.png"),

    badge: "",
    category: "snack",
  },

  {
    id: 14,
    name: "Lay's Stax",
    description:
      "Snack khoai tây Lay's Stax",
    price: 45000,
    image: getAsset("laystax.png"),
    badge: "",
    category: "snack",
  },
];


// =====================================================
// FORMAT GIÁ
// =====================================================

const formatPrice = (price) => {
  return price.toLocaleString("vi-VN") + "đ";
};


// =====================================================
// PRODUCT CARD
// =====================================================

function ProductCard({
  product,
  quantity,
  increase,
  decrease,
}) {
  return (
    <div className="product-card">

      {product.badge && (
        <span className="product-badge">
          {product.badge}
        </span>
      )}

      {/* =========================
          ẢNH SẢN PHẨM
      ========================= */}

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


      {/* =========================
          THÔNG TIN
      ========================= */}

      <div className="product-content">

        <h3>
          {product.name}
        </h3>

        <p className="product-description">
          {product.description}
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
            >
              <FaMinus />
            </button>

            <span>
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                increase(product.id)
              }
            >
              <FaPlus />
            </button>

          </div>

        </div>


        <button
          type="button"
          className="add-cart-btn"
          onClick={() =>
            increase(product.id)
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

  const [quantities, setQuantities] =
    useState({});


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
  // GIẢM SỐ LƯỢNG
  // ===================================================

  const decrease = (id) => {

    setQuantities((prev) => {

      const result = {
        ...prev,
      };

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
          (quantities[product.id] || 0),
      0
    );


  // ===================================================
  // ĐẶT HÀNG
  // ===================================================

  const handleOrder = () => {

    if (!selectedCinema) {

      alert(
        "Vui lòng chọn rạp trước khi đặt hàng."
      );

      return;
    }


    if (totalItems === 0) {

      alert(
        "Vui lòng chọn ít nhất một sản phẩm."
      );

      return;
    }


    alert(
      `Đặt hàng thành công!\n\n` +
      `Rạp: ${selectedCinema}\n` +
      `Số sản phẩm: ${totalItems}\n` +
      `Tổng tiền: ${formatPrice(totalPrice)}`
    );

  };


  // ===================================================
  // PHÂN LOẠI
  // ===================================================

  const combos =
    products.filter(
      (product) =>
        product.category === "combo"
    );

  const baps =
    products.filter(
      (product) =>
        product.category === "bap"
    );

  const drinks =
    products.filter(
      (product) =>
        product.category === "nuoc"
    );

  const waters =
    products.filter(
      (product) =>
        product.category === "nuocsuoi"
    );

  const fruitDrinks =
    products.filter(
      (product) =>
        product.category === "nuoctraicay"
    );

  const snacks =
    products.filter(
      (product) =>
        product.category === "snack"
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <main className="food-page">

      {/* =================================================
          CHỌN RẠP
      ================================================= */}

      <section className="cinema-selector">

        <div className="selector-icon">
          <FaFilm />
        </div>


        <div className="selector-info">

          <h2>
            CHỌN RẠP
          </h2>

          <p>
            Vui lòng chọn rạp để xem
            danh sách bắp nước
          </p>

        </div>


        <div className="select-wrapper">

          <FaMapMarkerAlt
            className="select-location-icon"
          />


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


            {cinemas.map((cinema) => (

              <option
                key={cinema}
                value={cinema}
              >
                {cinema}
              </option>

            ))}

          </select>

        </div>

      </section>


      {/* =================================================
          SẢN PHẨM
      ================================================= */}

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

        ) : (

          <>

            {/* =================================================
                COMBO
            ================================================= */}

            <div className="food-category first-category">

              <div className="category-title">

                <span>
                  🍿
                </span>


                <div>

                  <h2>
                    COMBO BẮP NƯỚC
                  </h2>

                  <p>
                    Combo ngon - Giá tốt -
                    Xem phim thêm vui!
                  </p>

                </div>

              </div>


              <div className="products-grid combo-grid">

                {combos.map((product) => (

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
                  />

                ))}

              </div>

            </div>


            {/* =================================================
                BẮP
            ================================================= */}

            <div className="food-category">

              <div className="category-title">

                <span>
                  🍿
                </span>


                <div>

                  <h2>
                    BẮP
                  </h2>

                  <p>
                    Bắp rang thơm ngon
                  </p>

                </div>

              </div>


              <div className="products-grid">

                {baps.map((product) => (

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
                  />

                ))}

              </div>

            </div>


            {/* =================================================
                NƯỚC NGỌT
            ================================================= */}

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

                {drinks.map((product) => (

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
                  />

                ))}

              </div>

            </div>


            {/* =================================================
                NƯỚC SUỐI
            ================================================= */}

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

                {waters.map((product) => (

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
                  />

                ))}

              </div>

            </div>


            {/* =================================================
                NƯỚC TRÁI CÂY
            ================================================= */}

            <div className="food-category">

              <div className="category-title">

                <span>
                  🧃
                </span>


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

                {fruitDrinks.map((product) => (

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
                  />

                ))}

              </div>

            </div>


            {/* =================================================
                SNACK
            ================================================= */}

            <div className="food-category">

              <div className="category-title">

                <span>
                  <FaCookieBite />
                </span>


                <div>

                  <h2>
                    SNACK
                  </h2>

                  <p>
                    Đồ ăn nhẹ khi xem phim
                  </p>

                </div>

              </div>


              <div className="products-grid">

                {snacks.map((product) => (

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
                  />

                ))}

              </div>

            </div>

          </>

        )}

      </section>


      {/* =================================================
          GIỎ HÀNG
      ================================================= */}

      <section className="cart-summary">

        <div className="cart-info">

          <FaShoppingCart />


          <div>

            <span>
              Tạm tính
            </span>

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

    </main>
  );
}

export default Food;