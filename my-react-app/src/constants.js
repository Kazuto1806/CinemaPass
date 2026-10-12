import posterUnavailable from "./assets/poster-unavailable.svg";

export const API_BASE =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV
		? "http://localhost:5000"
		: "https://cinemapass.onrender.com");

const missingPosterFiles = new Set([
	"0aeee33b-eb7c-4ea0-8bcb-20eaa4054840.jpeg",
	"b06f51eb-05f1-432d-94ac-ac5000e8fb23.jpeg",
	"3c2e3969-a7eb-4a1d-a7aa-250e01c7f8db.jpeg",
	"e182243f-7a50-42c3-bf03-d9380cd4885a.jpeg",
	"22c9069e-2d9c-4e62-bcbb-37db0f8a91d1.jpeg",
]);

export const getMissingPosterFallback = (posterUrl) => {
	const fileName = String(posterUrl ?? "")
		.trim()
		.split(/[\\/]/)
		.pop()
		?.toLowerCase();

	return missingPosterFiles.has(fileName) ? posterUnavailable : null;
};