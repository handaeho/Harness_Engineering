import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const runners = [
  "validate_current.mjs",
  "validate_assembled_bundle.mjs",
  "validate_codex_runtime.mjs",
];

const results = [];
for (const runner of runners) {
  const result = spawnSync(process.execPath, [path.join(harnessDir, runner)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  results.push({
    runner,
    status: result.status === 0 ? "pass" : "fail",
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  });
}

const summary = {
  status: results.every((item) => item.status === "pass") ? "pass" : "fail",
  generated_at: new Date().toISOString(),
  results,
};

console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "pass") process.exit(1);
