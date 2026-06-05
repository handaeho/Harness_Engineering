#!/usr/bin/env node
import { assessProviderVerifiedGatePreflight, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = assessProviderVerifiedGatePreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.provider_verified_gate_preflight_completed === true ? 0 : 1);
