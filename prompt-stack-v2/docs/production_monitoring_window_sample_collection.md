# Production Monitoring Window Sample Collection

Stage: v2.0.0-post-rc-production-monitoring-window-sample-collection

This stage can add real Langfuse trace receipts for the production monitoring window by running the mock runtime through the Langfuse tracing wrapper. It requires the exact approval phrase in POST_RC_MONITORING_WINDOW_SAMPLE_COLLECTION_APPROVAL.

It does not call OpenAI model APIs, probe local endpoints, execute local models, deploy production changes, store raw payloads, or log secrets.

The append-only index is evidence/post-rc-production-monitoring-window-samples/sample_receipt_index.json. Monitoring window sample count is calculated from indexed event observation counts.
