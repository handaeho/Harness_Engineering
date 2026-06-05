#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildReleaseBlockerReevaluationArtifacts, resolveRoot } from "./reevaluate_release_blockers.mjs";

const root = resolveRoot();
buildReleaseBlockerReevaluationArtifacts(root);
const rc1 = readJson(path.join(
  root,
  "evidence",
  "beta-release-blocker-p0-p1-reevaluation",
  "rc1_readiness_assessment.json"
));

console.log(JSON.stringify(rc1, null, 2));
