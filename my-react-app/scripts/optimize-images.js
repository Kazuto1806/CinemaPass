import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = join(projectRoot, "src", "assets");
const optimizedRoot = join(assetsRoot, "optimized");
const postersRoot = join(optimizedRoot, "posters");

await mkdir(postersRoot, { recursive: true });

const staticImages = [
  {
    source: join(assetsRoot, "Cinema_Pass.png"),
    destination: join(optimizedRoot, "cinema-pass.webp"),
    width: 310,
  },
  {
    source: join(assetsRoot, "Sảnh rạp chiếu phim tương lai neon.png"),
    destination: join(optimizedRoot, "cinema-lobby.webp"),
    width: 1600,
  },
];

const posterImages = [
  {
    source: join(assetsRoot, "bat-tien.jpeg"),
    name: "bat-tien",
  },
  {
    source: join(
      projectRoot,
      "backend",
      "wwwroot",
      "uploads",
      "posters",
      "da4b6bee-ab98-47cc-9e4a-5cc69024d987.jpeg"
    ),
    name: "da4b6bee-ab98-47cc-9e4a-5cc69024d987",
  },
];

for (const image of staticImages) {
  await sharp(image.source)
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(image.destination);
}

for (const poster of posterImages) {
  const { width: sourceWidth } = await sharp(poster.source).metadata();

  for (const width of [260, 350, 390, 520]) {
    if (sourceWidth < width) continue;

    await sharp(poster.source)
      .resize(width, Math.round(width * 1.5), { fit: "cover" })
      .webp({ quality: 82, effort: 6 })
      .toFile(join(postersRoot, `${poster.name}-${width}.webp`));
  }
}
