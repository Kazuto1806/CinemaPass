import { Link } from "react-router-dom";
import { FaArrowRight, FaCalendarAlt } from "react-icons/fa";
import cinemaImage from "../assets/Rạp chiếu phim dưới ánh xanh tím.png";
import lobbyImage from "../assets/Sảnh rạp chiếu phim tương lai neon.png";
import cinemaPassImage from "../assets/Cinema_Pass.png";
import "./InformationPages.css";

const news = [
  {
    category: "Khám phá phim",
    title: "Những bộ phim đáng mong đợi trên màn ảnh rộng",
    summary: "Tổng hợp các tác phẩm mới hứa hẹn mang đến trải nghiệm điện ảnh đặc sắc trong mùa chiếu sắp tới.",
    date: "07/11/2026",
    image: cinemaImage,
  },
  {
    category: "Mẹo xem phim",
    title: "Cách chọn ghế tốt nhất tại phòng chiếu",
    summary: "Một vài gợi ý đơn giản giúp bạn chọn vị trí xem rõ màn hình, thoải mái và tận hưởng trọn vẹn âm thanh.",
    date: "05/11/2026",
    image: lobbyImage,
  },
  {
    category: "CinemaPass",
    title: "Tích điểm thành viên mỗi lần đặt vé",
    summary: "Khám phá lợi ích thành viên CinemaPass và cách theo dõi điểm tích lũy cho mỗi giao dịch của bạn.",
    date: "01/11/2026",
    image: cinemaPassImage,
  },
];

function CinemaNews() {
  return (
    <main className="information-page">
      <div className="information-container">
        <nav className="information-breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link><span>/</span><strong>Tin điện ảnh</strong>
        </nav>

        <header className="information-hero">
          <span className="information-eyebrow">CINEMA JOURNAL</span>
          <h1>Tin điện ảnh</h1>
          <p>Cập nhật thông tin phim chiếu, mẹo thưởng thức điện ảnh và những ưu đãi mới nhất từ CinemaPass.</p>
        </header>

        <section className="news-feature-grid">
          {news.map((article, index) => (
            <article className={index === 0 ? "news-card news-card-featured" : "news-card"} key={article.title}>
              <div className="news-card-image">
                <img src={article.image} alt="" />
                <span>{article.category}</span>
              </div>
              <div className="news-card-body">
                <div className="news-card-date"><FaCalendarAlt /> {article.date}</div>
                <h2>{article.title}</h2>
                <p>{article.summary}</p>
                <Link to="/movies/now-showing">Xem phim đang chiếu <FaArrowRight /></Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default CinemaNews;
