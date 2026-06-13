import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templateRoot = "templates/external-project";

const requiredFiles = [
  "docs/guides/NEW_PROJECT_HARNESS_USAGE_STRUCTURE.ko.txt",
  "docs/guides/PROJECT_INPUT_TEMPLATE.ko.md",
  `${templateRoot}/README.md`,
  `${templateRoot}/AGENTS.md`,
  `${templateRoot}/USER_COMMAND_TEMPLATE.ko.md`,
  `${templateRoot}/USER_COMMAND_TEMPLATE_MVP.ko.md`,
  `${templateRoot}/USER_COMMAND_TEMPLATE_PRODUCTION.ko.md`,
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
      "<new-project-root>/.harness/project/",
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
      ".harness/project/PROJECT_INPUT.md",
      "짧은 자연어 제품 요청",
      "USER_COMMAND_TEMPLATE_MVP.ko.md",
      "USER_COMMAND_TEMPLATE_PRODUCTION.ko.md",
      "프레임워크/언어/런타임",
      "데이터베이스 종류"
    ]
  },
  {
    file: `${templateRoot}/USER_COMMAND_TEMPLATE.ko.md`,
    includes: [
      "natural_language_product_request_supported",
      "derive_missing_project_fields",
      "bootstrap_only_is_not_complete",
      "implementation_evidence_required",
      "USER_COMMAND_TEMPLATE_MVP.ko.md",
      "USER_COMMAND_TEMPLATE_PRODUCTION.ko.md",
      "production_grade_contract_required",
      ".harness/project/"
    ]
  },
  {
    file: `${templateRoot}/USER_COMMAND_TEMPLATE_MVP.ko.md`,
    includes: [
      "natural_language_product_request_supported",
      "derive_missing_project_fields",
      "bootstrap_only_is_not_complete",
      "local_mvp_required_without_live_access",
      "mock_or_fixture_flow_required",
      "implementation_evidence_required",
      ".harness/project/",
      "내가 긴 입력 양식을 다시 채우는 방식으로 진행하지 마세요",
      "bootstrap이나 문서 정리에서 멈추지 말고 실제 제품 코드를 구현하세요"
    ]
  },
  {
    file: `${templateRoot}/USER_COMMAND_TEMPLATE_PRODUCTION.ko.md`,
    includes: [
      "production_grade_contract_required",
      "database_contract_required",
      "framework_runtime_contract_required",
      "environment_configuration_contract_required",
      "deployment_operations_contract_required",
      "security_privacy_contract_required",
      "test_quality_gate_contract_required",
      "observability_contract_required",
      "production_claim_requires_project_specific_gate",
      "Framework contract",
      "Runtime contract",
      "Database contract",
      "Environment configuration contract",
      "Security and privacy contract",
      "Observability contract",
      "Deployment and operations contract",
      "Test and quality gate contract",
      ".env.example",
      "schema, migration, seed/fixture, index, constraint, transaction boundary",
      "project-specific release gate와 evidence 없이 `production-ready`, `stable`, `release-gated`를 열지 마세요"
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
      ".harness/project/PROJECT_INPUT.md",
      "Project-specific checkers live in `.harness/project/tools/`",
      "Autonomous Product Build Mode",
      "Production-Grade Mode",
      "natural_language_product_request_supported",
      "production_grade_contract_required",
      "database_contract_required",
      "framework_runtime_contract_required",
      "Do not ask the user to fill a long form before starting",
      "at least one project-specific test, smoke test, or checker exercises the requested workflow"
    ]
  },
  {
    file: `${templateRoot}/README.md`,
    includes: [
      "짧은 자연어 요청",
      ".harness/project/PROJECT_INPUT.md",
      "cp -R .harness/harness-core/templates/external-project/. .harness/project/",
      "USER_COMMAND_TEMPLATE_MVP.ko.md",
      "USER_COMMAND_TEMPLATE_PRODUCTION.ko.md",
      "DB schema/migration",
      "제품 코드와 사용자 흐름 검증 없이 문서와 checker만 만든 상태는 완료가 아니다"
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

const forbiddenExactLinePatterns = [
  /^cp -R \.harness\/harness-core\/templates\/external-project\/\. \.$/,
  /^node tools\/check_project_(current_state|claims|precommit)\.mjs$/
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

  const lines = text.split(/\r?\n/);
  for (const pattern of forbiddenExactLinePatterns) {
    const matchingLine = lines.find((line) => pattern.test(line.trim()));
    addCheck(checks, `${file} does not use root-level external-project command ${pattern}`, !matchingLine, {
      file,
      pattern: String(pattern),
      matching_line: matchingLine || null
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
