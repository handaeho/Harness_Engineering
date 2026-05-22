#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildContainmentVerifiedDecisionGateArtifacts, resolveRoot } from "./run_containment_verified_decision_gate.mjs";

const root = resolveRoot();
buildContainmentVerifiedDecisionGateArtifacts(root, process.argv);
const audit = readJson(path.join(
  root,
  "evidence",
  "beta-containment-verified-decision-gate",
  "containment_verified_claim_boundary_audit.json"
));

console.log(JSON.stringify(audit, null, 2));
