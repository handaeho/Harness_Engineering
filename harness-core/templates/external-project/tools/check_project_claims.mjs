import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const blockedClaims = [
  "provider-verified",
  "adapter-checked",
  "production-ready",
  "stable",
  "release-gated",
  "bare release-gated"
];

const scanExtensions = new Set([
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".json",
  ".js",
  ".mjs",
  ".ts",
  ".tsx",
  ".jsx"
]);

const excludedDirs = new Set([
  ".git",
  ".harness",
  "node_modules",
  "dist",
  "build",
  "coverage"
]);

const allowedContextPatterns = [
  /blocked/i,
  /not allowed/i,
  /not claim/i,
  /not.*production-ready/i,
  /not.*stable/i,
  /not.*release-gated/i,
  /false/i,
  /forbidden/i,
  /prohibited/i,
  /금지/,
  /차단/,
  /아님/,
  /아니다/,
  /열지 않는다/,
  /계속/,
  /blocked_strong_claims/,
  /claim_boundary/
];

function relPath(...parts) {
  return path.join(root, ...parts);
}

function ensureDir(rel) {
  fs.mkdirSync(relPath(rel), { recursive: true });
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, acc);
    } else if (scanExtensions.has(path.extname(entry.name))) {
      acc.push(abs);
    }
  }
  return acc;
}

function toRel(abs) {
  return path.relative(root, abs).replace(/\\/g, "/");
}

function lineAllowed(line, context, rel) {
  if (rel === "CURRENT_STATE.yaml" || rel === "release/claim_boundary.yaml") {
    if (/blocked_strong_claims/.test(context) || /blocked strong claims/i.test(context)) {
      return true;
    }
  }
  return allowedContextPatterns.some((pattern) => pattern.test(line) || pattern.test(context));
}

const findings = [];
for (const abs of walk(root)) {
  const rel = toRel(abs);
  const text = fs.readFileSync(abs, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const context = lines.slice(Math.max(0, index - 4), Math.min(lines.length, index + 3)).join("\n");
    for (const claim of blockedClaims) {
      if (line.includes(claim) && !lineAllowed(line, context, rel)) {
        findings.push({
          file: rel,
          line: index + 1,
          claim,
          context: line.trim().slice(0, 240)
        });
      }
    }
  });
}

const claimBoundary = fs.existsSync(relPath("release/claim_boundary.yaml"))
  ? fs.readFileSync(relPath("release/claim_boundary.yaml"), "utf8")
  : "";

const boundaryChecks = blockedClaims.map((claim) => ({
  claim,
  recorded_as_blocked: claimBoundary.includes(claim)
}));

const missingBlockedClaims = boundaryChecks.filter((entry) => !entry.recorded_as_blocked);

const report = {
  status: findings.length === 0 && missingBlockedClaims.length === 0 ? "pass" : "fail",
  checker: "check_project_claims.mjs",
  project_root: root,
  generated_at: new Date().toISOString(),
  scanned_files: walk(root).length,
  excluded_dirs: Array.from(excludedDirs),
  blocked_claims: blockedClaims,
  positive_claim_findings: findings,
  claim_boundary_checks: boundaryChecks,
  missing_blocked_claims: missingBlockedClaims,
  unresolved_items_count: findings.length + missingBlockedClaims.length
};

ensureDir("evidence/checks");
fs.writeFileSync(
  relPath("evidence/checks/project_claim_scan.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
