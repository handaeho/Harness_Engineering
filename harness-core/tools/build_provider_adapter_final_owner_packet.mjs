#!/usr/bin/env node
import { buildProviderAdapterFinalOwnerPacket, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = buildProviderAdapterFinalOwnerPacket(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.provider_verified_allowed === false && report.adapter_checked_allowed === false ? 0 : 1);
