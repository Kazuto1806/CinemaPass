import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import CinemaPassOptimized from "../assets/optimized/cinema-pass.webp";

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
    <footer className="footer">
      <div className="footer-content">
        <Link
          to="/"
          className="footer-brand"
          aria-label={isEnglish ? "Cinema Pass home" : "Cinema Pass trang chủ"}
        >
          <img
            src={CinemaPassOptimized}
            width="155"
            height="70"
            alt="Cinema Pass"
            loading="lazy"
          />
          <span>
            {isEnglish
              ? "Discover movies. Enjoy the moment."
              : "Khám phá phim hay, tận hưởng từng khoảnh khắc."}
          </span>
        </Link>

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

      <div className="footer-bottom">
        <p className="footer-copy">© Cinema Pass. All rights reserved.</p>
        <nav
          className="footer-links"
          aria-label={isEnglish ? "Footer links" : "Liên kết cuối trang"}
        >
          <Link to="/privacy-policy">
            {isEnglish ? "Privacy Policy" : "Chính sách bảo mật"}
          </Link>
          <Link to="/cinema-news">
            {isEnglish ? "Cinema News" : "Tin điện ảnh"}
          </Link>
          <Link to="/faq">{isEnglish ? "FAQ" : "Hỏi và đáp"}</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
