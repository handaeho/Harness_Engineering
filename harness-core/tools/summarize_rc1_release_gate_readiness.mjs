#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildRc1ReleaseGateDryRunArtifacts, evidenceRelDir, resolveRoot } from "./run_rc1_release_gate_dry_run_openai_scope.mjs";

const root = resolveRoot();
const artifacts = buildRc1ReleaseGateDryRunArtifacts(root);
if (artifacts.blocked) {
  console.log(JSON.stringify(artifacts.blocked, null, 2));
  process.exitCode = 1;
} else {
  const readiness = readJson(path.join(root, evidenceRelDir, "rc1_release_gate_readiness_assessment.json"));
  console.log(JSON.stringify(readiness, null, 2));
}
