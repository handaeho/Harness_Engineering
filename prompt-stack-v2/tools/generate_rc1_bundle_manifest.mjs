#!/usr/bin/env node
import path from "node:path";
import { readJson } from "./lib/file_walk.mjs";
import { buildRc1OpenAiScopeBundleArtifacts, resolveRoot } from "./build_rc1_openai_scope_bundle.mjs";

const root = resolveRoot();
buildRc1OpenAiScopeBundleArtifacts(root);
const manifest = readJson(path.join(root, "evidence", "rc1-openai-scope-bundle", "rc1_bundle_manifest.json"));
console.log(JSON.stringify(manifest, null, 2));
