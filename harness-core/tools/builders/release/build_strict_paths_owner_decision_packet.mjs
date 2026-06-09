#!/usr/bin/env node
import { buildStrictPathsOwnerDecisionPacket, resolveRoot } from "../../lib/strict_paths_autopilot.mjs";

const report = buildStrictPathsOwnerDecisionPacket(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status ? 0 : 1);
