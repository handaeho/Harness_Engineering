import Ajv2020 from "ajv/dist/2020.js";
import { readJson } from "./file_walk.mjs";

export function createAjv() {
  return new Ajv2020({
    allErrors: true,
    strict: false,
    allowUnionTypes: true
  });
}

export function loadSchema(file) {
  return readJson(file);
}

export function compileSchema(ajv, schema, label) {
  if (schema && schema.$id) {
    const existing = ajv.getSchema(schema.$id);
    if (existing) return existing;
  }
  const schemaOk = ajv.validateSchema(schema);
  if (!schemaOk) {
    throw new Error(`${label}: invalid schema: ${ajv.errorsText(ajv.errors, { separator: "; " })}`);
  }
  try {
    return ajv.compile(schema);
  } catch (error) {
    throw new Error(`${label}: schema compile failed: ${error.message}`);
  }
}

export function validateWithSchema(ajv, schema, data, label) {
  const validate = compileSchema(ajv, schema, label);
  const ok = validate(data);
  if (!ok) {
    throw new Error(`${label}: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
  }
  return true;
}

export const jsonSchemaValidatorStatus = {
  validator: "ajv",
  external_validator_available: true,
  fallback_used: false
};
