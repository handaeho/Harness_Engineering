import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

const requirementsPath = arg("--requirements");
const schemaPath = arg("--schema");
const nativeOutputDir = arg("--native-output-dir");
const codexOutputDir = arg("--codex-output-dir");
const outPath = arg("--out", "records/phase4r_j_r_a_actor_output_validation_result.json");

if (!requirementsPath || !schemaPath || !nativeOutputDir || !codexOutputDir) {
  console.error("Usage: node harness/validate_actor_outputs.mjs --requirements <file> --schema <file> --native-output-dir <dir> --codex-output-dir <dir> --out <file>");
  process.exit(2);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function sha256(text) {
  return "sha256:" + crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function hasPlaceholder(text) {
  const lower = String(text ?? "").toLowerCase();
  return [
    "placeholder",
    "synthetic output",
    "synthetic summary",
    "prior deterministic record",
    "judge remains pending",
    "deterministic local actor/judge protocol",
    "not certified",
    "todo",
  ].some((term) => lower.includes(term));
}

const requirements = readJson(requirementsPath);
const schema = readJson(schemaPath);
const required = requirements.records ?? [];
const errors = [];
let validOutputs = 0;
let invalidOutputs = 0;
let missingOutputs = 0;
let nativeValid = 0;
let codexValid = 0;
let received = 0;

for (const requirement of required) {
  const outputDir = requirement.item_type === "native_replay_case" ? nativeOutputDir : codexOutputDir;
  const outputFile = path.join(outputDir, path.basename(requirement.required_output_file));
  if (!fs.existsSync(outputFile)) {
    missingOutputs += 1;
    errors.push({ item_id: requirement.item_id, packet_id: requirement.packet_id, error: "missing_output", expected_file: outputFile });
    continue;
  }

  received += 1;
  let output;
  try {
    output = readJson(outputFile);
  } catch (error) {
    invalidOutputs += 1;
    errors.push({ item_id: requirement.item_id, packet_id: requirement.packet_id, error: "invalid_json", detail: String(error.message) });
    continue;
  }

  const itemErrors = [];
  for (const field of schema.required_fields ?? []) {
    if (!(field in output)) itemErrors.push("missing required field: " + field);
  }

  const expectedActorType = requirement.item_type === "native_replay_case" ? "native" : "codex";
  const conditional = schema.conditional_required_fields?.[expectedActorType] ?? [];
  for (const field of conditional) {
    if (!(field in output)) itemErrors.push("missing conditional field: " + field);
  }

  if (output.packet_id !== requirement.packet_id) itemErrors.push("packet_id mismatch");
  if (output.case_id_or_test_id !== requirement.source_case_id) itemErrors.push("case_id_or_test_id mismatch");
  if (output.actor_type !== expectedActorType) itemErrors.push("actor_type mismatch");
  if (!String(output.actor_output ?? "").trim()) itemErrors.push("actor_output empty");
  if (hasPlaceholder(output.actor_output)) itemErrors.push("actor_output appears synthetic or placeholder");
  if (!String(output.trace_id ?? "").trim()) itemErrors.push("trace_id missing");
  if (!String(output.run_id ?? "").trim()) itemErrors.push("run_id missing");
  if (!String(output.claim_strength ?? "").trim()) itemErrors.push("claim_strength missing");
  if (expectedActorType === "codex" && !String(output.codex_asset ?? "").trim()) itemErrors.push("codex_asset missing");

  if (String(output.actor_output ?? "").trim()) {
    const computed = sha256(output.actor_output);
    if (output.actor_output_hash !== computed) {
      itemErrors.push("actor_output_hash invalid: expected " + computed);
    }
  }

  if (itemErrors.length) {
    invalidOutputs += 1;
    errors.push({ item_id: requirement.item_id, packet_id: requirement.packet_id, output_file: outputFile, errors: itemErrors });
  } else {
    validOutputs += 1;
    if (expectedActorType === "native") nativeValid += 1;
    else codexValid += 1;
  }
}

const result = {
  total_required: required.length,
  total_received: received,
  valid_outputs: validOutputs,
  invalid_outputs: invalidOutputs,
  missing_outputs: missingOutputs,
  native_valid: nativeValid,
  codex_valid: codexValid,
  errors,
  ready_for_semantic_judge: required.length > 0 && validOutputs === required.length && invalidOutputs === 0 && missingOutputs === 0,
};

writeJson(outPath, result);
console.log(JSON.stringify(result, null, 2));
