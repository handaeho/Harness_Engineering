import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templateRoot = "templates/external-project";

const requiredFiles = [
  "docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt",
  "docs/guides/PROJECT_INPUT_TEMPLATE.ko.md",
  `${templateRoot}/README.md`,
  `${templateRoot}/AGENTS.md`,
  `${templateRoot}/PROJECT_INPUT.md`,
  `${templateRoot}/PROJECT_BRIEF.md`,
  `${templateRoot}/CURRENT_STATE.yaml`,
  `${templateRoot}/release/scope.yaml`,
  `${templateRoot}/release/claim_boundary.yaml`,
  `${templateRoot}/release/blocker_register.yaml`,
  `${templateRoot}/tools/check_project_current_state.mjs`,
  `${templateRoot}/tools/check_project_claims.mjs`,
  `${templateRoot}/tools/check_project_precommit.mjs`,
  `${templateRoot}/docs/architecture/README.md`,
  `${templateRoot}/docs/decisions/README.md`,
  `${templateRoot}/docs/handoff/README.md`,
  `${templateRoot}/evidence/current-state/.gitkeep`,
  `${templateRoot}/evidence/runs/.gitkeep`,
  `${templateRoot}/evidence/gates/.gitkeep`,
  `${templateRoot}/evidence/checks/.gitkeep`
];

const requiredTextChecks = [
  {
    file: "docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt",
    includes: [
      "<new-project-root>/.harness/harness-core/",
      "templates/external-project/",
      "external project + vendored",
      "PROJECT_INPUT_TEMPLATE.ko.md"
    ]
  },
  {
    file: "docs/guides/PROJECT_INPUT_TEMPLATE.ko.md",
    includes: [
      "빠른 입력 양식",
      "완성 입력 양식",
      "claim boundary",
      ".harness/harness-core/",
      "PROJECT_INPUT.md"
    ]
  },
  {
    file: `${templateRoot}/PROJECT_INPUT.md`,
    includes: [
      "Source template:",
      ".harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md",
      "Do not edit `.harness/harness-core/docs/guides/PROJECT_INPUT_TEMPLATE.ko.md`",
      "프로젝트 이름:"
    ]
  },
  {
    file: `${templateRoot}/CURRENT_STATE.yaml`,
    includes: [
      "path: .harness/harness-core",
      "mode: external_project_vendored_harness",
      "primary: project_root"
    ]
  },
  {
    file: `${templateRoot}/AGENTS.md`,
    includes: [
      ".harness/harness-core/",
      "PROJECT_INPUT.md",
      "Project-specific checkers live in `tools/`"
    ]
  },
  {
    file: `${templateRoot}/release/claim_boundary.yaml`,
    includes: [
      "provider-verified",
      "adapter-checked",
      "production-ready",
      "stable",
      "release-gated"
    ]
  }
];

const forbiddenNewProjectPatterns = [
  "apps/<app-name>",
  "product/<app-name>",
  "evidence/product/<app-name>",
  "tools/product",
  "release/product_<app-name>",
  "docs/product/<app-name>"
];

function p(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(p(rel));
}

function read(rel) {
  return exists(rel) ? fs.readFileSync(p(rel), "utf8") : "";
}

function addCheck(checks, name, pass, detail = {}) {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function walk(rel, acc = []) {
  if (!exists(rel)) return acc;
  for (const entry of fs.readdirSync(p(rel), { withFileTypes: true })) {
    const childRel = path.posix.join(rel.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) {
      walk(childRel, acc);
    } else {
      acc.push(childRel);
    }
  }
  return acc;
}

const checks = [];

for (const file of requiredFiles) {
  addCheck(checks, `${file} exists`, exists(file), { path: file });
}

for (const textCheck of requiredTextChecks) {
  const text = read(textCheck.file);
  for (const needle of textCheck.includes) {
    addCheck(checks, `${textCheck.file} includes ${needle}`, text.includes(needle), {
      file: textCheck.file,
      needle
    });
  }
}

const scannedFiles = [
  "docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt",
  "docs/guides/PROJECT_INPUT_TEMPLATE.ko.md",
  ...walk(templateRoot).filter((file) => /\.(md|txt|ya?ml|mjs|json)$/.test(file))
];

for (const file of scannedFiles) {
  const text = read(file);
  for (const pattern of forbiddenNewProjectPatterns) {
    addCheck(checks, `${file} does not use old new-project path ${pattern}`, !text.includes(pattern), {
      file,
      pattern
    });
  }
}

const failures = checks.filter((check) => check.status !== "pass");
const report = {
  status: failures.length === 0 ? "pass" : "fail",
  checker: "check_external_project_template_contract.mjs",
  template_root: templateRoot,
  generated_at: new Date().toISOString(),
  scanned_files: scannedFiles.length,
  checks,
  failures,
  unresolved_items_count: failures.length
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
