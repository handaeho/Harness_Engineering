#!/usr/bin/env node
import { completeAdapterCheckedCoverage, resolveRoot } from "./lib/post_final_export_strict_claims_autopilot.mjs";
const report = completeAdapterCheckedCoverage(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "blocked_by_missing_openai_full_conformance" || report.status === "ready_for_adapter_checked_final_gate" ? 0 : 1);
