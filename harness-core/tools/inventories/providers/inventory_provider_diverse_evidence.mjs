#!/usr/bin/env node
import { inventoryProviderDiverseEvidence, resolveRoot } from "../../lib/strict_paths_autopilot.mjs";

const report = inventoryProviderDiverseEvidence(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status ? 0 : 1);
