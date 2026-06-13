#!/usr/bin/env node
import { checkReleaseGradeAdapterVllmPreflight, resolveRoot } from "../../lib/release_grade_reinforcement.mjs";

const report = checkReleaseGradeAdapterVllmPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);

