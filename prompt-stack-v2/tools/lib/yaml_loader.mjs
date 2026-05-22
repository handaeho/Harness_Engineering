import YAML from "yaml";
import { readText } from "./file_walk.mjs";

export const yamlParserStatus = {
  parser: "yaml",
  external_parser_available: true,
  fallback_used: false
};

export function parseYamlText(text, file = "<inline>") {
  try {
    return YAML.parse(text);
  } catch (error) {
    error.message = `${file}: ${error.message}`;
    throw error;
  }
}

export function parseYamlFile(file) {
  return parseYamlText(readText(file), file);
}
