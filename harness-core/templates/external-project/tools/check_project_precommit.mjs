import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function relPath(...parts) {
  return path.join(root, ...parts);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    passed: result.status === 0
  };
}

function ensureDir(rel) {
  fs.mkdirSync(relPath(rel), { recursive: true });
}

const checks = [
  run("node", ["tools/check_project_current_state.mjs"]),
  run("node", ["tools/check_project_claims.mjs"])
];

if (fs.existsSync(relPath(".git"))) {
  checks.push(run("git", ["diff", "--check"]));
} else {
  checks.push({
    command: "git diff --check",
    status: null,
    stdout: "",
    stderr: "skipped: .git directory not present",
    passed: true,
    skipped: true
  });
}

const failures = checks.filter((check) => !check.passed);
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  checker: "check_project_precommit.mjs",
  project_root: root,
  generated_at: new Date().toISOString(),
  checks,
  failures,
  unresolved_items_count: failures.length
};

ensureDir("evidence/checks");
fs.writeFileSync(
  relPath("evidence/checks/project_precommit_check.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
