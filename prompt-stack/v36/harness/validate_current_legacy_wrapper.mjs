import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(harnessDir, "validate_current.mjs");
const result = spawnSync(process.execPath, [script], { stdio: "inherit" });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
