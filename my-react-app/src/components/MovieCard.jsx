
import { useEffect, useState } from "react";
import "./MovieCard.css";
import { API_BASE, getMissingPosterFallback } from "../constants";

const getPosterUrl = (posterUrl) => {
  if (!posterUrl) return "";

  const normalized = String(posterUrl).trim();
  const fallback = getMissingPosterFallback(normalized);

  if (fallback) return fallback;

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  if (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  ) {
    const uploadPath = normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

    return `${API_BASE}${uploadPath}`;
  }

  if (
    normalized.startsWith("/assets/") ||
    normalized.startsWith("assets/")
  ) {
    return normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;
  }

  return normalized;
};

// Chuyển URL YouTube thành URL có thể phát trong iframe
const getTrailerEmbedUrl = (url) => {
  if (!url) return "";

  const normalized = String(url).trim();

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id
          ? `https://www.youtube.com/embed/${id}`
          : "";
      }

      const match = parsed.pathname.match(
        /^\/(?:embed|shorts|live)\/([^/?]+)/
      );

      if (match) {
        const privacyHost =
          host === "youtube-nocookie.com"
            ? "www.youtube-nocookie.com"
            : "www.youtube.com";

        return `https://${privacyHost}/embed/${match[1]}`;
      }
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];

      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : "";
    }

    return "";
  } catch {
    return "";
  }
};

function MovieCard({ movie }) {
  const [showTrailer, setShowTrailer] = useState(false);

  const trailerUrl = movie?.trailerUrl ?? movie?.TrailerUrl ?? "";
  const trailerEmbedUrl = getTrailerEmbedUrl(trailerUrl);

  // Đóng popup bằng phím Escape
  useEffect(() => {
    if (!showTrailer) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowTrailer(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showTrailer]);

  const handleTrailerClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!trailerUrl.trim()) {
      window.alert("Phim này chưa có trailer.");
      return;
    }

    if (!trailerEmbedUrl && !/\.(mp4|webm|ogg)(\?.*)?$/i.test(trailerUrl)) {
      window.alert(
        "Link trailer chưa được hỗ trợ. Ông hãy dùng link YouTube hoặc link video MP4 trực tiếp."
      );
      return;
    }

    setShowTrailer(true);
  };

  const closeTrailer = (event) => {
    event?.stopPropagation();
    setShowTrailer(false);
  };

  return (
    <>
      <div className="movie-card-wrapper">
        <div className="movie-card">
          {/* POSTER */}
          {movie.posterUrl ? (
            <img
              src={getPosterUrl(movie.posterUrl)}
              alt={movie.title}
              className="movie-poster"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
                    <rect width="600" height="900" fill="#1f2937"/>
                    <rect x="40" y="40" width="520" height="820" rx="24" fill="#111827" stroke="#374151" stroke-width="4"/>
                    <circle cx="300" cy="320" r="110" fill="#374151"/>
                    <path d="M220 470C250 430 270 420 300 420C330 420 350 430 380 470L420 610H180L220 470Z" fill="#374151"/>
                    <text x="300" y="750" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="42" font-weight="700">NO POSTER</text>
                  </svg>
                `)}`;
              }}
            />
          ) : (
            <div className="movie-poster movie-poster-placeholder">
              🎬
            </div>
          )}

          {/* LỚP THÔNG TIN KHI DI CHUỘT */}
          <div className="movie-overlay">
            <div className="movie-info">
              <h3>{movie.title}</h3>

              <p>
                <strong>Thể loại:</strong>{" "}
                {movie.genre || "Chưa cập nhật"}
              </p>

              <p>
                <strong>Thời lượng:</strong>{" "}
                {movie.duration} phút
              </p>

              <p>
                <strong>Khởi chiếu:</strong>{" "}
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>

              <p>
                <strong>Đạo diễn:</strong>{" "}
                {movie.director || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          {/* ĐỘ TUỔI */}
          <div className="movie-badge">
            {movie.ageRating || "P"}
          </div>
        </div>

        {/* TÊN PHIM */}
        <h3 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h3>

        {/* NÚT TRAILER */}
        <div className="movie-card-actions">
          <button
            type="button"
            className="movie-trailer-btn"
            onClick={handleTrailerClick}
            aria-label={`Xem trailer phim ${movie.title}`}
          >
            <span className="movie-trailer-icon">▶</span>
            <span>Xem Trailer</span>
          </button>

          <button
            type="button"
            className="movie-detail-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              window.location.href =
                `/movie/${encodeURIComponent(movie.title)}`;
            }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>

      {/* POPUP PHÁT TRAILER */}
      {showTrailer && (
        <div
          className="trailer-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Trailer phim ${movie.title}`}
          onClick={closeTrailer}
        >
          <div
            className="trailer-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="trailer-modal-header">
              <h2>{movie.title} - Trailer</h2>

              <button
                type="button"
                className="trailer-close-btn"
                onClick={closeTrailer}
                aria-label="Đóng trailer"
              >
                ✕
              </button>
            </div>

            <div className="trailer-video-container">
              {trailerEmbedUrl ? (
                <iframe
                  src={`${trailerEmbedUrl}?autoplay=1`}
                  title={`Trailer ${movie.title}`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={trailerUrl}
                  controls
                  autoPlay
                  playsInline
                >
                  Trình duyệt của ông không hỗ trợ phát video.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MovieCard;
