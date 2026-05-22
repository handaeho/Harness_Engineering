#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildRc1ActualGateArtifacts, evidenceRelDir, resolveRoot } from "./run_rc1_release_gate_actual_openai_scope.mjs";

const root = resolveRoot();
buildRc1ActualGateArtifacts(root);

const dir = path.join(root, ...evidenceRelDir.split("/"));
const report = readJson(path.join(dir, "rc1_release_gate_actual_report.json"));
const decision = readJson(path.join(dir, "rc1_release_decision_record.json"));

console.log(JSON.stringify({
  status: report.status,
  stage: report.stage,
  scope: report.scope,
  approval_phrase_verified: report.approval_phrase_verified,
  release_gate_actual_execution: report.release_gate_actual_execution,
  openai_scope_release_gate_passed: report.openai_scope_release_gate_passed,
  rc1_openai_scope_release_gated_allowed: report.rc1_openai_scope_release_gated_allowed,
  stable_allowed: report.stable_allowed,
  production_ready_allowed: report.production_ready_allowed,
  provider_diverse_allowed: report.provider_diverse_allowed,
  decision: decision.decision
}, null, 2));

