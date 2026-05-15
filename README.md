# n8n-nodes-alltoken

One API key. Dozens of frontier AI models. Works in n8n today.

[![npm](https://img.shields.io/npm/v/n8n-nodes-alltoken?style=flat-square)](https://www.npmjs.com/package/n8n-nodes-alltoken)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Why AllToken

[AllToken](https://alltoken.ai) is a unified AI gateway that exposes a single OpenAI-compatible API across dozens of frontier models — Claude, DeepSeek, Gemini, Qwen, GPT-4o, and more. Instead of managing separate API keys and integrations for each provider, you get one key and one endpoint.

This node brings that directly into n8n:

- **Chat** — 46 models: Claude 4.5/4.6/4.7, DeepSeek v3/v4, Gemini 3.x, Qwen 3.5/3.6, Kimi k2.5/k2.6, GPT-4o/5.3/5.4/5.5, o3/o4, GLM 4.7/5/5.1, MiniMax, MiMo
- **Image** — generate images with `gpt-image-2`
- **Video** — generate video clips with `seedance-2.0` / `seedance-1.5-pro` (async, 30 s – 3 min)
- **AI Agent / Chain** — the included Chat Model sub-node slots directly into n8n's built-in AI nodes; tool-calling works out of the box
- **Web grounding** — DeepSeek and Qwen models support an `enable_search` toggle for real-time web search

---

## Install

1. Open n8n → **Settings** → **Community Nodes**
2. Click **Install**
3. Enter the package name: `n8n-nodes-alltoken`
4. Confirm

The two nodes (**AllToken** and **AllToken Chat Model**) appear in the node picker after installation.

*(Screenshots in a later release.)*

---

## Get an API Key

Sign up at [https://alltoken.ai](https://alltoken.ai), navigate to the API key page, and copy your key. Keep it — you'll paste it into the credential next.

---

## Configure the Credential

1. In any workflow, click **Add Credential** → search **AllToken API**
2. Paste your API key
3. Click **Save**

n8n automatically tests the credential by calling `/models`. A green checkmark means you're good to go.

---

## The Nodes

| Node | Type | Use when… |
|---|---|---|
| **AllToken** | Action node | You want to call Chat / Image / Video directly in a workflow |
| **AllToken Chat Model** | Sub-node | You want to plug a model into an AI Agent or AI Chain |

---

### AllToken — Chat

Select **Resource → Chat**, pick a model, write your prompt.

**Minimal workflow:**
`Manual Trigger` → `AllToken (Chat, model: deepseek-v4, prompt: "Summarize this text")` → `Set`

**Output shape:**

```json
{
  "content": "Here is the summary…",
  "model": "deepseek-v4",
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 118,
    "total_tokens": 160
  }
}
```

**Options available:** system prompt, temperature, max tokens, `enable_search` (DeepSeek + Qwen only).

---

### AllToken — Image

Select **Resource → Image**. Provide a text prompt; the node returns a binary item you can pipe directly into a **Write Binary File** or **Send Email** node.

**Minimal workflow:**
`Manual Trigger` → `AllToken (Image, model: gpt-image-2, prompt: "a futuristic city at dawn")` → `Write Binary File`

**Output shape:**

```json
{
  "id": "igen_...",
  "model": "gpt-image-2",
  "prompt": "a futuristic city at dawn",
  "status": "completed",
  "size": "1024x1024",
  "usage": { "input_tokens": 42, "output_tokens": 1 },
  "url": "https://...r2.dev/.../0.png"
}
```

`url` is a 30-day signed R2 URL — use it for quick preview or download. `binary.data` contains the actual PNG bytes as an n8n binary descriptor and is what downstream nodes (e.g. **Write Binary File**, **Send Email**) consume.

---

### AllToken — Video (async)

Video generation is two steps because encoding takes time (30 seconds to 3 minutes).

**Step 1 — Generate:**
Select **Resource → Video**, **Operation → Generate**. Provide your prompt and model. The node returns a `task_id`.

**Step 2 — Poll / Get Result:**
Add a **Wait** node (e.g. 60 s), then a second **AllToken** node: **Resource → Video**, **Operation → Get Result**, paste the `task_id` from step 1.

**Minimal workflow:**
`Manual Trigger` → `AllToken (Video Generate)` → `Wait 60s` → `AllToken (Video Get Result)` → `Write Binary File`

**Get Result output shape:**

```json
{
  "status": "succeeded",
  "video_url": "https://…/video.mp4",
  "task_id": "abc-123"
}
```

Poll again if `status` is still `processing`.

---

### AllToken Chat Model (sub-node)

This node does **not** run on its own. Drop it into the **Chat Model** slot of an **AI Agent** or **Basic LLM Chain** node.

**How to use:**
1. Add an **AI Agent** node to your workflow
2. Click the **Chat Model** input connector
3. Add **AllToken Chat Model**
4. Select a model, optionally set temperature / max tokens
5. The agent handles tool-calling automatically via langchain

This is the easiest way to swap between dozens of models inside a single agent workflow without changing anything else.

---

## Common Errors

| HTTP code | Meaning | Fix |
|---|---|---|
| 401 | Invalid API key | Check the credential — re-paste your key |
| 402 | 余额不足 (insufficient balance) | Top up your AllToken account at alltoken.ai |
| 410 | Image result expired | Image results are one-shot; regenerate the image |
| 429 | Rate limit exceeded | Wait a moment and retry; reduce request frequency |

---

## Roadmap

- More image models as AllToken expands its image catalogue
- Additional video models
- n8n verified node status

---

## Development

For contributors who want to build or test locally:

```bash
npm install
npm run build
npm test
```

To run a local n8n instance with the node loaded:

```bash
docker compose up -d
```

The `docker-compose.yml` mounts `dist/` as a custom extension directory so n8n picks up your build automatically.

---

## License

MIT — see [LICENSE](LICENSE).
