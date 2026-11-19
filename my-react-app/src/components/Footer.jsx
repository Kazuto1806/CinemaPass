import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css"

export const Footer = () => {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "VN"
  );

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(localStorage.getItem("language") || "VN");
    };

    window.addEventListener("languageChanged", updateLanguage);
    return () => {
      window.removeEventListener("languageChanged", updateLanguage);
    };
  }, []);

  const isEnglish = language === "EN";

  return (
    <footer className='footer'>
        <div className='footer-top'>
            <div className='footer-copy'>
                © Cinema Pass. All rights reserved.
            </div>
            {/* Link */}
            <div className="footer-links">
                <Link to="/privacy-policy">
                  {isEnglish ? "Privacy Policy" : "Chính sách bảo mật"}
                </Link>
                <Link to="/cinema-news">
                  {isEnglish ? "Cinema News" : "Tin điện ảnh"}
                </Link>
                <Link to="/faq">
                  {isEnglish ? "FAQ" : "Hỏi và đáp"}
                </Link>
            </div>
        </div>
         <div className="footer-content">

        {/* Thông tin công ty */}
        <div className="footer-company">

          <p>
            {isEnglish
              ? "CINEMAPASS FILM DISTRIBUTION AND CINEMA ENTERTAINMENT JOINT STOCK COMPANY"
              : "CÔNG TY CỔ PHẦN GIẢI TRÍ PHÁT HÀNH PHIM - RẠP CHIẾU PHIM PASS"}
          </p>
          <p>
            {isEnglish
              ? "BUSINESS REGISTRATION CERTIFICATE NO. 031274744, FIRST REGISTERED 18/04/2014, SECOND AMENDMENT REGISTERED 15/09/2026, ISSUED BY THE HO CHI MINH CITY DEPARTMENT OF INDUSTRY AND TRADE"
              : "GIẤY CNĐKDN SỐ: 031274744, ĐĂNG KÝ LẦN ĐẦU NGÀY 18/04/2014, ĐĂNG KÝ THAY ĐỔI LẦN THỨ 2 NGÀY 15/09/2026, CẤP BỞI SỞ KH&ĐT TPHCM"}
          </p>
        </div>

      </div>
    </footer>
  )
}
export default Footer