import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const task = process.argv[2];
if (!task) {
  console.error(
    "Missing Gradle task. Example: node scripts/run-gradle.mjs assembleDebug",
  );
  process.exit(1);
}

const androidDir = path.resolve(__dirname, "..", "android");
const isWindows = process.platform === "win32";
const gradleExecutable = isWindows ? "gradlew.bat" : "./gradlew";

const result = spawnSync(gradleExecutable, [task], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
