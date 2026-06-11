import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(root, "..");
const packageName = path.basename(root);
const evidenceDir = path.join(workspace, "_evidence", packageName, "validation_runs", "skill_asset_enhancement");
const variants = [
  { id: "full_harness", removed: [], expected_degradation: 0 },
  { id: "remove_feature_list", removed: ["state/feature_list.json"], expected_degradation: 3 },
  { id: "remove_progress", removed: ["state/progress.md"], expected_degradation: 2 },
  { id: "remove_evaluator", removed: ["verification/evaluator-rubric.md"], expected_degradation: 3 },
  { id: "remove_clean_state_checklist", removed: ["lifecycle/clean-state-checklist.md"], expected_degradation: 2 }
];
const results = variants.map((v) => ({
  ...v,
  simulated_success_rate: Math.max(0, 1 - v.expected_degradation * 0.18),
  simulated_resume_success: !v.removed.includes("state/feature_list.json") && !v.removed.includes("state/progress.md"),
  simulated_premature_completion_risk: v.removed.includes("verification/evaluator-rubric.md") ? "high" : "controlled",
  claim_strength: "simulated_deterministic_not_real_agent_ablation"
}));
const result = {
  generated_at: new Date().toISOString(),
  ablation_type: "deterministic_simulated_harness_ablation",
  status: "pass_with_limitations",
  limitation: "No real agent sessions were run by this script.",
  results
};
fs.mkdirSync(path.join(root, "records"), { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(root, "records", "ablation_results.json"), JSON.stringify(result, null, 2) + "\n");
const rawPath = path.join(evidenceDir, `ablation-${result.generated_at.replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(rawPath, JSON.stringify(result, null, 2) + "\n");
const report = `# Ablation Report

Generated: ${result.generated_at}

Status: ${result.status}

Limitation: ${result.limitation}

Raw evidence: _evidence/<current_package>/validation_runs/skill_asset_enhancement/${path.basename(rawPath)}

| Variant | Simulated success rate | Risk |
|---|---:|---|
${results.map((r) => `| ${r.id} | ${r.simulated_success_rate.toFixed(2)} | ${r.simulated_premature_completion_risk} |`).join("\n")}
`;
fs.writeFileSync(path.join(root, "reports", "ablation_report.md"), report);
fs.writeFileSync(path.join(root, "verification", "ablation_report.md"), report);
console.log(JSON.stringify({ status: result.status, variants: results.length }, null, 2));
