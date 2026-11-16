import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaTicketAlt, FaMapMarkerAlt, FaCalendarAlt, FaChair, FaClock, FaHome } from "react-icons/fa";
import { API_BASE } from "../constants";
import posterUnavailable from "../assets/poster-unavailable.svg";
import "./TicketVerify.css";

function formatDate(value) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : "--:--";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
}

function TicketVerify() {
  const { token } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/tickets/verify/${encodeURIComponent(token || "")}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Không tìm thấy vé này. Mã QR có thể không hợp lệ." : "Chưa tải được thông tin vé. Vui lòng thử lại.");
        return response.json();
      })
      .then((data) => { if (active) setTicket(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const posterValue = ticket?.posterUrl || ticket?.PosterUrl || "";
  const posterSrc = posterValue
    ? (/^https?:\/\//i.test(posterValue) ? posterValue : `${API_BASE}${posterValue.startsWith("/") ? "" : "/"}${posterValue}`)
    : posterUnavailable;
  const paymentStatus = String(ticket?.paymentStatus || ticket?.status || "");
  const isPaid = ["paid", "completed", "success", "confirmed", "đã thanh toán", "đã xác nhận"].includes(paymentStatus.toLowerCase());

  if (loading) return <main className="ticket-verify-page"><div className="ticket-verify-state">Đang tải thông tin vé…</div></main>;
  if (error || !ticket) return <main className="ticket-verify-page"><div className="ticket-verify-state ticket-verify-error"><FaTicketAlt /><h1>Không xem được vé</h1><p>{error || "Mã vé không hợp lệ."}</p><Link to="/"><FaHome /> Về trang chủ</Link></div></main>;

  return (
    <main className="ticket-verify-page">
      <section className="ticket-verify-card">
        <div className="ticket-verify-banner"><span className="ticket-verify-mark"><FaTicketAlt /></span><div><span>CINEMAPASS · VÉ XEM PHIM</span><h1>Thông tin vé của bạn</h1></div><strong className={isPaid ? "ticket-verify-status paid" : "ticket-verify-status"}>{isPaid ? "ĐÃ THANH TOÁN" : paymentStatus || "CHỜ XÁC NHẬN"}</strong></div>
        <div className="ticket-verify-content">
          <img className="ticket-verify-poster" src={posterSrc} alt={`Poster phim ${ticket.movieTitle || "CinemaPass"}`} onError={(event) => { event.currentTarget.src = posterUnavailable; }} />
          <div className="ticket-verify-details"><p className="ticket-verify-eyebrow">VÉ #{ticket.ticketId}</p><h2>{ticket.movieTitle || "Vé xem phim"}</h2>
            <div className="ticket-verify-grid">
              <div><FaMapMarkerAlt /><span><small>Rạp / Phòng</small><strong>{ticket.cinemaName || "Chưa có thông tin"}{ticket.roomName ? ` · ${ticket.roomName}` : ""}</strong></span></div>
              <div><FaCalendarAlt /><span><small>Ngày chiếu</small><strong>{formatDate(ticket.showDate)}</strong></span></div>
              <div><FaClock /><span><small>Suất chiếu</small><strong>{formatTime(ticket.startTime)}{ticket.endTime ? ` – ${formatTime(ticket.endTime)}` : ""}</strong></span></div>
              <div><FaChair /><span><small>Ghế / Loại vé</small><strong>{ticket.seatCode || "—"}{ticket.ticketTypeName ? ` · ${ticket.ticketTypeName}` : ""}</strong></span></div>
            </div>
            <div className="ticket-verify-total"><span>Giá vé</span><strong>{formatMoney(ticket.ticketPrice)}</strong></div>
          </div>
        </div>
        <p className="ticket-verify-note">Đưa màn hình này cho nhân viên rạp để kiểm tra thông tin vé.</p>
      </section>
      <Link className="ticket-verify-home" to="/"><FaHome /> Về trang chủ</Link>
    </main>
  );
}

export default TicketVerify;

