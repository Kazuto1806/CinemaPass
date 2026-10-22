
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCrown,
  FaGift,
  FaHistory,
  FaTicketAlt,
  FaStar,
  FaUserCircle,
  FaShieldAlt,
} from "react-icons/fa";

import { API_BASE } from "../constants";
import "./Membership.css";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN");
};

const formatPoints = (value) =>
  Number(value || 0).toLocaleString("vi-VN");

function Membership() {
  const navigate = useNavigate();

  const [userName] = useState(
    localStorage.getItem("userName") || "Thành viên"
  );

  const [userId] = useState(
    Number(localStorage.getItem("userId")) || 0
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chưa tự tạo điểm. Các giá trị này chỉ được cập nhật
  // khi backend trả về dữ liệu thành viên hợp lệ.
  const [membership, setMembership] = useState({
    tier: "Member",
    points: 0,
    nextTier: "Silver",
    nextTierPoints: 1000,
    history: [],
  });

  useEffect(() => {
    let cancelled = false;

    const loadMembership = async () => {
      if (!userId) {
        setError(
          "Không tìm thấy mã tài khoản. Vui lòng đăng nhập lại để xem thông tin thành viên."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * Chưa gọi API thành viên ở đây vì cần backend cung cấp
         * endpoint và quy tắc tính điểm chính thức.
         *
         * Không lấy điểm từ localStorage và không tự cộng điểm.
         * Khi có API, thay phần này bằng dữ liệu thực từ backend.
         */
        if (!cancelled) {
          setMembership({
            tier: "Member",
            points: 0,
            nextTier: "Silver",
            nextTierPoints: 1000,
            history: [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Không thể tải dữ liệu thành viên."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMembership();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const progress = Math.min(
    100,
    Math.max(
      0,
      (membership.points / membership.nextTierPoints) * 100
    )
  );

  return (
    <main className="membership-page">
      <div className="membership-container">
        <button
          type="button"
          className="membership-back"
          onClick={() => navigate("/account")}
        >
          <FaArrowLeft />
          <span>Quay lại tài khoản</span>
        </button>

        <header className="membership-heading">
          <span className="membership-eyebrow">
            CINEMAPASS REWARDS
          </span>

          <h1>Thành viên CinemaPass</h1>

          <p>
            Mỗi trải nghiệm điện ảnh là một hành trình đáng nhớ.
            Theo dõi hạng thành viên và quyền lợi của bạn tại đây.
          </p>
        </header>

        <section className="membership-card">
          <div className="membership-card-top">
            <div className="membership-brand">
              <div className="membership-brand-icon">
                <FaCrown />
              </div>

              <div>
                <strong>CINEMAPASS</strong>
                <span>MEMBERSHIP CARD</span>
              </div>
            </div>

            <span className="membership-card-label">
              MEMBER CARD
            </span>
          </div>

          <div className="membership-card-main">
            <div className="membership-avatar">
              <FaUserCircle />
            </div>

            <div className="membership-member-info">
              <span>THÀNH VIÊN</span>
              <h2>{userName}</h2>
              <div className="membership-tier">
                <FaCrown />
                <span>{membership.tier}</span>
              </div>
            </div>
          </div>

          <div className="membership-card-bottom">
            <div>
              <span>ĐIỂM TÍCH LŨY</span>
              <strong>{formatPoints(membership.points)}</strong>
            </div>

            <div className="membership-card-symbol">
              <FaStar />
              <FaStar />
              <FaStar />
            </div>
          </div>
        </section>

        {error && (
          <div className="membership-message membership-error">
            <FaShieldAlt />
            <p>{error}</p>
          </div>
        )}

        <section className="membership-progress-panel">
          <div className="membership-section-heading">
            <div className="membership-section-icon">
              <FaCrown />
            </div>

            <div>
              <h2>Hạng thành viên</h2>
              <p>Theo dõi tiến trình nâng hạng của bạn</p>
            </div>
          </div>

          {loading ? (
            <p className="membership-empty">
              Đang tải thông tin thành viên...
            </p>
          ) : (
            <>
              <div className="membership-progress-labels">
                <div>
                  <span>Hạng hiện tại</span>
                  <strong>{membership.tier}</strong>
                </div>

                <div className="membership-next-tier">
                  <span>Hạng tiếp theo</span>
                  <strong>{membership.nextTier}</strong>
                </div>
              </div>

              <div
                className="membership-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Tiến trình lên hạng"
              >
                <div
                  className="membership-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="membership-progress-note">
                {membership.points >= membership.nextTierPoints
                  ? "Bạn đã đạt mốc điểm tham khảo."
                  : `Mốc tham khảo tiếp theo: ${formatPoints(
                      membership.nextTierPoints
                    )} điểm.`}
              </p>

              <p className="membership-disclaimer">
                Mốc điểm trên hiện là thông tin giao diện minh họa,
                chưa phải quy tắc xếp hạng chính thức của hệ thống.
              </p>
            </>
          )}
        </section>

        <section className="membership-benefits">
          <div className="membership-section-heading">
            <div className="membership-section-icon">
              <FaGift />
            </div>

            <div>
              <h2>Quyền lợi thành viên</h2>
              <p>Các quyền lợi dự kiến của chương trình</p>
            </div>
          </div>

          <div className="membership-benefit-grid">
            <article className="membership-benefit">
              <div className="membership-benefit-icon">
                <FaTicketAlt />
              </div>
              <h3>Ưu đãi vé xem phim</h3>
              <p>
                Hiển thị ưu đãi khi chính sách thành viên được cấu hình.
              </p>
            </article>

            <article className="membership-benefit">
              <div className="membership-benefit-icon">
                <FaGift />
              </div>
              <h3>Quà tặng thành viên</h3>
              <p>
                Khu vực dành cho các chương trình quà tặng và khuyến mãi.
              </p>
            </article>

            <article className="membership-benefit">
              <div className="membership-benefit-icon">
                <FaStar />
              </div>
              <h3>Tích lũy điểm</h3>
              <p>
                Điểm chỉ nên được ghi nhận từ giao dịch hợp lệ theo quy định.
              </p>
            </article>
          </div>

          <p className="membership-disclaimer">
            Quyền lợi ở trên là phần giới thiệu giao diện, chưa xác nhận
            rằng các ưu đãi đã được triển khai hoặc áp dụng cho tài khoản.
          </p>
        </section>

        <section className="membership-history">
          <div className="membership-section-heading">
            <div className="membership-section-icon">
              <FaHistory />
            </div>

            <div>
              <h2>Lịch sử điểm</h2>
              <p>Các lần cộng hoặc sử dụng điểm thành viên</p>
            </div>
          </div>

          {loading ? (
            <p className="membership-empty">
              Đang tải lịch sử...
            </p>
          ) : membership.history.length === 0 ? (
            <div className="membership-empty-state">
              <div className="membership-empty-icon">
                <FaHistory />
              </div>

              <h3>Chưa có lịch sử tích điểm</h3>

              <p>
                Lịch sử sẽ hiển thị sau khi backend có API điểm thành viên
                và ghi nhận giao dịch hợp lệ.
              </p>

              <button
                type="button"
                className="membership-action-button"
                onClick={() => navigate("/tickets")}
              >
                <FaTicketAlt />
                Xem lịch sử mua hàng
              </button>
            </div>
          ) : (
            <div className="membership-history-list">
              {membership.history.map((item) => (
                <article
                  className="membership-history-item"
                  key={item.id}
                >
                  <div>
                    <strong>{item.description}</strong>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <strong
                    className={
                      item.points >= 0
                        ? "membership-points-plus"
                        : "membership-points-minus"
                    }
                  >
                    {item.points > 0 ? "+" : ""}
                    {formatPoints(item.points)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Membership;
