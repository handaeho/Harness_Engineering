#!/usr/bin/env node
import { checkProviderVerifiedOwnerDecisionPacket, resolveRoot } from "./lib/provider_adapter_export_autopilot.mjs";

const report = checkProviderVerifiedOwnerDecisionPacket(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "pass" ? 0 : 1);
