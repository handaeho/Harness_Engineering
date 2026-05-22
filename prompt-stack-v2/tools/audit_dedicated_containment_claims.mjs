#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildPostExecutionAuditArtifacts, resolveRoot } from "./review_dedicated_containment_results.mjs";

const root = resolveRoot();
buildPostExecutionAuditArtifacts(root);
const audit = readJson(path.join(
  root,
  "evidence",
  "beta-containment-post-execution-claim-audit",
  "containment_claim_boundary_audit.json"
));

console.log(JSON.stringify(audit, null, 2));
