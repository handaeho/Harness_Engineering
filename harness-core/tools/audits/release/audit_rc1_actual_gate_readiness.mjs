#!/usr/bin/env node
import { buildRc1ActualGatePreflightArtifacts, resolveRoot } from "../../runners/openai/run_rc1_release_gate_actual_preflight_openai_scope.mjs";

const root = resolveRoot();
const artifacts = buildRc1ActualGatePreflightArtifacts(root);

console.log(JSON.stringify({
  status: artifacts.readiness.status,
  stage: artifacts.report.stage,
  evidence_readiness: artifacts.evidence.status,
  rollback_readiness: artifacts.rollback.status,
  owner_action_readiness: artifacts.owner.status,
  explicit_user_approval_present: artifacts.report.explicit_user_approval_present,
  can_execute_release_gate_actual: artifacts.report.can_execute_release_gate_actual,
  release_gate_actual_execution: artifacts.report.release_gate_actual_execution,
  release_gated_allowed: artifacts.report.release_gated_allowed,
  stable_allowed: artifacts.report.stable_allowed,
  provider_diverse_allowed: artifacts.report.provider_diverse_allowed
}, null, 2));

