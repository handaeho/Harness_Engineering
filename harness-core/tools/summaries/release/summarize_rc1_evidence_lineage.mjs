#!/usr/bin/env node
import path from "node:path";
import { readJson } from "../../lib/file_walk.mjs";
import { buildRc1OpenAiScopeBundleArtifacts, resolveRoot } from "../../builders/openai/build_rc1_openai_scope_bundle.mjs";

const root = resolveRoot();
buildRc1OpenAiScopeBundleArtifacts(root);
const lineage = readJson(path.join(root, "evidence", "rc1-openai-scope-bundle", "rc1_evidence_lineage.json"));
console.log(JSON.stringify({ status: "pass", lineage_stages_indexed: lineage.length, lineage }, null, 2));
