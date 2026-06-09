import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "PROJECT_INPUT.md",
  "PROJECT_BRIEF.md",
  "CURRENT_STATE.yaml",
  "release/scope.yaml",
  "release/claim_boundary.yaml",
  "release/blocker_register.yaml",
  "tools/check_project_current_state.mjs",
  "tools/check_project_claims.mjs",
  "tools/check_project_precommit.mjs",
  ".harness/harness-core/AGENTS.md",
  ".harness/harness-core/START_HERE_FOR_AGENTS.ko.md",
  ".harness/harness-core/AGENT_BOOTSTRAP.ko.md",
  ".harness/harness-core/README.md",
  ".harness/harness-core/CURRENT_STATE.yaml",
  ".harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md"
];

const requiredDirs = [
  "docs",
  "evidence/current-state",
  "evidence/runs",
  "evidence/gates",
  "evidence/checks",
  "release",
  "tools",
  ".harness/harness-core"
];

const blockedClaims = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated"
];

function relPath(...parts) {
  return path.join(root, ...parts);
}

function exists(rel) {
  return fs.existsSync(relPath(rel));
}

function readText(rel) {
  return fs.existsSync(relPath(rel)) ? fs.readFileSync(relPath(rel), "utf8") : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function ensureDir(rel) {
  fs.mkdirSync(relPath(rel), { recursive: true });
}

const checks = [];

for (const file of requiredFiles) {
  addCheck(checks, `${file} exists`, exists(file), { path: file });
}

for (const dir of requiredDirs) {
  addCheck(checks, `${dir} exists`, exists(dir), { path: dir });
}

const currentState = readText("CURRENT_STATE.yaml");
const harnessState = readText(".harness/harness-core/CURRENT_STATE.yaml");

addCheck(
  checks,
  "project CURRENT_STATE records vendored harness path",
  currentState.includes(".harness/harness-core"),
  { expected: ".harness/harness-core" }
);

addCheck(
  checks,
  "project CURRENT_STATE uses project_root operation mode",
  currentState.includes("primary: project_root"),
  { expected: "primary: project_root" }
);

addCheck(
  checks,
  "HARNESS Core CURRENT_STATE is separate from project CURRENT_STATE",
  currentState.length > 0 && harnessState.length > 0 && currentState !== harnessState,
  {}
);

for (const claim of blockedClaims) {
  addCheck(
    checks,
    `blocked claim recorded: ${claim}`,
    currentState.includes(claim) && readText("release/claim_boundary.yaml").includes(claim),
    { claim }
  );
}

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  checker: "check_project_current_state.mjs",
  project_root: root,
  harness_reference: ".harness/harness-core",
  generated_at: new Date().toISOString(),
  checks,
  failures,
  unresolved_items_count: failures.length
};

ensureDir("evidence/checks");
fs.writeFileSync(
  relPath("evidence/checks/project_current_state_check.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
