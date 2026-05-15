# Local Development

1. `npm run build` — compiles TS + copies icons into `dist/`
2. `docker compose up -d` — starts n8n at http://localhost:5678
3. Edit code, re-run `npm run build`, then restart: `docker compose restart n8n`
4. In the n8n UI, create an **AllToken API** credential and add an **AllToken** node to a workflow.

Tip: run `npm run dev` (tsc watch) in one terminal; `gulp build:icons` once for icons.

## P1 verified — 2026-05-15

Verified against a live n8n instance (`n8nio/n8n:latest`) + the live AllToken API:

- **Node + credential load** — registered as `CUSTOM.allToken` ("AllToken") and `allTokenApi` ("AllToken API"); no load errors in the container logs; codex categories present.
- **Credential test** — n8n's credential test (`GET /models` + Bearer auth) returns `{"status":"OK","message":"Connection successful!"}`.
- **Chat → Message** — Manual Trigger → AllToken executes successfully; output JSON has non-empty `content`, plus `model`, `finishReason`, `usage`, and `raw`.
- **Error path** — a bad API key surfaces a `NodeApiError` (`httpCode: 401`) with message `Invalid or revoked API key.` and description `code: invalid_api_key | API Key 无效，请检查 AllToken 凭证。`

Two fixes came out of this verification: copy `*.node.json` codex metadata into `dist/`, and enrich pre-wrapped `NodeApiError`s in place (n8n short-circuits 401/403).
