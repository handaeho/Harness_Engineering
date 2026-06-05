#!/usr/bin/env node
import { checkFinalExportExecutionPreflight, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = checkFinalExportExecutionPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
