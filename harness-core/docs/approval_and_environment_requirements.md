# Approval And Environment Requirements

## Approval Phrases

- openai_limited_redteam_execution: `I explicitly approve v2.0.0-beta-openai-redteam-limited-execution`
- production_telemetry_connection: `I explicitly approve v2.0.0-beta-production-telemetry-connection`

## Environment Requirement Lanes

- openai_limited_redteam_execution: OPENAI_API_KEY, OPENAI_MODEL
- production_telemetry_connection_otel: OTEL_EXPORTER_OTLP_ENDPOINT
- production_telemetry_connection_langfuse: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
- local_no_tool_canary_vllm: LOCAL_CANARY_TARGETS, VLLM_BASE_URL, VLLM_MODEL
- local_no_tool_canary_ollama: LOCAL_CANARY_TARGETS, OLLAMA_BASE_URL, OLLAMA_MODEL
