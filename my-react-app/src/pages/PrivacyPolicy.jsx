import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaShieldAlt, FaUserShield } from "react-icons/fa";
import "./InformationPages.css";

const sections = [
  {
    icon: <FaUserShield />,
    title: "Thông tin chúng tôi thu thập",
    text: "CinemaPass có thể thu thập họ tên, số điện thoại, email, thông tin tài khoản, lịch sử đặt vé và các thông tin cần thiết để xử lý giao dịch khi bạn sử dụng dịch vụ.",
  },
  {
    icon: <FaLock />,
    title: "Mục đích sử dụng thông tin",
    text: "Thông tin được sử dụng để xác nhận đặt vé, hỗ trợ khách hàng, quản lý thành viên, cải thiện trải nghiệm dịch vụ, gửi thông báo giao dịch và thực hiện các nghĩa vụ pháp lý.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Bảo vệ và lưu trữ dữ liệu",
    text: "Chúng tôi áp dụng các biện pháp quản lý, kỹ thuật và bảo mật hợp lý để hạn chế truy cập trái phép, mất mát hoặc thay đổi dữ liệu. Dữ liệu chỉ được lưu trữ trong phạm vi cần thiết cho hoạt động cung cấp dịch vụ.",
  },
];

function PrivacyPolicy() {
  return (
    <main className="information-page">
      <div className="information-container">
        <nav className="information-breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <strong>Chính sách bảo mật</strong>
        </nav>

        <header className="information-hero">
          <span className="information-eyebrow">CINEMAPASS</span>
          <h1>Chính sách bảo mật</h1>
          <p>Chúng tôi cam kết bảo vệ thông tin cá nhân và quyền riêng tư của khách hàng trong suốt quá trình sử dụng dịch vụ.</p>
        </header>

        <section className="policy-grid">
          {sections.map((section) => (
            <article className="policy-card" key={section.title}>
              <div className="policy-card-icon">{section.icon}</div>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </section>

        <section className="policy-detail">
          <h2>Quyền của khách hàng</h2>
          <p>Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân, cũng như được giải thích cách dữ liệu của bạn được xử lý. Vui lòng liên hệ với chúng tôi nếu có yêu cầu liên quan đến quyền riêng tư.</p>
          <h2>Chia sẻ thông tin</h2>
          <p>Thông tin cá nhân không được bán cho bên thứ ba. CinemaPass chỉ chia sẻ dữ liệu với đơn vị cung cấp dịch vụ liên quan hoặc theo yêu cầu của cơ quan có thẩm quyền trong phạm vi pháp luật cho phép.</p>
        </section>

        <aside className="information-contact">
          <div className="information-contact-icon"><FaEnvelope /></div>
          <div>
            <span>Liên hệ về bảo mật</span>
            <strong>support@cinemapass.vn</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default PrivacyPolicy;
