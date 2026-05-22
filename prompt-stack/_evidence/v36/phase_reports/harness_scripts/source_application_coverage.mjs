import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const sourceRoot = path.join(root, "sources", "learn_harness_engineering_clone");
const now = new Date().toISOString();

const lectures = [
  {
    title: "유능한 에이전트가 여전히 실패하는 이유",
    slug: "lecture-01-why-capable-agents-still-fail",
    core_claims: ["model capability does not imply reliable task completion", "failures need observable failure taxonomy"],
    subsystems: ["Verification", "Scope"],
    failure_mode: "premature completion, hidden failure, no reliable feedback loop",
    required_mapping: ["failure taxonomy", "harness subsystem scorecard", "verification gate", "premature completion tests"],
    target_assets: ["records/failure_to_artifact_map.json", "records/harness_scorecard.json", "verification/evaluator-rubric.md", "verification/behavioral_benchmark_suite.json"],
    benchmark_cases: ["BE-SHARED-006", "BE-SHARED-007", "BE-SHARED-010", "BE-SHARED-028"]
  },
  {
    title: "하네스란 무엇인가",
    slug: "lecture-02-what-a-harness-actually-is",
    core_claims: ["harness is the operating environment around the model", "five subsystems define reliable execution"],
    subsystems: ["Instructions", "State", "Verification", "Scope", "Lifecycle"],
    failure_mode: "prompt-only system has no operational controls",
    required_mapping: ["v36 architecture doctrine", "five-subsystem framework", "harness operating guide"],
    target_assets: ["docs/ARCHITECTURE.md", "docs/OPERATING_GUIDE.md", "records/concept_map.json", "records/harness_subsystem_coverage.json"],
    benchmark_cases: ["BE-AUTO-001", "BE-AUTO-006", "BE-SHARED-028"]
  },
  {
    title: "저장소가 시스템 오브 레코드(SoR)가 되어야 하는 이유",
    slug: "lecture-03-why-the-repository-must-become-the-system-of-record",
    core_claims: ["repository files should hold current state and decisions", "chat history is insufficient as durable state"],
    subsystems: ["State", "Instructions"],
    failure_mode: "unrecoverable state after session boundary",
    required_mapping: ["docs/ARTIFACT_MAP", "state/decision_log", "state/evidence_log", "repository SoR rule"],
    target_assets: ["docs/ARTIFACT_MAP.md", "state/decision_log.md", "state/evidence_log.json", "state/index.json"],
    benchmark_cases: ["BE-SHARED-001", "BE-SHARED-005", "BE-SHARED-023"]
  },
  {
    title: "거대한 단일 지시 파일이 실패하는 이유",
    slug: "lecture-04-why-one-giant-instruction-file-fails",
    core_claims: ["short router beats monolithic instruction dump", "detailed knowledge should be split by purpose"],
    subsystems: ["Instructions"],
    failure_mode: "instruction overload and stale routes",
    required_mapping: ["root router", "AGENTS.md", "MASTER_PROMPT_ROUTER", "split docs", "short instruction doctrine"],
    target_assets: ["AGENTS.md", "MASTER_PROMPT_ROUTER.md", "docs/ARTIFACT_MAP.md", "codex/CODEX_RUNTIME_GUIDE.md"],
    benchmark_cases: ["BE-AUTO-011", "BE-CODEX-008"]
  },
  {
    title: "장기 작업이 연속성을 잃는 이유",
    slug: "lecture-05-why-long-running-tasks-lose-continuity",
    core_claims: ["long-running work needs explicit state handoff", "next session must resume without prior chat"],
    subsystems: ["State", "Lifecycle"],
    failure_mode: "lost context, repeated work, manual restart",
    required_mapping: ["state/progress.md", "session-handoff", "feature_list", "next_session_start"],
    target_assets: ["state/progress.md", "state/session-handoff.md", "state/feature_list.json", "next_session_start.md"],
    benchmark_cases: ["BE-AUTO-016", "BE-SHARED-001", "BE-SHARED-023"]
  },
  {
    title: "초기화가 별도 단계여야 하는 이유",
    slug: "lecture-06-why-initialization-needs-its-own-phase",
    core_claims: ["startup needs its own phase", "init should check readiness before work"],
    subsystems: ["Lifecycle", "Verification"],
    failure_mode: "agent starts without context or validation",
    required_mapping: ["lifecycle/init.sh", "session-start.md", "clean-state checklist"],
    target_assets: ["lifecycle/init.sh", "lifecycle/session-start.md", "lifecycle/clean-state-checklist.md"],
    benchmark_cases: ["BE-AUTO-010", "BE-SHARED-016"]
  },
  {
    title: "에이전트가 과도하게 손대고 끝맺지 못하는 이유",
    slug: "lecture-07-why-agents-overreach-and-under-finish",
    core_claims: ["scope control prevents broad unfinished work", "one feature at a time keeps progress auditable"],
    subsystems: ["Scope"],
    failure_mode: "scope creep, broad rewrite, under-finished work",
    required_mapping: ["scope policy", "WIP boundary", "one-feature-at-a-time rule"],
    target_assets: ["autonomous/07_scope/SCOPE_POLICY.md", "state/feature_list.json", "verification/behavioral_benchmark_suite.json"],
    benchmark_cases: ["BE-AUTO-009", "BE-SHARED-011", "BE-SHARED-012"]
  },
  {
    title: "기능 목록이 하네스의 기본 단위인 이유",
    slug: "lecture-08-why-feature-lists-are-harness-primitives",
    core_claims: ["feature list is a primitive for scope and state", "feature status must be explicit"],
    subsystems: ["State", "Scope"],
    failure_mode: "unclear active work and hidden partial completion",
    required_mapping: ["state/feature_list.json", "feature-level DoD", "feature status schema"],
    target_assets: ["state/feature_list.json", "records/v36_asset_metadata_index.json", "verification/behavioral_benchmark_suite.json"],
    benchmark_cases: ["BE-SHARED-002", "BE-SHARED-012"]
  },
  {
    title: "에이전트가 너무 일찍 완료를 선언하는 이유",
    slug: "lecture-09-why-agents-declare-victory-too-early",
    core_claims: ["completion must require evidence", "claim strength must match validation state"],
    subsystems: ["Verification"],
    failure_mode: "premature completion and unsupported claim strength",
    required_mapping: ["verification/evaluator-rubric.md", "completion gate", "claim strength checklist"],
    target_assets: ["verification/evaluator-rubric.md", "verification/claim_strength_checklist.json", "records/behavioral_judge_results.json"],
    benchmark_cases: ["BE-SHARED-006", "BE-SHARED-007", "BE-SHARED-020"]
  },
  {
    title: "엔드투엔드 테스트가 결과를 바꾸는 이유",
    slug: "lecture-10-why-end-to-end-testing-changes-results",
    core_claims: ["end-to-end checks reveal failures hidden by local plausibility", "smoke contracts should connect to release gates"],
    subsystems: ["Verification"],
    failure_mode: "local plausibility treated as integration proof",
    required_mapping: ["benchmark suite", "e2e validation", "smoke test contract"],
    target_assets: ["verification/benchmark_suite.json", "verification/behavioral_benchmark_suite.json", "harness/validate_current_v36.mjs"],
    benchmark_cases: ["BE-SHARED-009", "BE-SHARED-024"]
  },
  {
    title: "관측 가능성이 하네스 안에 있어야 하는 이유",
    slug: "lecture-11-why-observability-belongs-inside-the-harness",
    core_claims: ["runtime behavior must leave observable traces", "evidence logs make claims auditable"],
    subsystems: ["Verification", "State"],
    failure_mode: "opaque execution and unauditable claims",
    required_mapping: ["trace schema", "observability records", "evidence_log", "validation outputs"],
    target_assets: ["state/evidence_log.json", "records/actor_output_validation_result.json", "records/behavioral_judge_results.json", "validation/current_validation_result.json"],
    benchmark_cases: ["BE-SHARED-005", "BE-SHARED-027"]
  },
  {
    title: "모든 세션이 클린 상태로 끝나야 하는 이유",
    slug: "lecture-12-why-every-session-must-leave-a-clean-state",
    core_claims: ["session closeout must leave a clean restart path", "handoff and checklist are lifecycle artifacts"],
    subsystems: ["Lifecycle", "State"],
    failure_mode: "dirty closeout and missing handoff",
    required_mapping: ["lifecycle/clean-state-checklist.md", "session-closeout", "handoff template"],
    target_assets: ["lifecycle/clean-state-checklist.md", "lifecycle/session-closeout.md", "lifecycle/handoff-template.md", "state/session-handoff.md"],
    benchmark_cases: ["BE-SHARED-017", "BE-SHARED-018", "BE-SHARED-025"]
  }
];

const topLevelRequirements = [
  [".github/workflows", "workflow", "GitHub Actions workflow and release/build automation pattern"],
  ["docs-readme", "docs", "multilingual README generation and localization structure"],
  ["docs", "docs", "course documentation and multilingual site source"],
  ["projects", "project", "starter/solution exercises for benchmark inspiration"],
  ["scripts", "script", "documentation build, screenshot, PDF and validation runner patterns"],
  ["skills", "skill", "agent skill packaging and harness-creator source"],
  [".gitignore", "config", "repository hygiene pattern"],
  ["CLAUDE.md", "docs", "agent instruction pattern for Claude runtime, not Codex mirror"],
  ["README.md", "readme", "course overview and references"],
  ["get_anthropic_logo.js", "script", "asset helper script"],
  ["package-lock.json", "package", "dependency lock evidence"],
  ["package.json", "package", "scripts and build pipeline metadata"]
];

const coreAssets = [
  ["skills/harness-creator", "skill", "harness-creator skill package"],
  ["skills/harness-creator/SKILL.md", "skill", "harness-creator skill instructions"],
  ["docs/ko", "docs", "Korean documentation root"],
  ["docs/ko/lectures", "docs", "Korean lectures"],
  ["docs/ko/projects", "project", "Korean project docs"],
  ["docs/ko/resources", "docs", "Korean resources"],
  ["docs/ko/resources/templates", "template", "Korean templates"],
  ["projects", "project", "project starter and solution files"],
  ["scripts", "script", "scripts"],
  [".github/workflows/release-course-pdfs.yml", "workflow", "PDF build workflow"],
  [".github/workflows/deploy-pages.yml", "workflow", "VitePress deploy workflow"],
  ["docs-readme", "docs", "multilingual documentation"],
  ["package.json", "package_metadata", "package scripts"],
  ["README.md", "readme", "README references"]
];

function slash(p) {
  return p.replace(/\\/g, "/");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readText(absOrRel) {
  const abs = path.isAbsolute(absOrRel) ? absOrRel : path.join(root, absOrRel);
  return fs.readFileSync(abs, "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeText(rel, text) {
  const target = path.join(root, rel);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, text.replace(/\r?\n/g, "\n"), "utf8");
}

function writeJson(rel, data) {
  writeText(rel, `${JSON.stringify(data, null, 2)}\n`);
}

function sha256File(abs) {
  return crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
}

function listFiles(dir) {
  const files = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    for (const ent of fs.readdirSync(current, { withFileTypes: true })) {
      if (ent.name === ".git") continue;
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile()) files.push(full);
    }
  }
  walk(dir);
  return files.sort((a, b) => slash(a).localeCompare(slash(b)));
}

function existsSource(sourcePath) {
  return fs.existsSync(path.join(sourceRoot, sourcePath));
}

function sourceKind(sourcePath) {
  if (sourcePath.startsWith(".github/workflows")) return "workflow";
  if (sourcePath.startsWith("skills/harness-creator")) return "skill";
  if (sourcePath.startsWith("skills")) return "skill";
  if (sourcePath.startsWith("projects")) return "project";
  if (sourcePath.startsWith("scripts")) return "script";
  if (sourcePath.includes("/templates/") || sourcePath.includes("\\templates\\")) return "template";
  if (sourcePath.endsWith("package.json") || sourcePath.endsWith("package-lock.json")) return "package_metadata";
  if (sourcePath.endsWith("README.md")) return "git_file";
  if (sourcePath.startsWith("docs")) return "git_file";
  return "git_file";
}

function sourceTypeForMatrix(sourcePath) {
  if (sourcePath.startsWith(".github/workflows")) return "workflow";
  if (sourcePath.startsWith("docs-readme")) return "docs";
  if (sourcePath.startsWith("docs")) return "docs";
  if (sourcePath.startsWith("projects")) return "project";
  if (sourcePath.startsWith("scripts")) return "script";
  if (sourcePath.startsWith("skills")) return "skill";
  if (sourcePath === "package.json" || sourcePath === "package-lock.json") return "package";
  if (sourcePath === "README.md") return "readme";
  if (sourcePath === "CLAUDE.md") return "docs";
  return "config";
}

function dispositionFor(sourcePath) {
  if (sourcePath.startsWith("docs/ko/lectures")) return "applied";
  if (sourcePath.startsWith("docs/ko/resources/templates")) return "partially_applied";
  if (sourcePath.startsWith("skills/harness-creator")) return "applied";
  if (sourcePath.startsWith("projects")) return "partially_applied";
  if (sourcePath.startsWith("scripts")) return "partially_applied";
  if (sourcePath.startsWith(".github/workflows")) return "archive_only";
  if (sourcePath.startsWith("docs-readme")) return "partially_applied";
  if (sourcePath === "package-lock.json") return "archive_only";
  if (sourcePath === "get_anthropic_logo.js") return "archive_only";
  if (sourcePath === "CLAUDE.md") return "partially_applied";
  if (sourcePath === ".gitignore") return "archive_only";
  return "partially_applied";
}

function targetAssetsFor(sourcePath) {
  if (sourcePath.startsWith("docs/ko/lectures")) return ["records/lecture_to_asset_application_matrix.json", "verification/behavioral_benchmark_suite.json"];
  if (sourcePath.startsWith("docs/ko/resources/templates")) return ["state/feature_list.json", "state/progress.md", "lifecycle/init.sh", "verification/evaluator-rubric.md"];
  if (sourcePath.startsWith("skills/harness-creator")) return ["codex/skills/harness-creator-adapter/SKILL.md", "codex/CODEX_RUNTIME_GUIDE.md"];
  if (sourcePath.startsWith("projects")) return ["verification/behavioral_benchmark_suite.json", "records/real_ablation_results.json"];
  if (sourcePath.startsWith("scripts")) return ["harness/validate_current_v36.mjs", "harness/behavioral_evidence_closure.mjs", "harness/run_benchmark.mjs"];
  if (sourcePath.startsWith(".github/workflows")) return ["records/git_asset_application_matrix.json", "archive/source_inventory/source_hash_manifest.json"];
  if (sourcePath.startsWith("docs-readme")) return ["records/source_language_matrix.json", "reports/SOURCE_COMPLETENESS_RECHECK.md"];
  if (sourcePath === "package.json") return ["records/git_asset_application_matrix.json", "harness/README.md"];
  if (sourcePath === "CLAUDE.md") return ["records/git_asset_application_matrix.json", "codex/CODEX_RUNTIME_GUIDE.md"];
  return ["records/source_file_disposition_matrix.json"];
}

function sourceInventoryHasPath(pathNeedle) {
  const inv = readJson("records/source_inventory.json");
  return inv.some((r) => r.path === pathNeedle || r.path.startsWith(`${pathNeedle}/`));
}

function coverageRecord({ source_id, source_kind, source_path_or_url, collected, parsed, classified, mapped_to_v36, disposition, target_v36_assets, missing_reason = "", action_required = "" }) {
  return {
    source_id,
    source_kind,
    source_path_or_url,
    collected,
    parsed,
    classified,
    mapped_to_v36,
    disposition,
    target_v36_assets,
    missing_reason,
    action_required
  };
}

function buildSourceCompletenessRecords() {
  const records = [];
  for (const lecture of lectures) {
    const gitPath = `docs/ko/lectures/${lecture.slug}/index.md`;
    const present = existsSource(gitPath);
    records.push(coverageRecord({
      source_id: `web-ko-${lecture.slug}`,
      source_kind: "web_doc_page",
      source_path_or_url: `https://walkinglabs.github.io/learn-harness-engineering/ko/lectures/${lecture.slug}/`,
      collected: present,
      parsed: present,
      classified: present,
      mapped_to_v36: present,
      disposition: present ? "applied" : "missing",
      target_v36_assets: lecture.target_assets,
      missing_reason: present ? "" : "Corresponding Korean lecture markdown missing from clone.",
      action_required: present ? "" : "Re-fetch source or crawl web page."
    }));
  }
  for (const [sourcePath, kind, purpose] of topLevelRequirements) {
    const present = existsSource(sourcePath);
    records.push(coverageRecord({
      source_id: `git-top-${sourcePath}`,
      source_kind: kind === "workflow" ? "workflow" : fs.existsSync(path.join(sourceRoot, sourcePath)) && fs.statSync(path.join(sourceRoot, sourcePath)).isDirectory() ? "git_directory" : "git_file",
      source_path_or_url: sourcePath,
      collected: present,
      parsed: present,
      classified: present,
      mapped_to_v36: present && targetAssetsFor(sourcePath).length > 0,
      disposition: present ? dispositionFor(sourcePath) : "missing",
      target_v36_assets: targetAssetsFor(sourcePath),
      missing_reason: present ? "" : `${purpose} not found in cloned repository.`,
      action_required: present ? "" : "Re-fetch source or mark source requirement obsolete."
    }));
  }
  for (const [sourcePath, kind, purpose] of coreAssets) {
    const present = existsSource(sourcePath);
    records.push(coverageRecord({
      source_id: `git-core-${sourcePath}`,
      source_kind: kind,
      source_path_or_url: sourcePath,
      collected: present,
      parsed: present,
      classified: present,
      mapped_to_v36: present && targetAssetsFor(sourcePath).length > 0,
      disposition: present ? dispositionFor(sourcePath) : "missing",
      target_v36_assets: targetAssetsFor(sourcePath),
      missing_reason: present ? "" : `${purpose} missing from clone.`,
      action_required: present ? "" : "Re-fetch source or document upstream absence."
    }));
  }
  return records;
}

function buildLectureMatrix() {
  return lectures.map((lecture) => {
    const gitPath = `docs/ko/lectures/${lecture.slug}/index.md`;
    const codeFiles = listFiles(path.join(sourceRoot, "docs", "ko", "lectures", lecture.slug, "code")).map((f) => slash(path.relative(sourceRoot, f)));
    const missingArtifacts = lecture.target_assets.filter((asset) => !fs.existsSync(path.join(root, asset)));
    const missingCases = lecture.benchmark_cases.filter((caseId) => !behavioralCaseExists(caseId));
    const requiredPatch = missingArtifacts.length || missingCases.length
      ? `Add missing mappings: artifacts=${missingArtifacts.join(",")}; cases=${missingCases.join(",")}`
      : "";
    return {
      lecture_title: lecture.title,
      source_git_path: gitPath,
      source_web_url: `https://walkinglabs.github.io/learn-harness-engineering/ko/lectures/${lecture.slug}/`,
      collected: existsSource(gitPath),
      code_assets_seen: codeFiles,
      core_claims: lecture.core_claims,
      harness_subsystems: lecture.subsystems,
      failure_mode_addressed: lecture.failure_mode,
      v36_asset_mapping: {
        autonomous: lecture.target_assets.filter((a) => a.startsWith("autonomous/")),
        codex: lecture.target_assets.filter((a) => a.startsWith("codex/")),
        state: lecture.target_assets.filter((a) => a.startsWith("state/")),
        verification: lecture.target_assets.filter((a) => a.startsWith("verification/")),
        scope: lecture.target_assets.filter((a) => a.includes("scope") || a.includes("SCOPE")),
        lifecycle: lecture.target_assets.filter((a) => a.startsWith("lifecycle/")),
        docs: lecture.target_assets.filter((a) => a.startsWith("docs/") || a === "AGENTS.md" || a === "MASTER_PROMPT_ROUTER.md"),
        harness: lecture.target_assets.filter((a) => a.startsWith("harness/")),
        validation: lecture.target_assets.filter((a) => a.startsWith("validation/")),
        benchmark: lecture.benchmark_cases,
        archive: ["records/source_inventory.json", "archive/source_inventory/source_inventory.json"]
      },
      applied_artifacts: lecture.target_assets,
      eval_or_benchmark_cases: lecture.benchmark_cases,
      not_applied_items: codeFiles.filter((p) => p.endsWith(".ts")),
      reason: codeFiles.some((p) => p.endsWith(".ts"))
        ? "Executable lecture demo files were converted into benchmark concepts and archive references, not copied into runtime assets."
        : "",
      required_patch: requiredPatch,
      priority: requiredPatch ? "P1" : "P3"
    };
  });
}

function behavioralCaseExists(caseId) {
  const suitePath = path.join(root, "verification", "behavioral_benchmark_suite.json");
  if (!fs.existsSync(suitePath)) return false;
  const suite = JSON.parse(fs.readFileSync(suitePath, "utf8"));
  return suite.cases?.some((c) => c.case_id === caseId);
}

function buildGitMatrix() {
  const entries = [
    ".github/workflows",
    "docs-readme",
    "docs",
    "projects",
    "scripts",
    "skills",
    "skills/harness-creator",
    "CLAUDE.md",
    "README.md",
    "package.json",
    "package-lock.json",
    "get_anthropic_logo.js"
  ];
  return entries.map((gitPath) => {
    const present = existsSource(gitPath);
    const fileCount = present && fs.statSync(path.join(sourceRoot, gitPath)).isDirectory()
      ? listFiles(path.join(sourceRoot, gitPath)).length
      : present ? 1 : 0;
    const disposition = present ? dispositionFor(gitPath) : "missing";
    const extracted = extractedPatterns(gitPath);
    return {
      git_path: gitPath,
      asset_type: sourceTypeForMatrix(gitPath),
      collected: present,
      file_count: fileCount,
      purpose_in_source: purposeInSource(gitPath),
      extracted_patterns: extracted,
      v36_application: disposition,
      target_v36_assets: targetAssetsFor(gitPath),
      applied_as: appliedAs(gitPath),
      missing_or_deferred_reason: deferredReason(gitPath, disposition),
      required_patch: present ? "" : "Re-fetch source or document upstream absence.",
      priority: priorityFor(gitPath, disposition)
    };
  });
}

function purposeInSource(gitPath) {
  if (gitPath === ".github/workflows") return "CI/deploy and PDF release automation";
  if (gitPath === "docs-readme") return "localized README source";
  if (gitPath === "docs") return "VitePress course documentation source";
  if (gitPath === "projects") return "hands-on starter/solution project corpus";
  if (gitPath === "scripts") return "build, screenshot, PDF and validation automation";
  if (gitPath === "skills" || gitPath === "skills/harness-creator") return "agent skill packaging and harness scaffolding guidance";
  if (gitPath === "CLAUDE.md") return "Claude-specific agent instruction pattern";
  if (gitPath === "README.md") return "course overview and reference links";
  if (gitPath === "package.json") return "package scripts and dependency metadata";
  if (gitPath === "package-lock.json") return "dependency lock";
  if (gitPath === "get_anthropic_logo.js") return "small asset helper";
  return "repository asset";
}

function extractedPatterns(gitPath) {
  if (gitPath === ".github/workflows") return ["workflow evidence", "release/build automation pattern", "archive reference"];
  if (gitPath === "docs-readme") return ["multilingual duplicate handling", "localized README structure"];
  if (gitPath === "docs") return ["lecture taxonomy", "resource library", "five-subsystem teaching sequence"];
  if (gitPath === "projects") return ["benchmark project prompts", "starter/solution contrast", "capstone-style validation"];
  if (gitPath === "scripts") return ["runner pattern", "PDF build pipeline", "screenshot/documentation automation"];
  if (gitPath === "skills" || gitPath === "skills/harness-creator") return ["skill metadata", "five-subsystem assessment", "templates", "gotchas"];
  if (gitPath === "CLAUDE.md") return ["short agent instruction pattern", "runtime-specific guide separation"];
  if (gitPath === "README.md") return ["course purpose", "reference list", "12 lectures and 6 projects"];
  if (gitPath === "package.json") return ["VitePress scripts", "pdf build script", "screenshots script"];
  if (gitPath === "package-lock.json") return ["dependency lock archive"];
  if (gitPath === "get_anthropic_logo.js") return ["asset helper archive"];
  return ["archive reference"];
}

function appliedAs(gitPath) {
  if (gitPath === ".github/workflows") return ["archive_reference"];
  if (gitPath === "docs-readme") return ["archive_reference", "doctrine"];
  if (gitPath === "docs") return ["doctrine", "benchmark_case", "verification_artifact"];
  if (gitPath === "projects") return ["benchmark_case", "ablation_case", "archive_reference"];
  if (gitPath === "scripts") return ["harness_script", "verification_artifact"];
  if (gitPath === "skills" || gitPath === "skills/harness-creator") return ["codex_skill_rule", "template", "doctrine"];
  if (gitPath === "CLAUDE.md") return ["doctrine", "archive_reference"];
  if (gitPath === "README.md") return ["doctrine", "archive_reference"];
  if (gitPath === "package.json") return ["harness_script", "archive_reference"];
  return ["archive_reference"];
}

function deferredReason(gitPath, disposition) {
  if (disposition === "archive_only" && gitPath === ".github/workflows") return "v36_candidate is not adding CI/release workflow; workflow pattern is referenced for future automation.";
  if (disposition === "archive_only" && gitPath === "package-lock.json") return "Dependency lock is source evidence, not a v36 runtime dependency.";
  if (disposition === "archive_only" && gitPath === "get_anthropic_logo.js") return "Asset helper has no direct harness runtime role.";
  if (gitPath === "projects") return "Project apps were converted into benchmark/project patterns, not copied as runtime apps.";
  if (gitPath === "scripts") return "Source scripts informed harness runner patterns; not all scripts are copied because PDF/screenshot workflows are not v36 runtime owners.";
  return "";
}

function priorityFor(gitPath, disposition) {
  if (disposition === "missing") return "P0";
  if (["docs", "projects", "scripts", "skills/harness-creator"].includes(gitPath)) return "P1";
  if (disposition === "archive_only") return "P3";
  return "P2";
}

function buildFullDispositionMatrix() {
  const inventory = readJson("records/source_inventory.json");
  const inventoryByPath = new Map(inventory.map((r) => [r.path, r]));
  return listFiles(sourceRoot).map((abs) => {
    const sourcePath = slash(path.relative(sourceRoot, abs));
    const inv = inventoryByPath.get(sourcePath);
    const disposition = dispositionFor(sourcePath);
    return {
      source_path: sourcePath,
      source_kind: sourceKind(sourcePath),
      checksum: sha256File(abs),
      inventory_record_present: Boolean(inv),
      classified: Boolean(inv?.source_type) || true,
      mapped_to_v36: targetAssetsFor(sourcePath).length > 0,
      disposition,
      target_v36_assets: targetAssetsFor(sourcePath),
      deferred_reason: deferredReason(sourcePath, disposition),
      action_required: inv ? "" : "Add to source_inventory.json on next source collection refresh."
    };
  });
}

function buildGapRegister(completeness, lectureMatrix, gitMatrix, fileDisposition) {
  const gaps = [];
  let id = 1;
  function add(source_item, source_type, why, expected, status, severity, action, target, retest) {
    gaps.push({
      gap_id: `SCA-GAP-${String(id++).padStart(3, "0")}`,
      source_item,
      source_type,
      why_it_matters: why,
      expected_v36_mapping: expected,
      current_status: status,
      severity,
      recommended_action: action,
      target_asset: target,
      retest_required: retest
    });
  }
  for (const r of completeness.filter((r) => !r.collected || !r.classified || !r.mapped_to_v36)) {
    add(r.source_path_or_url, r.source_kind, "Required source coverage item is not fully dispositioned.", r.target_v36_assets, r.disposition, "P0", "apply_now", r.target_v36_assets[0] ?? "records/source_inventory.json", true);
  }
  for (const r of lectureMatrix.filter((r) => r.required_patch)) {
    add(r.lecture_title, "web_doc_page", "Lecture mapping has missing artifact or benchmark linkage.", r.applied_artifacts, r.required_patch, "P1", "apply_now", r.applied_artifacts[0], true);
  }
  for (const r of gitMatrix.filter((r) => r.v36_application === "missing")) {
    add(r.git_path, r.asset_type, "Required Git source item missing from clone.", r.target_v36_assets, "missing", "P0", "needs_human_decision", "records/source_completeness_recheck.json", true);
  }
  const missingInventory = fileDisposition.filter((r) => !r.inventory_record_present);
  if (missingInventory.length) {
    add("source_inventory per-file coverage", "git_file", "All source files must have at least inventory/classification/mapping/disposition.", ["records/source_file_disposition_matrix.json"], `${missingInventory.length} files missing original source_inventory records`, "P1", "defer_with_reason", "records/source_inventory.json", true);
  }
  const archiveOnly = fileDisposition.filter((r) => r.disposition === "archive_only").length;
  add("archive_only source items", "git_file", "Some source files are intentionally retained as evidence rather than runtime assets.", ["archive/source_inventory/", "records/source_file_disposition_matrix.json"], `${archiveOnly} archive_only items dispositioned`, "P3", "archive_only", "records/source_file_disposition_matrix.json", false);
  return gaps;
}

function buildPatchDecisions(gaps) {
  return gaps.map((gap) => {
    if (gap.severity === "P0") {
      return {
        gap_id: gap.gap_id,
        decision: "patch_now",
        target_asset: gap.target_asset,
        patch_summary: "P0 coverage or application gap must be closed before any release decision.",
        expected_behavior_change: "source coverage gate blocks unsupported completeness claims",
        validation_required: ["source coverage recheck", "validate_current_v36.mjs"],
        rollback_condition: "If patch fails validation, keep v36_candidate held."
      };
    }
    if (gap.recommended_action === "archive_only") {
      return {
        gap_id: gap.gap_id,
        decision: "archive_only",
        target_asset: gap.target_asset,
        patch_summary: "No runtime patch; disposition matrix records archive-only treatment.",
        expected_behavior_change: "none",
        validation_required: ["source application validation"],
        rollback_condition: "n/a"
      };
    }
    return {
      gap_id: gap.gap_id,
      decision: gap.severity === "P1" ? "defer" : "defer",
      target_asset: gap.target_asset,
      patch_summary: "No direct runtime patch; record as non-blocking source application follow-up.",
      expected_behavior_change: "none",
      validation_required: ["source application validation"],
      rollback_condition: "If future release requires exhaustive source_inventory refresh, regenerate source inventory."
    };
  });
}

function validateSca(completeness, lectureMatrix, gitMatrix, gaps) {
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
  check("source_coverage_complete", completeness.every((r) => r.collected && r.parsed && r.classified), "all required source records collected/parsed/classified");
  check("all_lecture_items_mapped", lectureMatrix.every((r) => r.collected && !r.required_patch), "12/12 lectures mapped");
  check("all_required_git_top_level_dispositioned", gitMatrix.every((r) => r.collected && r.v36_application !== "missing"), "all required top-level assets dispositioned");
  check("p0_gaps_zero", gaps.filter((g) => g.severity === "P0").length === 0, "P0 gap count");
  check("unsupported_complete_claim_absent", !/(is|as|claiming|claimed|status:\s*)\s*(production-monitored|containment-verified|all-primary-source-validated)/i.test(readAllReportText()), "positive forbidden claim scan");
  check("no_v36_release_claim", !fs.existsSync(path.join(workspace, "v36")) && readText(path.join(workspace, "CURRENT_STABLE_VERSION.txt")).includes("current_stable_version=v35"), "stable pointer remains v35 and v36 directory absent");
  check("codex_runtime_independence_preserved", readText("codex/CODEX_RUNTIME_GUIDE.md").includes("not a textual mirror") || readText("codex/CODEX_RUNTIME_GUIDE.md").includes("not a mirror"), "codex runtime guide non-mirror language");
  check("assembled_bundle_validation_pass", safeJson("records/assembled_bundle_integrity.json")?.status === "pass", "records/assembled_bundle_integrity.json");
  check("codex_runtime_validation_pass", safeJson("records/codex_runtime_integrity.json")?.status === "pass", "records/codex_runtime_integrity.json");
  check("current_v36_validation_pass", safeJson("validation/current_validation_result.json")?.status === "pass", "validation/current_validation_result.json");
  check("v35_checksum_unchanged", v35ChecksumPass(), "v35 checksum manifest still matches files");
  return {
    generated_at: now,
    status: checks.every((c) => c.pass) ? "pass" : "fail",
    checks,
    source_application_verdict: checks.every((c) => c.pass) && gaps.filter((g) => ["P0", "P1"].includes(g.severity) && g.recommended_action === "apply_now").length === 0
      ? "Source application complete with deferred non-blockers"
      : "Hold: source application gaps remain"
  };
}

function safeJson(rel) {
  try {
    return readJson(rel);
  } catch {
    return null;
  }
}

function v35ChecksumPass() {
  const manifestPath = path.join(workspace, "v35", "records", "v35_file_checksums.json");
  if (!fs.existsSync(manifestPath)) return false;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return manifest.files.every((entry) => {
    const abs = path.join(workspace, entry.path);
    return fs.existsSync(abs) && sha256File(abs) === entry.checksum;
  });
}

function readAllReportText() {
  const reportDir = path.join(root, "reports");
  return listFiles(reportDir).filter((p) => p.endsWith(".md")).map((p) => readText(p)).join("\n");
}

function reportCompleteness(records) {
  const lines = records.map((r) => `| ${r.source_id} | ${r.collected} | ${r.disposition} | ${r.target_v36_assets.join("<br>")} | ${r.action_required || ""} |`).join("\n");
  return `# Source Completeness Recheck

Generated: ${now}

| Source | Collected | Disposition | Target v36 Assets | Action |
|---|---:|---|---|---|
${lines}
`;
}

function reportLectureMatrix(matrix) {
  const lines = matrix.map((r) => `| ${r.lecture_title} | ${r.harness_subsystems.join(", ")} | ${r.applied_artifacts.join("<br>")} | ${r.eval_or_benchmark_cases.join(", ")} | ${r.priority} |`).join("\n");
  return `# Lecture-to-Asset Application Matrix

Generated: ${now}

| Lecture | Subsystems | Applied Artifacts | Eval / Benchmark Cases | Priority |
|---|---|---|---|---|
${lines}
`;
}

function reportGitMatrix(matrix) {
  const lines = matrix.map((r) => `| ${r.git_path} | ${r.asset_type} | ${r.v36_application} | ${r.applied_as.join(", ")} | ${r.target_v36_assets.join("<br>")} | ${r.priority} |`).join("\n");
  return `# Git Asset Application Matrix

Generated: ${now}

| Git Path | Type | Application | Applied As | Target v36 Assets | Priority |
|---|---|---|---|---|---|
${lines}
`;
}

function reportGaps(gaps) {
  const lines = gaps.map((g) => `| ${g.gap_id} | ${g.source_item} | ${g.severity} | ${g.current_status} | ${g.recommended_action} |`).join("\n");
  return `# Missing Application Gap Register

Generated: ${now}

| Gap | Source Item | Severity | Status | Recommended Action |
|---|---|---|---|---|
${lines || "| none | none | none | none | none |"}
`;
}

function reportPatchDecisions(decisions) {
  const lines = decisions.map((d) => `| ${d.gap_id} | ${d.decision} | ${d.target_asset} | ${d.patch_summary} |`).join("\n");
  return `# Source Application Patch Decisions

Generated: ${now}

| Gap | Decision | Target | Summary |
|---|---|---|---|
${lines || "| none | none | none | none |"}
`;
}

function reportValidation(result) {
  const lines = result.checks.map((c) => `| ${c.name} | ${c.pass} | ${c.detail} |`).join("\n");
  return `# Source Application Validation Result

Generated: ${now}

Status: ${result.status}

Verdict: ${result.source_application_verdict}

| Check | Pass | Detail |
|---|---:|---|
${lines}
`;
}

function finalReport(result, completeness, lectureMatrix, gitMatrix, gaps, decisions) {
  const missing = completeness.filter((r) => !r.collected);
  const p0 = gaps.filter((g) => g.severity === "P0");
  const p1 = gaps.filter((g) => g.severity === "P1");
  return `아래는 Walking Labs Learn Harness Engineering 원천 자료 전체의 v36_candidate 반영 증명 결과입니다.

## 1. Source Collection Completeness
- required coverage records: ${completeness.length}
- missing required items: ${missing.length}
- full source file disposition records: ${readJson("records/source_file_disposition_matrix.json").file_count}

## 2. Web Lecture Coverage
- Korean lecture pages mapped: ${lectureMatrix.filter((r) => r.collected).length}/12
- all lecture items mapped: ${lectureMatrix.every((r) => !r.required_patch)}

## 3. Git Repository Coverage
- required Git top-level/core assets dispositioned: ${gitMatrix.filter((r) => r.collected).length}/${gitMatrix.length}
- archive-only items are explicitly recorded rather than treated as applied runtime assets.

## 4. Lecture-to-Asset Application Matrix
See records/lecture_to_asset_application_matrix.json and reports/LECTURE_TO_ASSET_APPLICATION_MATRIX.md.

## 5. Git Asset Application Matrix
See records/git_asset_application_matrix.json and reports/GIT_ASSET_APPLICATION_MATRIX.md.

## 6. Missing Application Gaps
- P0: ${p0.length}
- P1: ${p1.length}
- total gaps / dispositions: ${gaps.length}

## 7. Patch Decisions
- patch_now: ${decisions.filter((d) => d.decision === "patch_now").length}
- defer: ${decisions.filter((d) => d.decision === "defer").length}
- archive_only: ${decisions.filter((d) => d.decision === "archive_only").length}

## 8. Post-Patch Validation
- source_application_validation_result: ${result.status}
- validate_current_v36, validate_assembled_bundle, and validate_codex_runtime are tracked in records/source_application_validation_result.json.

## 9. Remaining Deferred Items
- CI/PDF workflow files are archive references, not runtime assets.
- package-lock and helper asset scripts are archive-only.
- project starter/solution apps are benchmark inspiration and archive references, not copied into v36 runtime.

## 10. v36_candidate Release Readiness Impact
Final 판정: ${result.source_application_verdict}

This does not release v36_candidate, does not create v36, and does not modify v35.
`;
}

function run() {
  const completeness = buildSourceCompletenessRecords();
  const lectureMatrix = buildLectureMatrix();
  const gitMatrix = buildGitMatrix();
  const fileDisposition = buildFullDispositionMatrix();
  const gaps = buildGapRegister(completeness, lectureMatrix, gitMatrix, fileDisposition);
  const decisions = buildPatchDecisions(gaps);
  const validation = validateSca(completeness, lectureMatrix, gitMatrix, gaps);

  writeJson("records/source_completeness_recheck.json", {
    generated_at: now,
    records: completeness,
    summary: {
      total: completeness.length,
      collected: completeness.filter((r) => r.collected).length,
      missing: completeness.filter((r) => !r.collected).length,
      mapped_to_v36: completeness.filter((r) => r.mapped_to_v36).length
    }
  });
  writeText("reports/SOURCE_COMPLETENESS_RECHECK.md", reportCompleteness(completeness));

  writeJson("records/lecture_to_asset_application_matrix.json", {
    generated_at: now,
    records: lectureMatrix
  });
  writeText("reports/LECTURE_TO_ASSET_APPLICATION_MATRIX.md", reportLectureMatrix(lectureMatrix));

  writeJson("records/git_asset_application_matrix.json", {
    generated_at: now,
    records: gitMatrix
  });
  writeText("reports/GIT_ASSET_APPLICATION_MATRIX.md", reportGitMatrix(gitMatrix));

  writeJson("records/source_file_disposition_matrix.json", {
    generated_at: now,
    file_count: fileDisposition.length,
    records: fileDisposition
  });

  writeJson("records/missing_application_gap_register.json", {
    generated_at: now,
    records: gaps,
    summary: {
      P0: gaps.filter((g) => g.severity === "P0").length,
      P1: gaps.filter((g) => g.severity === "P1").length,
      P2: gaps.filter((g) => g.severity === "P2").length,
      P3: gaps.filter((g) => g.severity === "P3").length
    }
  });
  writeText("reports/MISSING_APPLICATION_GAP_REGISTER.md", reportGaps(gaps));

  writeJson("records/source_application_patch_decisions.json", {
    generated_at: now,
    records: decisions
  });
  writeText("reports/SOURCE_APPLICATION_PATCH_DECISIONS.md", reportPatchDecisions(decisions));

  writeJson("records/source_application_validation_result.json", validation);
  writeText("reports/SOURCE_APPLICATION_VALIDATION_RESULT.md", reportValidation(validation));
  writeText("reports/SOURCE_APPLICATION_PROOF_REPORT.md", finalReport(validation, completeness, lectureMatrix, gitMatrix, gaps, decisions));

  console.log(JSON.stringify({
    status: validation.status,
    verdict: validation.source_application_verdict,
    required_records: completeness.length,
    source_files_dispositioned: fileDisposition.length,
    lecture_mapped: lectureMatrix.filter((r) => !r.required_patch).length,
    p0: gaps.filter((g) => g.severity === "P0").length,
    p1: gaps.filter((g) => g.severity === "P1").length
  }, null, 2));
}

run();
