#!/usr/bin/env node
import { completeProviderVerifiedCoverage, resolveRoot } from "./lib/post_final_export_strict_claims_autopilot.mjs";
const report = completeProviderVerifiedCoverage(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "keep_blocked_recommended" || report.status === "ready_for_provider_verified_final_gate" ? 0 : 1);
