import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = "C:\\WORK\\0.개인\\PROMPT";
const v33Root = path.join(repoRoot, "prompt-stack", "v33");
const harnessRoot = path.join(v33Root, "harness");

const rawArgs = process.argv.slice(2);
let freezeId = "rg-2026-05-18-a";

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--freeze-id") {
    const next = rawArgs[i + 1];
    if (!next) {
      throw new Error("--freeze-id requires a value");
    }
    freezeId = next;
    i += 1;
  }
}

const freezeDir = path.join(harnessRoot, "freezes", freezeId);
const snapshotRoot = path.join(freezeDir, "snapshot");

const scenarioPath = path.join(harnessRoot, "scenarios.json");
const schemaPath = path.join(harnessRoot, "response_schema.json");
const runnerPath = path.join(harnessRoot, "run_external_harness.mjs");
const repeatRunnerPath = path.join(harnessRoot, "run_release_gate_repeats.mjs");
const policyPath = path.join(harnessRoot, "release_gate_policy.json");

const suite = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function toRepoRelative(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, "/");
}

function snapshotRelativePath(repoRelativePath) {
  return path.join("snapshot", ...repoRelativePath.split("/")).replace(/\\/g, "/");
}

const promptRoots = [
  path.join(v33Root, "01_base"),
  path.join(v33Root, "02_overlays"),
  path.join(v33Root, "03_examples"),
  path.join(v33Root, "codex")
];

const promptFiles = [];
for (const root of promptRoots) {
  for (const dirent of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!dirent.isFile()) {
      continue;
    }
    const fullPath = path.join(dirent.parentPath, dirent.name);
    promptFiles.push(fullPath);
  }
}

promptFiles.push(path.join(v33Root, "AGENTS.md"));
promptFiles.sort();

const promptManifest = [];
for (const filePath of promptFiles) {
  const repoRelative = toRepoRelative(filePath);
  const snapshotRelative = snapshotRelativePath(repoRelative);
  const snapshotAbsolute = path.join(freezeDir, snapshotRelative);
  ensureParent(snapshotAbsolute);
  fs.copyFileSync(filePath, snapshotAbsolute);
  promptManifest.push({
    source_path: repoRelative,
    snapshot_path: snapshotRelative,
    bytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  });
}

const harnessFiles = [schemaPath, runnerPath, repeatRunnerPath, policyPath];
const harnessManifest = [];

fs.mkdirSync(freezeDir, { recursive: true });

for (const filePath of harnessFiles) {
  const name = path.basename(filePath);
  const targetPath = path.join(freezeDir, name);
  fs.copyFileSync(filePath, targetPath);
  harnessManifest.push({
    source_path: toRepoRelative(filePath),
    frozen_path: name,
    bytes: fs.statSync(filePath).size,
    sha256: sha256File(filePath)
  });
}

const frozenSuite = {
  ...suite,
  freeze_id: freezeId,
  scenarios: suite.scenarios.map((scenario) => ({
    ...scenario,
    active_files: scenario.active_files.map((repoRelative) =>
      snapshotRelativePath(repoRelative)
    )
  }))
};

fs.writeFileSync(
  path.join(freezeDir, "scenarios.json"),
  JSON.stringify(frozenSuite, null, 2),
  "utf8"
);

harnessManifest.unshift({
  source_path: toRepoRelative(scenarioPath),
  frozen_path: "scenarios.json",
  bytes: Buffer.byteLength(JSON.stringify(frozenSuite, null, 2), "utf8"),
  sha256: crypto
    .createHash("sha256")
    .update(JSON.stringify(frozenSuite, null, 2))
    .digest("hex")
});

const manifest = {
  freeze_id: freezeId,
  created_at: new Date().toISOString(),
  suite_id: suite.suite_id,
  repo_root: repoRoot,
  freeze_scope: {
    prompt_surface: [
      "prompt-stack/v33/AGENTS.md",
      "prompt-stack/v33/01_base/*",
      "prompt-stack/v33/02_overlays/*",
      "prompt-stack/v33/03_examples/*",
      "prompt-stack/v33/codex/**"
    ],
    harness_assets: [
      "prompt-stack/v33/harness/scenarios.json",
      "prompt-stack/v33/harness/response_schema.json",
      "prompt-stack/v33/harness/run_external_harness.mjs",
      "prompt-stack/v33/harness/run_release_gate_repeats.mjs",
      "prompt-stack/v33/harness/release_gate_policy.json"
    ]
  },
  prompt_file_count: promptManifest.length,
  harness_file_count: harnessManifest.length,
  scenario_count: suite.scenarios.length,
  prompt_files: promptManifest,
  harness_files: harnessManifest
};

fs.writeFileSync(
  path.join(freezeDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(JSON.stringify({
  freeze_id: freezeId,
  freeze_dir: freezeDir,
  prompt_file_count: manifest.prompt_file_count,
  harness_file_count: manifest.harness_file_count,
  scenario_count: manifest.scenario_count
}, null, 2));
