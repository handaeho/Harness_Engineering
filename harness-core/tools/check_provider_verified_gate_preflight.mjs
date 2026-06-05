#!/usr/bin/env node
import { checkProviderVerifiedGatePreflight, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = checkProviderVerifiedGatePreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
