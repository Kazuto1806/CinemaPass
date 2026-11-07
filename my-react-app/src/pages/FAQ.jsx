import { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown, FaHeadset, FaTicketAlt } from "react-icons/fa";
import "./InformationPages.css";

const faqs = [
  { category: "Đặt vé", question: "Làm thế nào để đặt vé xem phim?", answer: "Chọn mục Phim, xem chi tiết và chọn suất chiếu phù hợp. Sau đó chọn ghế, xác nhận các dịch vụ đi kèm và thanh toán để hoàn tất đặt vé." },
  { category: "Đặt vé", question: "Tôi có thể thay đổi hoặc hủy vé đã đặt không?", answer: "Bạn có thể xem lại vé trong mục Vé của tôi. Việc đổi hoặc hủy vé phụ thuộc vào thời điểm và chính sách áp dụng của suất chiếu." },
  { category: "Thanh toán", question: "CinemaPass hỗ trợ phương thức thanh toán nào?", answer: "Ứng dụng hỗ trợ thanh toán trực tuyến qua QR hoặc các phương thức được hiển thị khi bạn thực hiện thanh toán." },
  { category: "Thành viên", question: "Điểm tích lũy được cộng khi nào?", answer: "Điểm tích lũy được ghi nhận sau khi giao dịch đặt vé hoàn tất và không bị hủy. Bạn có thể theo dõi điểm trong trang Thành viên." },
  { category: "Tài khoản", question: "Tôi quên mật khẩu thì phải làm gì?", answer: "Bạn hãy sử dụng chức năng quên mật khẩu tại trang đăng nhập hoặc liên hệ bộ phận hỗ trợ để được xác minh tài khoản." },
  { category: "Rạp phim", question: "Trẻ em có được xem phim phân loại T16 hoặc T18 không?", answer: "Không. Khách hàng cần tuân thủ nhãn phân loại phim: T16 dành cho người từ đủ 16 tuổi, T18 dành cho người từ đủ 18 tuổi và phải tuân theo quy định tại rạp." },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <main className="information-page">
      <div className="information-container">
        <nav className="information-breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link><span>/</span><strong>Hỏi và đáp</strong>
        </nav>

        <header className="information-hero">
          <span className="information-eyebrow">TRUNG TÂM HỖ TRỢ</span>
          <h1>Hỏi và đáp</h1>
          <p>Những câu hỏi thường gặp giúp bạn đặt vé, thanh toán và tận hưởng trải nghiệm rạp chiếu nhanh chóng.</p>
        </header>

        <section className="faq-layout">
          <div className="faq-list">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <article className={`faq-item ${isOpen ? "faq-item-open" : ""}`} key={item.question}>
                  <button type="button" className="faq-question" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                    <div><span>{item.category}</span><strong>{item.question}</strong></div>
                    <FaChevronDown />
                  </button>
                  {isOpen && <div className="faq-answer"><p>{item.answer}</p></div>}
                </article>
              );
            })}
          </div>

          <aside className="faq-support">
            <div className="faq-support-icon"><FaHeadset /></div>
            <h2>Vẫn cần hỗ trợ?</h2>
            <p>Đội ngũ CinemaPass luôn sẵn sàng giải đáp thắc mắc của bạn.</p>
            <Link to="/account"><FaTicketAlt /> Quản lý vé của tôi</Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default FAQ;
