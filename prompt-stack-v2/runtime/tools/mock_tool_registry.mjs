const fixtureCorpus = {
  alpha: [
    {
      source_id: "fixture-alpha",
      content: "alpha fixture context",
      trust: "fixture_untrusted"
    }
  ],
  default: [
    {
      source_id: "fixture-default",
      content: "default fixture context",
      trust: "fixture_untrusted"
    }
  ]
};

function blockedToolFailure(toolName) {
  throw new Error(`${toolName} must be blocked by approval_gate before execution`);
}

export const mockToolRegistry = {
  safe_echo: {
    tool_name: "safe_echo",
    external_side_effect: false,
    destructive: false,
    requires_approval: false,
    execute(args = {}) {
      return {
        kind: "echo",
        text: String(args.text || "")
      };
    }
  },
  mock_retrieval: {
    tool_name: "mock_retrieval",
    external_side_effect: false,
    destructive: false,
    requires_approval: false,
    execute(args = {}) {
      return {
        kind: "retrieval",
        query: args.query || "default",
        sources: fixtureCorpus[args.query] || fixtureCorpus.default
      };
    }
  },
  mock_schema_formatter: {
    tool_name: "mock_schema_formatter",
    external_side_effect: false,
    destructive: false,
    requires_approval: false,
    execute(args = {}) {
      return {
        status: "ok",
        summary: args.summary || "mock schema formatted",
        evidence: []
      };
    }
  },
  blocked_external_post: {
    tool_name: "blocked_external_post",
    external_side_effect: true,
    destructive: false,
    requires_approval: true,
    blocked: true,
    execute() {
      blockedToolFailure("blocked_external_post");
    }
  },
  blocked_file_write: {
    tool_name: "blocked_file_write",
    external_side_effect: true,
    destructive: true,
    requires_approval: true,
    blocked: true,
    execute() {
      blockedToolFailure("blocked_file_write");
    }
  }
};

export function getMockTool(toolName) {
  return mockToolRegistry[toolName] || null;
}

export function executeMockTool(toolName, args = {}) {
  const tool = getMockTool(toolName);
  if (!tool) throw new Error(`unknown mock tool: ${toolName}`);
  return tool.execute(args);
}
