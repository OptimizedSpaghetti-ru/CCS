import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(
  projectRoot,
  "public",
  "branding",
  "school-logo.png",
);
const assetsDir = path.join(projectRoot, "assets");
const targetPath = path.join(assetsDir, "icon.png");

if (!fs.existsSync(sourcePath)) {
  console.error("App icon source not found at public/branding/school-logo.png");
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.copyFileSync(sourcePath, targetPath);
console.log("Prepared icon source at assets/icon.png");
