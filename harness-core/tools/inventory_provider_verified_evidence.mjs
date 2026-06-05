#!/usr/bin/env node
import { inventoryProviderVerifiedEvidence, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = inventoryProviderVerifiedEvidence(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.provider_verified_allowed === false ? 0 : 1);
