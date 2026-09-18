import "./Footer.css"

export const Footer = () => {
  return (
    <footer className='footer'>
        <div className='footer-top'>
            <div className='footer-copy'>
                © Cinema Pass. All rights reserved.
            </div>
            {/* Link */}
            <div className="footer-links">
                <a href="#">Chính sách bảo mật</a>
                <a href="#">Tin điện ảnh</a>
                <a href="#">Hỏi và đáp</a>
            </div>
        </div>
         <div className="footer-content">

        {/* Logo Bộ Công Thương */}
        <div className="footer-bct">
          <img
            src="/assets/bo-cong-thuong.png"
            alt="Đã thông báo Bộ Công Thương"
          />
        </div>


        {/* Thông tin công ty */}
        <div className="footer-company">

          <p>
            CÔNG TY CỔ PHẦN GIẢI TRÍ PHÁT HÀNH PHIM - RẠP CHIẾU PHIM PASS
          </p>
          <p>
            GIẤY CNĐKDN SỐ: 031274744, ĐĂNG KÝ LẦN ĐẦU NGÀY 18/04/2014,
            ĐĂNG KÝ THAY ĐỔI LẦN THỨ 2 NGÀY 15/09/2026,
            CẤP BỞI SỞ KH&amp;ĐT TPHCM
          </p>
        </div>

      </div>
    </footer>
  )
}
export default Footer