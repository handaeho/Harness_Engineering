# Local Canary Blocked Until Endpoint Ready

Local vLLM and Ollama execution remains closed.

The OpenAI canary replay suite does not probe local endpoints, start local
servers, pull models, or perform local model execution. Local canary work can
resume only after a localhost-only endpoint is intentionally started and the
required local model environment variables are provided.
