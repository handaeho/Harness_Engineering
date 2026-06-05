#!/usr/bin/env node
import { checkGeneralReadinessStabilityPreflight, resolveRoot } from "./lib/post_final_export_strict_claims_autopilot.mjs";
const report = checkGeneralReadinessStabilityPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
