import { useEffect, useRef, useState } from "react";
import { FaImage, FaTrash, FaUpload } from "react-icons/fa";
import { API_BASE } from "../../constants";
import { useNotification } from "../../components/useNotification";
import "./BannerAdmin.css";

const API_URL = `${API_BASE}/api/banners`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function BannerAdmin() {
	const { confirm } = useNotification();
	const [banners, setBanners] = useState([]);
	const [imageFile, setImageFile] = useState(null);
	const [altText, setAltText] = useState("");
	const [previewUrl, setPreviewUrl] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const previewUrlRef = useRef("");

	useEffect(() => {
		return () => {
			if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
		};
	}, []);

	const loadBanners = async () => {
		try {
			const response = await fetch(API_URL);
			if (!response.ok) throw new Error("Không thể tải danh sách banner.");
			setBanners(await response.json());
		} catch (loadError) {
			setError(loadError.message || "Không thể tải danh sách banner.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const controller = new AbortController();

		fetch(API_URL, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error("Không thể tải danh sách banner.");
				return response.json();
			})
			.then(setBanners)
			.catch((loadError) => {
				if (loadError.name !== "AbortError") {
					setError(loadError.message || "Không thể tải danh sách banner.");
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, []);

	const handleFileChange = (event) => {
		const file = event.target.files?.[0] ?? null;
		setSuccess("");

		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = "";
			setPreviewUrl("");
		}

		if (file && !file.type.startsWith("image/")) {
			setError("Vui lòng chọn tệp hình ảnh.");
			setImageFile(null);
			event.target.value = "";
			return;
		}

		if (file && file.size > MAX_FILE_SIZE) {
			setError("Hình ảnh không được vượt quá 10MB.");
			setImageFile(null);
			event.target.value = "";
			return;
		}

		setError("");
		setImageFile(file);
		if (file) {
			previewUrlRef.current = URL.createObjectURL(file);
			setPreviewUrl(previewUrlRef.current);
		} else {
			setPreviewUrl("");
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!imageFile) {
			setError("Vui lòng chọn hình banner trước khi thêm.");
			return;
		}

		const formData = new FormData();
		formData.append("imageFile", imageFile);
		formData.append("altText", altText.trim());

		try {
			setSaving(true);
			setError("");
			setSuccess("");
			const response = await fetch(API_URL, { method: "POST", body: formData });
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || "Không thể thêm banner.");
			}

			if (previewUrlRef.current) {
				URL.revokeObjectURL(previewUrlRef.current);
				previewUrlRef.current = "";
			}
			setPreviewUrl("");
			setImageFile(null);
			setAltText("");
			await loadBanners();
			setSuccess("Đã thêm banner vào trang chủ.");
		} catch (saveError) {
			setError(saveError.message || "Không thể thêm banner.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (bannerId) => {
		const confirmed = await confirm("Bạn có chắc muốn xóa banner này?", {
			confirmLabel: "Xóa",
		});
		if (!confirmed) return;

		try {
			setDeletingId(bannerId);
			setError("");
			const response = await fetch(`${API_URL}/${bannerId}`, { method: "DELETE" });
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || "Không thể xóa banner.");
			}

			setBanners((current) => current.filter((banner) => banner.bannerId !== bannerId));
			setSuccess("Đã xóa banner.");
		} catch (deleteError) {
			setError(deleteError.message || "Không thể xóa banner.");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="banner-admin">
			<header className="banner-admin-header">
				<div>
					<p className="banner-admin-eyebrow">NỘI DUNG TRANG CHỦ</p>
					<h1>Quản lý banner</h1>
					<p>Thêm và sắp xếp hình ảnh hiển thị trong trình chiếu trang chủ.</p>
				</div>
				<div className="banner-admin-count" aria-label={`${banners.length} banner`}>
					<FaImage aria-hidden="true" />
					<strong>{banners.length}</strong>
					<span>banner</span>
				</div>
			</header>

			<form className="banner-admin-form" onSubmit={handleSubmit}>
				<div className="banner-admin-form-heading">
					<h2>Thêm hình mới</h2>
					<span>JPG, PNG hoặc WebP · tối đa 10MB</span>
				</div>

				<div className="banner-admin-form-content">
					<label className="banner-admin-file-picker">
						<FaUpload aria-hidden="true" />
						<span>{imageFile ? "Chọn hình khác" : "Chọn hình banner"}</span>
						<input type="file" accept="image/*" onChange={handleFileChange} />
					</label>

					<label className="banner-admin-alt-label">
						Mô tả hình ảnh
						<input
							type="text"
							value={altText}
							onChange={(event) => setAltText(event.target.value)}
							maxLength={200}
							placeholder="Ví dụ: Ưu đãi vé xem phim cuối tuần"
						/>
					</label>

					<button className="banner-admin-submit" type="submit" disabled={saving || !imageFile}>
						<FaImage aria-hidden="true" />
						{saving ? "Đang tải lên..." : "Thêm banner"}
					</button>
				</div>

				{previewUrl && (
					<div className="banner-admin-preview">
						<img src={previewUrl} alt={altText || "Xem trước banner"} />
						<span>Xem trước</span>
					</div>
				)}

				{error && <p className="banner-admin-message is-error" role="alert">{error}</p>}
				{success && <p className="banner-admin-message is-success" role="status">{success}</p>}
			</form>

			<div className="banner-admin-list-heading">
				<h2>Banner đang hiển thị</h2>
				<span>{banners.length} hình</span>
			</div>

			{loading ? (
				<p className="banner-admin-empty">Đang tải danh sách banner...</p>
			) : banners.length === 0 ? (
				<div className="banner-admin-empty">
					<FaImage aria-hidden="true" />
					<p>Chưa có banner nào. Thêm hình đầu tiên ở phía trên.</p>
				</div>
			) : (
				<div className="banner-admin-grid">
					{banners.map((banner, index) => (
						<article className="banner-admin-card" key={banner.bannerId}>
							<div className="banner-admin-card-image">
								<img src={banner.imageUrl} alt={banner.altText || `Banner ${index + 1}`} />
								<span>{String(index + 1).padStart(2, "0")}</span>
							</div>
							<div className="banner-admin-card-footer">
								<p title={banner.altText}>{banner.altText || `Banner ${index + 1}`}</p>
								<button
									type="button"
									className="banner-admin-delete"
									aria-label={`Xóa ${banner.altText || `banner ${index + 1}`}`}
									title="Xóa banner"
									disabled={deletingId === banner.bannerId}
									onClick={() => handleDelete(banner.bannerId)}
								>
									<FaTrash aria-hidden="true" />
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

export default BannerAdmin;
