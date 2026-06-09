#!/usr/bin/env node
import { assessGeneralReadinessStabilityPreflight, resolveRoot } from "../../lib/post_final_export_strict_claims_autopilot.mjs";
const report = assessGeneralReadinessStabilityPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "blocked_by_strict_claim_gaps" ? 0 : 1);
