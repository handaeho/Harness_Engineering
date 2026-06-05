#!/usr/bin/env node
import { buildAdapterCheckedOwnerDecisionPacket, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = buildAdapterCheckedOwnerDecisionPacket(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.adapter_checked_allowed === false ? 0 : 1);
