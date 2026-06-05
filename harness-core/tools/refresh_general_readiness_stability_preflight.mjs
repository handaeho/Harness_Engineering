#!/usr/bin/env node
import { resolveRoot, refreshGeneralReadinessStabilityPreflight } from "./lib/post_export_provider_adapter_coverage_hardening_autopilot.mjs";

const report = refreshGeneralReadinessStabilityPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
