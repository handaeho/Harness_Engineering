#!/usr/bin/env node
import { checkReleaseGradeAdapterOllamaPreflight, resolveRoot } from "../../lib/release_grade_reinforcement.mjs";

const report = checkReleaseGradeAdapterOllamaPreflight(resolveRoot());
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === "fail" ? 1 : 0);
