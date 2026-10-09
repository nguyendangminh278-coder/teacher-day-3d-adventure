import { build } from "esbuild";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
process.chdir(fileURLToPath(root));
await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "iife",
  target: "es2020",
  outfile: "dist/game.min.js",
});
await rm("site", { recursive: true, force: true });
await mkdir("site/src", { recursive: true });
for (const file of [
  "index.html",
  ".nojekyll",
  "ASSET_CREDITS.md",
  "assets",
  "dist",
])
  await cp(file, `site/${file}`, { recursive: true });
await cp("src/styles.css", "site/src/styles.css");
const size = (await stat("dist/game.min.js")).size;
console.log(
  `Build ready: site/ (${(size / 1024).toFixed(0)} KiB JavaScript; all assets local)`,
);
