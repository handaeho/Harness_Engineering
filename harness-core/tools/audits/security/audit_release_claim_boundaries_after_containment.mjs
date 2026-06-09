#!/usr/bin/env node
import path from "node:path";
import { readJson } from "../../lib/file_walk.mjs";
import { buildReleaseBlockerReevaluationArtifacts, resolveRoot } from "../../evaluations/release/reevaluate_release_blockers.mjs";

const root = resolveRoot();
buildReleaseBlockerReevaluationArtifacts(root);
const boundary = readJson(path.join(
  root,
  "evidence",
  "beta-release-blocker-p0-p1-reevaluation",
  "claim_boundary_after_containment.json"
));

console.log(JSON.stringify(boundary, null, 2));
