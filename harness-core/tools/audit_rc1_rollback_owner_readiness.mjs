#!/usr/bin/env node
import { buildRc1ActualGatePreflightArtifacts, resolveRoot } from "./run_rc1_release_gate_actual_preflight_openai_scope.mjs";

const root = resolveRoot();
const artifacts = buildRc1ActualGatePreflightArtifacts(root);
const status = artifacts.rollback.status === "pass" && artifacts.owner.status === "pass"
  ? "pass"
  : "needs_review";

console.log(JSON.stringify({
  status,
  stage: artifacts.report.stage,
  rollback: artifacts.rollback,
  owner_action: artifacts.owner
}, null, 2));

