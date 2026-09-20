import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const folder = path.resolve("public/catalog");
const names = (await fs.readdir(folder)).filter((name) =>
  /^product-\d+\.(png|jpg|webp)$/.test(name),
);
const manifest = {};
let before = 0;
let after = 0;
await fs.mkdir(path.join(folder, "optimized"), { recursive: true });
for (const name of names) {
  const source = path.join(folder, name);
  const id = name.match(/^product-(\d+)/)[1];
  const metadata = await sharp(source).metadata();
  const files = [];
  for (const width of [480, 960]) {
    const targetName = `product-${id}-${width}.webp`;
    const target = path.join(folder, "optimized", targetName);
    const info = await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(target);
    files.push({ url: `/catalog/optimized/${targetName}`, width: info.width, bytes: info.size });
  }
  before += (await fs.stat(source)).size;
  after += files[1].bytes;
  manifest[`/catalog/${name}`] = {
    src: files[1].url,
    srcSet: [...new Map(files.map((f) => [f.width, `${f.url} ${f.width}w`])).values()].join(", "),
    width: metadata.width,
    height: metadata.height,
  };
}
await fs.writeFile("src/data/product-images.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(
  JSON.stringify({
    images: names.length,
    originalBytes: before,
    optimizedBytes: after,
    reduction: Math.round((1 - after / before) * 100) + "%",
  }),
);
