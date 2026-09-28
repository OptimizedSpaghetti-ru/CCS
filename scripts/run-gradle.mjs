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

import fs from "node:fs";

const androidDir = path.resolve(__dirname, "..", "android");
const isWindows = process.platform === "win32";
const gradleExecutable = isWindows ? "gradlew.bat" : "./gradlew";

const adoptiumRoot = "C:\\Program Files\\Eclipse Adoptium";
const adoptiumJdk = fs.existsSync(adoptiumRoot)
  ? fs
      .readdirSync(adoptiumRoot)
      .map((name) => path.join(adoptiumRoot, name))
      .find((dir) => fs.existsSync(path.join(dir, "bin", "java.exe")))
  : undefined;

const javaHomeCandidates = [
  adoptiumJdk,
  process.env.JAVA_HOME,
  "C:\\Program Files\\Java\\jdk-21",
  "C:\\Program Files\\Java\\jdk-17",
  "C:\\Program Files\\Android\\Android Studio\\jbr",
  "C:\\Program Files\\Android\\Android Studio\\jre",
].filter(Boolean);

const javaHome = javaHomeCandidates.find((candidate) => fs.existsSync(candidate));
const env = { ...process.env };
if (javaHome) {
  env.JAVA_HOME = javaHome;
  env.PATH = `${path.join(javaHome, "bin")}${path.delimiter}${env.PATH || ""}`;
}

const result = spawnSync(gradleExecutable, [task], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWindows,
  env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
