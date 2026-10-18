import { useEffect } from "react";
import "./TrailerModal.css";

const getTrailerEmbedUrl = (url) => {
  if (!url) return "";

  const normalized = String(url).trim();

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : "";
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

function TrailerModal({ isOpen, onClose, title, trailerUrl }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailerUrl) return null;

  const normalizedUrl = String(trailerUrl).trim();
  const embedUrl = getTrailerEmbedUrl(normalizedUrl);

  if (!embedUrl && !/\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedUrl)) {
    return null;
  }

  return (
    <div
      className="trailer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer phim ${title}`}
      onClick={onClose}
    >
      <div
        className="trailer-modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="trailer-modal-header">
          <h2>{title} - Trailer</h2>

          <button
            type="button"
            className="trailer-close-btn"
            onClick={onClose}
            aria-label="Đóng trailer"
          >
            ✕
          </button>
        </div>

        <div className="trailer-video-container">
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1`}
              title={`Trailer ${title}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video src={normalizedUrl} controls autoPlay playsInline>
              Trình duyệt của ông không hỗ trợ phát video.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrailerModal;
