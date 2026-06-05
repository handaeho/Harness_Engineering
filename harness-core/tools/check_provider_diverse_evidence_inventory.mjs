#!/usr/bin/env node
import { checkProviderDiverseEvidenceInventory, resolveRoot } from "./lib/strict_paths_autopilot.mjs";

const report = checkProviderDiverseEvidenceInventory(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
