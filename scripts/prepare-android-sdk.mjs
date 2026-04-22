import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const androidDir = path.join(projectRoot, "android");
const localPropertiesPath = path.join(androidDir, "local.properties");

if (!fs.existsSync(androidDir)) {
  console.error("Android project not found. Run: npm run cap:add:android");
  process.exit(1);
}

const candidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
    : undefined,
  process.env.HOME
    ? path.join(process.env.HOME, "Library", "Android", "sdk")
    : undefined,
  process.env.HOME ? path.join(process.env.HOME, "Android", "Sdk") : undefined,
].filter(Boolean);

const sdkDir = candidates.find((candidate) => fs.existsSync(candidate));

if (!sdkDir) {
  if (fs.existsSync(localPropertiesPath)) {
    console.log("Using existing android/local.properties");
    process.exit(0);
  }

  console.error(
    "Android SDK path is missing. Set ANDROID_HOME or ANDROID_SDK_ROOT, install Android SDK, or create android/local.properties manually.",
  );
  console.error(
    "Example local.properties: sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk",
  );
  process.exit(1);
}

const escapedSdkDir = sdkDir.replace(/\\/g, "\\\\");
const content = `sdk.dir=${escapedSdkDir}\n`;
fs.writeFileSync(localPropertiesPath, content, "utf8");

console.log(
  `Wrote SDK path to ${path.relative(projectRoot, localPropertiesPath)}`,
);
