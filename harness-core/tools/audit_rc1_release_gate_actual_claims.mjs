#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildRc1ActualGateArtifacts, evidenceRelDir, resolveRoot } from "./run_rc1_release_gate_actual_openai_scope.mjs";

const root = resolveRoot();
buildRc1ActualGateArtifacts(root);

const boundary = readJson(path.join(root, ...evidenceRelDir.split("/"), "rc1_release_gate_actual_claim_boundary.json"));
console.log(JSON.stringify({
  status: boundary.status,
  scope: boundary.scope,
  rc1_openai_scope_release_gated_allowed: boundary.rc1_openai_scope_release_gated_allowed,
  stable_allowed: boundary.stable_allowed,
  production_ready_allowed: boundary.production_ready_allowed,
  production_monitored_allowed: boundary.production_monitored_allowed,
  provider_diverse_allowed: boundary.provider_diverse_allowed,
  provider_verified_allowed: boundary.provider_verified_allowed,
  adapter_checked_allowed: boundary.adapter_checked_allowed,
  local_model_verified_allowed: boundary.local_model_verified_allowed
}, null, 2));

