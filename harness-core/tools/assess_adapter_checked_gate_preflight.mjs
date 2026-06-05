#!/usr/bin/env node
import { assessAdapterCheckedGatePreflight, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = assessAdapterCheckedGatePreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.adapter_checked_gate_preflight_completed === true ? 0 : 1);
