import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaTicketAlt,
  FaMoneyBillWave,
  FaUsers,
  FaCalendarAlt,
  FaFilm,
  FaBuilding,
  FaSearch,
  FaFileExcel,
} from "react-icons/fa";

import { useNotification } from "../../components/useNotification";
import { API_BASE } from "../../constants";
import "./ReportAdmin.css";
const REPORT_API = `${API_BASE}/api/reports`;
const CINEMA_API = `${API_BASE}/api/cinemas`;
const MOVIE_API = `${API_BASE}/api/movies`;
const getDateInput = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);

  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
};

const emptyReport = {
  summary: {
    totalTickets: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalShowtimes: 0,
  },
  revenueByDay: [],
  topMovies: [],
  cinemas: [],
  tickets: [],
};

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " đ";

const dateText = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("vi-VN");
};

const dateTimeText = (value) => {
  if (!value) return "-";

  const text = String(value).trim();
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(text);
  const date = new Date(
    !hasTimeZone && /^\d{4}-\d{2}-\d{2}T/.test(text)
      ? `${text}+07:00`
      : text
  );

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function ReportAdmin() {
  const { notify } = useNotification();
  const [filters, setFilters] = useState({
    startDate: getDateInput(-29),
    endDate: getDateInput(),
    cinemaId: "",
    movieId: "",
  });

  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [report, setReport] = useState(emptyReport);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState("revenue");

  const loadOptions = async () => {
    const [movieResponse, cinemaResponse] =
      await Promise.all([
        fetch(MOVIE_API),
        fetch(CINEMA_API),
      ]);

    if (!movieResponse.ok || !cinemaResponse.ok) {
      throw new Error("Không thể tải danh sách phim và rạp.");
    }

    const movieData = await movieResponse.json();
    const cinemaData = await cinemaResponse.json();

    setMovies(Array.isArray(movieData) ? movieData : []);
    setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
  };

  const loadReport = async (selectedFilters = filters) => {
    if (
      selectedFilters.startDate &&
      selectedFilters.endDate &&
      selectedFilters.startDate > selectedFilters.endDate
    ) {
      setError("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedFilters.startDate) {
        params.set("startDate", selectedFilters.startDate);
      }

      if (selectedFilters.endDate) {
        params.set("endDate", selectedFilters.endDate);
      }

      if (selectedFilters.cinemaId) {
        params.set("cinemaId", selectedFilters.cinemaId);
      }

      if (selectedFilters.movieId) {
        params.set("movieId", selectedFilters.movieId);
      }

      const response = await fetch(`${REPORT_API}?${params}`);

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || `Lỗi tải báo cáo: HTTP ${response.status}`
        );
      }

      setReport({
        ...emptyReport,
        ...data,
        summary: {
          ...emptyReport.summary,
          ...(data.summary || {}),
        },
      });
    } catch (err) {
      console.error("Lỗi tải báo cáo:", err);
      setError(err.message || "Không thể tải báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await loadOptions();
        await loadReport(filters);
      } catch (err) {
        console.error(err);
        setError(err.message || "Không thể khởi tạo trang báo cáo.");
        setLoading(false);
      }
    };

    initialize();
    // Chỉ tải dữ liệu ban đầu khi mở trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const exportExcel = () => {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const configurations = {
      revenue: {
        fileName: "DoanhThuTheoNgay",
        title: "BÁO CÁO DOANH THU THEO NGÀY",
        columns: ["Ngày", "Số vé", "Doanh thu"],
        rows: revenueByDay.map((item) => [
          dateText(item.date),
          Number(item.tickets || 0),
          Number(item.revenue || 0),
        ]),
      },
      tickets: {
        fileName: "ChiTietVe",
        title: "BÁO CÁO CHI TIẾT VÉ",
        columns: ["Mã vé", "Ngày đặt", "Khách hàng", "Phim", "Rạp", "Ghế", "Giá vé", "Trạng thái"],
        rows: tickets.map((ticket) => [
          ticket.ticketId,
          dateTimeText(ticket.createdAt),
          ticket.customerName,
          ticket.movieTitle,
          ticket.cinemaName,
          ticket.seatCode,
          Number(ticket.ticketPrice || 0),
          ticket.status,
        ]),
      },
      movies: {
        fileName: "PhimBanChay",
        title: "BÁO CÁO PHIM BÁN CHẠY",
        columns: ["Phim", "Số vé", "Doanh thu"],
        rows: topMovies.map((movie) => [
          movie.title,
          Number(movie.tickets || 0),
          Number(movie.revenue || 0),
        ]),
      },
      cinemas: {
        fileName: "HieuQuaTheoRap",
        title: "BÁO CÁO HIỆU QUẢ THEO RẠP",
        columns: ["Rạp", "Số vé", "Doanh thu"],
        rows: cinemaReports.map((cinema) => [
          cinema.name,
          Number(cinema.tickets || 0),
          Number(cinema.revenue || 0),
        ]),
      },
    };

    const configuration = configurations[selectedReport];
    if (!configuration.rows.length) {
      notify("Không có dữ liệu để xuất báo cáo này.", "warning");
      return;
    }

    const tableHead = configuration.columns
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join("");
    const tableBody = configuration.rows
      .map(
        (row) =>
          `<tr>${row
            .map((value) => `<td>${escapeHtml(value)}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <h2>${escapeHtml(configuration.title)}</h2>
        <p>Từ ngày: ${escapeHtml(filters.startDate)} - Đến ngày: ${escapeHtml(filters.endDate)}</p>
        <table border="1">
          <thead><tr>${tableHead}</tr></thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob(["\uFEFF", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CinemaPass_${configuration.fileName}_${getDateInput()}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Đã xuất báo cáo Excel.", "success");
  };

  const revenueByDay = report.revenueByDay || [];
  const topMovies = report.topMovies || [];
  const cinemaReports = report.cinemas || [];
  const tickets = report.tickets || [];

  const maxRevenue = Math.max(
    ...revenueByDay.map((item) => Number(item.revenue || 0)),
    1
  );

  return (
    <div className="report-admin">
      <div className="report-header">
        <div>
          <h1>Báo cáo & thống kê</h1>
          <p>
            Theo dõi doanh thu vé và tình hình kinh doanh CinemaPass
          </p>
        </div>

        <button
          type="button"
          className="report-export-btn"
          onClick={exportExcel}
          disabled={loading}
        >
          <FaFileExcel />
          Xuất Excel
        </button>
      </div>

      {/* BỘ LỌC */}

      <form
        className="report-filter"
        onSubmit={(event) => {
          event.preventDefault();
          loadReport(filters);
        }}
      >
        <div className="report-filter-title">
          <FaSearch />
          <span>Bộ lọc báo cáo</span>
        </div>

        <div className="report-filter-fields">
          <div className="report-field">
            <label>Từ ngày</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="report-field">
            <label>Đến ngày</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="report-field">
            <label>Rạp chiếu</label>
            <select
              name="cinemaId"
              value={filters.cinemaId}
              onChange={handleChange}
            >
              <option value="">Tất cả rạp</option>

              {cinemas.map((cinema) => (
                <option
                  key={cinema.cinemaId}
                  value={cinema.cinemaId}
                >
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>Phim</label>
            <select
              name="movieId"
              value={filters.movieId}
              onChange={handleChange}
            >
              <option value="">Tất cả phim</option>

              {movies.map((movie) => (
                <option
                  key={movie.movieId}
                  value={movie.movieId}
                >
                  {movie.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="report-apply-btn"
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Áp dụng"}
          </button>
        </div>
      </form>

      <section className="report-selector" aria-label="Chọn loại báo cáo">
        <button
          type="button"
          className={selectedReport === "revenue" ? "active" : ""}
          onClick={() => setSelectedReport("revenue")}
        >
          <FaChartLine />
          <span>Doanh thu theo ngày</span>
        </button>
        <button
          type="button"
          className={selectedReport === "tickets" ? "active" : ""}
          onClick={() => setSelectedReport("tickets")}
        >
          <FaTicketAlt />
          <span>Chi tiết vé</span>
        </button>
        <button
          type="button"
          className={selectedReport === "movies" ? "active" : ""}
          onClick={() => setSelectedReport("movies")}
        >
          <FaFilm />
          <span>Phim bán chạy</span>
        </button>
        <button
          type="button"
          className={selectedReport === "cinemas" ? "active" : ""}
          onClick={() => setSelectedReport("cinemas")}
        >
          <FaBuilding />
          <span>Hiệu quả theo rạp</span>
        </button>
      </section>

      {error && (
        <div className="report-error">
          {error}
          <button
            type="button"
            onClick={() => loadReport(filters)}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* THẺ THỐNG KÊ */}

      <div className="report-stat-grid">
        <div className="report-stat-card">
          <div className="report-stat-icon purple">
            <FaTicketAlt />
          </div>
          <div>
            <span>Vé hợp lệ</span>
            <strong>
              {loading
                ? "..."
                : Number(
                    report.summary.totalTickets
                  ).toLocaleString("vi-VN")}
            </strong>
            <small>Trong kỳ báo cáo</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon green">
            <FaMoneyBillWave />
          </div>
          <div>
            <span>Doanh thu vé</span>
            <strong>
              {loading
                ? "..."
                : money(report.summary.totalRevenue)}
            </strong>
            <small>Không tính vé đã hủy</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon blue">
            <FaUsers />
          </div>
          <div>
            <span>Khách hàng</span>
            <strong>
              {loading
                ? "..."
                : Number(
                    report.summary.totalCustomers
                  ).toLocaleString("vi-VN")}
            </strong>
            <small>Khách có vé hợp lệ</small>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-icon orange">
            <FaCalendarAlt />
          </div>
          <div>
            <span>Suất chiếu</span>
            <strong>
              {loading
                ? "..."
                : Number(
                    report.summary.totalShowtimes
                  ).toLocaleString("vi-VN")}
            </strong>
            <small>Theo ngày chiếu đã chọn</small>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ DOANH THU */}

      {selectedReport === "revenue" && (
      <section className="report-panel">
        <div className="report-panel-header">
          <div className="report-panel-icon purple">
            <FaChartLine />
          </div>

          <div>
            <h2>Doanh thu theo ngày</h2>
            <p>
              Tính theo ngày khách đặt vé, sau khi áp dụng bộ lọc
            </p>
          </div>
        </div>

        {loading ? (
          <div className="report-empty">Đang tải báo cáo...</div>
        ) : revenueByDay.length === 0 ? (
          <div className="report-empty">
            Chưa có dữ liệu doanh thu trong khoảng thời gian này.
          </div>
        ) : (
          <div className="report-chart">
            {revenueByDay.map((item) => {
              const height = Math.max(
                (Number(item.revenue || 0) / maxRevenue) * 100,
                3
              );

              return (
                <div
                  className="report-chart-column"
                  key={item.date}
                  title={`${dateText(item.date)}: ${money(item.revenue)}`}
                >
                  <span className="report-chart-value">
                    {Number(item.revenue || 0) >= 1000000
                      ? `${(
                          Number(item.revenue) / 1000000
                        ).toFixed(1)} tr`
                      : `${Math.round(
                          Number(item.revenue || 0) / 1000
                        )}k`}
                  </span>

                  <div className="report-chart-bar-wrap">
                    <div
                      className="report-chart-bar"
                      style={{ height: `${height}%` }}
                    />
                  </div>

                  <span className="report-chart-label">
                    {dateText(item.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* TOP PHIM + DOANH THU RẠP */}

      {selectedReport === "movies" && (
        <section className="report-panel">
          <div className="report-panel-header">
            <div className="report-panel-icon blue">
              <FaFilm />
            </div>

            <div>
              <h2>Phim bán chạy</h2>
              <p>Top phim theo số vé hợp lệ</p>
            </div>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Số vé</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>

              <tbody>
                {topMovies.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="report-table-empty">
                      Chưa có dữ liệu phim
                    </td>
                  </tr>
                ) : (
                  topMovies.map((movie) => (
                    <tr key={movie.movieId}>
                      <td>{movie.title}</td>
                      <td>{movie.tickets}</td>
                      <td className="report-money">
                        {money(movie.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedReport === "cinemas" && (
        <section className="report-panel">
          <div className="report-panel-header">
            <div className="report-panel-icon orange">
              <FaBuilding />
            </div>

            <div>
              <h2>Hiệu quả theo rạp</h2>
              <p>So sánh số vé và doanh thu</p>
            </div>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Rạp</th>
                  <th>Số vé</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>

              <tbody>
                {cinemaReports.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="report-table-empty">
                      Chưa có dữ liệu rạp
                    </td>
                  </tr>
                ) : (
                  cinemaReports.map((cinema) => (
                    <tr key={cinema.cinemaId}>
                      <td>{cinema.name}</td>
                      <td>{cinema.tickets}</td>
                      <td className="report-money">
                        {money(cinema.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CHI TIẾT VÉ */}

      {selectedReport === "tickets" && (
      <section className="report-panel">
        <div className="report-panel-header">
          <div className="report-panel-icon green">
            <FaTicketAlt />
          </div>

          <div>
            <h2>Chi tiết vé</h2>
            <p>
              Tối đa 100 bản ghi gần nhất trong kỳ báo cáo
            </p>
          </div>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Ngày đặt</th>
                <th>Khách hàng</th>
                <th>Phim</th>
                <th>Rạp</th>
                <th>Ghế</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="report-table-empty">
                    Chưa có dữ liệu vé trong kỳ.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.ticketId}>
                    <td>#{ticket.ticketId}</td>
                    <td>{dateTimeText(ticket.createdAt)}</td>
                    <td>{ticket.customerName}</td>
                    <td>{ticket.movieTitle}</td>
                    <td>{ticket.cinemaName}</td>
                    <td>{ticket.seatCode}</td>
                    <td>{money(ticket.ticketPrice)}</td>
                    <td>
                      <span className="report-ticket-status">
                        {ticket.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}

export default ReportAdmin;