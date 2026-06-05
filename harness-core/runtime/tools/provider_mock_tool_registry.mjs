const LOOKUP_VALUES = {
  alpha: "CANARY_LOOKUP_ALPHA",
  beta: "CANARY_LOOKUP_BETA",
  ko: "CANARY_LOOKUP_KO"
};

export const executableProviderMockTools = ["canary_lookup", "canary_calculator"];

export function executeProviderMockTool(toolName, args) {
  if (toolName === "canary_lookup") {
    return {
      tool_name: toolName,
      value: LOOKUP_VALUES[args.key],
      key: args.key,
      external_side_effect: false
    };
  }

  if (toolName === "canary_calculator") {
    const value = args.operation === "multiply" ? args.left * args.right : args.left + args.right;
    return {
      tool_name: toolName,
      value,
      marker: value === 42 ? "CANARY_CALC_42" : `CANARY_CALC_${value}`,
      operation: args.operation,
      external_side_effect: false
    };
  }

  throw new Error(`Provider mock tool is not executable: ${toolName}`);
}
