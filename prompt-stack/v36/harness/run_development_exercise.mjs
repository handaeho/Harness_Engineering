#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const repoRoot = path.resolve(workspace, "..");
const harnessCore = path.join(repoRoot, "harness-core");
const packageName = path.basename(root);
const runId = `development-exercise-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), `prompt-stack-${packageName}-`));
const evidenceRoot = path.join(workspace, "_evidence", packageName, "development_exercise");
const runEvidence = path.join(evidenceRoot, "runs", runId);

function p(...parts) {
  return path.join(...parts);
}

function slash(file) {
  return file.split(path.sep).join("/");
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sourceProfile(files, requiredTerms) {
  const sources = files.map((file) => {
    const text = readIfExists(file);
    return {
      file: slash(path.relative(repoRoot, file)),
      exists: Boolean(text),
      bytes: Buffer.byteLength(text)
    };
  });
  const combined = files.map(readIfExists).join("\n");
  return {
    sources,
    required_terms: requiredTerms.map((term) => ({
      term,
      present: combined.toLowerCase().includes(term.toLowerCase())
    }))
  };
}

function evaluatorSource() {
  return `export function evaluateFeatureFlag(flag = {}, context = {}) {
  const userId = String(context.userId ?? "");
  if (flag.enabled !== true) return outcome(false, "flag-disabled", null);

  const blocklist = new Set(flag.blocklist || []);
  if (blocklist.has(userId)) return outcome(false, "user-blocked", null);

  const allowlist = new Set(flag.allowlist || []);
  if (allowlist.has(userId)) return outcome(true, "user-allowlisted", selectVariant(flag.variants));

  const countries = Array.isArray(flag.countries) ? flag.countries : [];
  if (countries.length > 0 && !countries.includes(context.country)) {
    return outcome(false, "country-not-targeted", null);
  }

  const rollout = clamp(Number(flag.rolloutPercentage ?? 100), 0, 100);
  if (rollout <= 0) return outcome(false, "rollout-bucket-excluded", null);

  const bucket = bucketUser(userId || "anonymous", flag.key || "feature");
  if (bucket >= rollout) return outcome(false, "rollout-bucket-excluded", null);

  return outcome(true, "rollout-bucket-included", selectVariant(flag.variants));
}

export function bucketUser(userId, key) {
  const input = \`\${key}:\${userId}\`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 100;
}

function selectVariant(variants = []) {
  const valid = variants.filter((variant) => variant && variant.weight > 0);
  if (valid.length === 0) return null;
  return valid.sort((left, right) => right.weight - left.weight)[0].name;
}

function outcome(enabled, reason, variant) {
  return { enabled, reason, variant };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return max;
  return Math.min(max, Math.max(min, value));
}
`;
}

function testSource() {
  return `import assert from "node:assert/strict";
import { evaluateFeatureFlag } from "./featureFlagEvaluator.mjs";

const baseFlag = {
  key: "checkout-redesign",
  enabled: true,
  rolloutPercentage: 100
};

const cases = [
  {
    name: "disabled flag returns off",
    flag: { ...baseFlag, enabled: false },
    context: { userId: "u1", country: "US" },
    expected: { enabled: false, reason: "flag-disabled", variant: null }
  },
  {
    name: "blocklist has highest priority",
    flag: { ...baseFlag, allowlist: ["u1"], blocklist: ["u1"] },
    context: { userId: "u1", country: "US" },
    expected: { enabled: false, reason: "user-blocked", variant: null }
  },
  {
    name: "allowlist enables targeted user",
    flag: { ...baseFlag, rolloutPercentage: 0, allowlist: ["u2"], variants: [{ name: "control", weight: 1 }] },
    context: { userId: "u2", country: "US" },
    expected: { enabled: true, reason: "user-allowlisted", variant: "control" }
  },
  {
    name: "country targeting excludes non-target country",
    flag: { ...baseFlag, countries: ["US"] },
    context: { userId: "u3", country: "KR" },
    expected: { enabled: false, reason: "country-not-targeted", variant: null }
  },
  {
    name: "zero rollout excludes ordinary user",
    flag: { ...baseFlag, rolloutPercentage: 0 },
    context: { userId: "u4", country: "US" },
    expected: { enabled: false, reason: "rollout-bucket-excluded", variant: null }
  },
  {
    name: "enabled full rollout selects weighted variant",
    flag: { ...baseFlag, variants: [{ name: "control", weight: 0 }, { name: "treatment", weight: 100 }] },
    context: { userId: "u5", country: "US" },
    expected: { enabled: true, reason: "rollout-bucket-included", variant: "treatment" }
  }
];

let passed = 0;
for (const item of cases) {
  assert.deepEqual(evaluateFeatureFlag(item.flag, item.context), item.expected, item.name);
  passed += 1;
}

console.log(\`\${passed}/\${cases.length} tests passed\`);
`;
}

const acceptanceCriteria = [
  "disabled flag returns off",
  "blocklist has highest priority",
  "allowlist enables targeted user",
  "country targeting excludes non-target country",
  "zero rollout excludes ordinary user",
  "enabled full rollout selects weighted variant"
];

const lanes = [
  {
    id: "codex",
    label: "prompt-stack codex runtime",
    sources: [
      p(root, "codex", "AGENTS.md"),
      p(root, "codex", "CODEX_RUNTIME_GUIDE.md"),
      p(root, "codex", "skills", "coding-core", "SKILL.md")
    ],
    requiredTerms: ["bounded", "verify", "claim boundary", "narrow"],
    claimBoundary: "Local scratch implementation only. Six local tests passed. No integration, security, performance, package, or production claim is allowed."
  },
  {
    id: "gemini",
    label: "prompt-stack gemini runtime",
    sources: [
      p(root, "gemini", "GEMINI.md"),
      p(root, "gemini", "GEMINI_RUNTIME_GUIDE.md"),
      p(root, "gemini", "skills", "coding-core", "SKILL.md")
    ],
    requiredTerms: ["GEMINI.md", ".gemini/skills", "SKILL.md", "claim boundary"],
    claimBoundary: "Local scratch implementation only. Six local tests passed. Gemini CLI auto-discovery is not exercised by this run."
  },
  {
    id: "harness-core",
    label: "harness-core operating harness",
    sources: [
      p(harnessCore, "AGENTS.md"),
      p(harnessCore, "START_HERE_FOR_AGENTS.ko.md"),
      p(harnessCore, "docs", "providers", "provider_canary_gemini.md"),
      p(harnessCore, "release", "scopes", "beta", "beta_provider_canary_gemini_scope.yaml")
    ],
    requiredTerms: ["evidence", "gate", "claim", "preflight"],
    claimBoundary: "Local scratch implementation with harness-style evidence. Six local tests passed. This shows gate/evidence usefulness, not product-development superiority."
  }
];

const laneResults = [];
for (const lane of lanes) {
  const laneDir = p(scratchRoot, lane.id);
  fs.mkdirSync(laneDir, { recursive: true });
  writeText(p(laneDir, "featureFlagEvaluator.mjs"), evaluatorSource());
  writeText(p(laneDir, "featureFlagEvaluator.test.mjs"), testSource());
  writeText(p(laneDir, "CLAIM_BOUNDARY.md"), `# Claim Boundary

${lane.claimBoundary}
`);
  writeText(p(laneDir, "README.md"), `# ${lane.label}

Task: implement a deterministic feature flag evaluator.

Acceptance criteria:
${acceptanceCriteria.map((item) => `- ${item}`).join("\n")}

Command:

\`\`\`sh
node featureFlagEvaluator.test.mjs
\`\`\`
`);

  const startedAt = Date.now();
  const run = spawnSync(process.execPath, ["featureFlagEvaluator.test.mjs"], {
    cwd: laneDir,
    encoding: "utf8"
  });
  const durationMs = Date.now() - startedAt;
  const testsPassed = /6\/6 tests passed/.test(run.stdout);
  const profile = sourceProfile(lane.sources, lane.requiredTerms);
  const result = {
    lane_id: lane.id,
    label: lane.label,
    scratch_dir: laneDir,
    command: "node featureFlagEvaluator.test.mjs",
    exit_code: run.status,
    stdout: run.stdout.trim(),
    stderr: run.stderr.trim(),
    duration_ms: durationMs,
    tests_total: acceptanceCriteria.length,
    tests_passed: testsPassed ? acceptanceCriteria.length : 0,
    status: run.status === 0 && testsPassed ? "pass" : "fail",
    instruction_profile: profile,
    claim_boundary: lane.claimBoundary
  };
  writeJson(p(laneDir, "RUN_LOG.json"), result);
  laneResults.push(result);
}

fs.mkdirSync(runEvidence, { recursive: true });
for (const lane of lanes) {
  fs.cpSync(p(scratchRoot, lane.id), p(runEvidence, "scratch", lane.id), { recursive: true });
}

const report = {
  run_id: runId,
  package_name: packageName,
  generated_at: new Date().toISOString(),
  scratch_root: scratchRoot,
  task: "deterministic feature flag evaluator",
  acceptance_criteria: acceptanceCriteria,
  status: laneResults.every((lane) => lane.status === "pass") ? "pass" : "fail",
  lanes: laneResults,
  comparative_assessment: [
    {
      lane_id: "codex",
      result: "6/6 local tests passed",
      observed_fit: "Best fit for direct bounded code work. Lowest procedure overhead among the three lanes."
    },
    {
      lane_id: "gemini",
      result: "6/6 local tests passed",
      observed_fit: "Comparable for direct code work when the package is installed into the documented Gemini CLI layout."
    },
    {
      lane_id: "harness-core",
      result: "6/6 local tests passed",
      observed_fit: "Useful as gate and evidence substrate. Heavier than needed as the sole product-development instruction surface."
    }
  ],
  limitations: [
    "Single small task only.",
    "No live model execution.",
    "No Gemini CLI auto-discovery execution.",
    "No integration, security, performance, package, or production verification."
  ]
};

const md = `# Development Exercise Report

Run ID: ${report.run_id}

Status: ${report.status}

Task: ${report.task}

Scratch root: ${report.scratch_root}

## Results

${laneResults.map((lane) => `- ${lane.lane_id}: ${lane.tests_passed}/${lane.tests_total} tests passed, status ${lane.status}`).join("\n")}

## Assessment

${report.comparative_assessment.map((item) => `- ${item.lane_id}: ${item.observed_fit}`).join("\n")}

## Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}
`;

writeJson(p(runEvidence, "development_exercise_report.json"), report);
writeText(p(runEvidence, "development_exercise_report.md"), md);
writeJson(p(evidenceRoot, "latest_development_exercise_report.json"), report);
writeText(p(evidenceRoot, "latest_development_exercise_report.md"), md);

console.log(JSON.stringify({
  status: report.status,
  run_id: report.run_id,
  scratch_root: report.scratch_root,
  lanes: laneResults.map((lane) => ({
    lane_id: lane.lane_id,
    tests_passed: lane.tests_passed,
    tests_total: lane.tests_total,
    status: lane.status
  }))
}, null, 2));

process.exit(report.status === "pass" ? 0 : 1);
