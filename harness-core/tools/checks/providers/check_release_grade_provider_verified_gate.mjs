#!/usr/bin/env node
import { checkReleaseGradeProviderVerifiedGate, resolveRoot } from "../../lib/release_grade_reinforcement.mjs";

const report = checkReleaseGradeProviderVerifiedGate(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);

