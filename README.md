# imgx

![npm package](https://img.shields.io/badge/npm-imgx--bridge-cb3837)
![node](https://img.shields.io/badge/node-%3E%3D18-43853d)
![license](https://img.shields.io/badge/license-MIT-blue)

> Give text-only LLM workflows an image layer.

`imgx` is a CLI image bridge for developers who use text-only LLMs, local models, or coding agents but still need to work with screenshots, scanned documents, charts, UI mockups, terminal errors, and paper figures.

It connects to any OpenAI-compatible vision model, analyzes local images, persists results in SQLite, and returns clean text, JSON, or JSONL that can be reused by DeepSeek, local LLMs, scripts, agents, and automation pipelines.

```text
local image / screenshot / chart / scanned page
        ↓
OpenAI-compatible vision model
        ↓
text, OCR, structured JSON, or batch JSONL
        ↓
DeepSeek / local LLM / coding agent / shell script
```

## Why imgx

Many cost-effective LLMs are strong at reasoning and coding, while many of them cannot read images directly. In real terminal workflows, images still appear everywhere:

- frontend error screenshots
- terminal screenshots
- UI mockups and layout issues
- scanned documents and forms
- charts, tables, and paper figures
- batch OCR jobs
- coding-agent workflows that need visual context

`imgx` turns those images into model-readable context from the command line.

## Highlights

| Capability | Status |
| --- | --- |
| OpenAI-compatible vision provider | V0.1 |
| Local image path input | V0.1 |
| Image Q&A | V0.1 |
| Image description | V0.1 |
| OCR-style extraction | V0.1 |
| JSON output | V0.1 |
| JSONL batch processing | V0.1 |
| SQLite cache and history | V0.1 |
| Standard CLI errors and exit codes | V0.1 |
| Semantic locate / crop / annotate | Planned |
| OpenAI-compatible proxy for text-only models | Planned |
| MCP server | Planned |

## Install

The npm package is `imgx-bridge`; the installed command is `imgx`.

```bash
npm install -g imgx-bridge
imgx --help
```

Run with `npx`:

```bash
npx imgx-bridge --help
```

## Quick start

Configure one OpenAI-compatible vision endpoint:

```bash
imgx set \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini \
  --api-key sk-xxx
```

Check the setup:

```bash
imgx doctor
```

Ask about a screenshot:

```bash
imgx ask ./screenshot.png "What is wrong in this screenshot?"
```

Shorthand form:

```bash
imgx ./screenshot.png "这张截图里的报错是什么？"
```

Extract visible text:

```bash
imgx ocr ./paper.png
```

Return machine-readable output:

```bash
imgx describe ./ui.png --json
```

Batch process a folder:

```bash
imgx batch "./images/**/*.png" \
  --task ocr \
  --jsonl results.jsonl \
  --concurrency 3
```

## Common use cases

### Analyze a frontend error screenshot

```bash
imgx ask ./error.png "Summarize the visible error and possible cause."
```

### Extract text from a scanned page

```bash
imgx ocr ./scan.jpg --json
```

### Describe a UI mockup for a coding agent

```bash
imgx describe ./mockup.png --for ui
```

### Batch OCR images into JSONL

```bash
imgx batch "./screenshots/**/*.png" \
  --task ocr \
  --jsonl ocr-results.jsonl \
  --continue-on-error
```

## Commands

```text
Usage: imgx <command> [options]

Commands:
  init                         Initialize imgx config
  doctor                       Check environment and provider connectivity
  ask <image> <question>       Ask a question about an image
  describe <image>             Describe an image
  ocr <image>                  Extract visible text from an image
  batch <pattern>              Run a task on multiple images
  history                      Show analysis history
  cache                        Manage cache
  set                          Save provider settings locally
  unset                        Delete saved local settings
  config                       Manage configuration
  locate                       Planned: locate semantic regions
  crop                         Planned: crop by bbox or semantic target
  annotate                     Planned: annotate image regions
  proxy                        Planned: start an OpenAI-compatible proxy

Global Options:
  --config <path>              Use custom config file
  --json                       Output JSON
  --quiet                      Suppress non-result output
  --verbose                    Show more logs
  --debug                      Show debug logs with secrets redacted
  -h, --help                   Show help
  -v, --version                Show version
```

## Configuration

Provider settings can be saved with `imgx set`.

```bash
imgx set \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini \
  --api-key sk-xxx
```

Remove saved credentials:

```bash
imgx unset api-key
imgx unset provider
```

Config file locations:

```text
User:    ~/.config/imgx/config.json
Project: ./imgx.config.json
```

Config precedence:

```text
CLI options > local SQLite settings > project config > user config > defaults
```

Example config:

```json
{
  "provider": {
    "type": "openai-compatible",
    "baseURL": "https://api.example.com/v1",
    "model": "gpt-4o-mini"
  },
  "image": {
    "maxSizeMB": 20,
    "autoResize": true,
    "maxWidth": 2000,
    "maxHeight": 2000,
    "stripExif": true,
    "allowedExtensions": [".png", ".jpg", ".jpeg", ".webp"]
  },
  "output": {
    "defaultFormat": "text"
  },
  "cache": {
    "enabled": true,
    "ttlDays": 30
  },
  "database": {
    "path": "~/.imgx/imgx.db"
  }
}
```

## OpenAI-compatible request format

`imgx` sends image inputs using the Chat Completions image format supported by many OpenAI-compatible vision providers:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Describe this image."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,..."
          }
        }
      ]
    }
  ],
  "temperature": 0
}
```

## JSON output

Example `ask --json` output:

```json
{
  "ok": true,
  "analysis_id": "ana_01J...",
  "task": "ask",
  "question": "What is wrong in this screenshot?",
  "image": {
    "path": "/abs/error.png",
    "sha256": "8b7c...",
    "mime": "image/png",
    "width": 1920,
    "height": 1080,
    "size_bytes": 345672
  },
  "result": {
    "answer": "The screenshot shows a frontend runtime error related to calling map on an undefined value.",
    "visible_text": [
      "TypeError: Cannot read properties of undefined (reading 'map')"
    ],
    "observations": [
      "The error overlay is visible in the page center.",
      "The issue is likely related to missing data initialization or unchecked API response data."
    ]
  },
  "provider": {
    "model": "gpt-4o-mini"
  },
  "cached": false,
  "usage": {
    "latency_ms": 1804,
    "input_tokens": null,
    "output_tokens": 228
  }
}
```

Example batch JSONL output:

```jsonl
{"ok":true,"path":"a.png","analysis_id":"ana_1","result":{"summary":"..."}}
{"ok":false,"path":"b.png","error":{"code":"IMAGE_DECODE_FAILED","message":"Cannot decode image"}}
```

## Persistence and cache

`imgx` uses SQLite for local persistence:

- image metadata
- analysis history
- cache entries
- provider settings
- request records
- batch state

Cache keys are derived from:

```text
sha256(image_bytes)
+ task
+ prompt
+ model
+ baseURL
+ promptTemplateVersion
+ imageOptions
```

Repeating the same image and task can reuse previous results and avoid unnecessary vision-model calls.

## Errors and exit codes

Machine-readable failures use a stable shape:

```json
{
  "ok": false,
  "error": {
    "code": "IMAGE_FILE_NOT_FOUND",
    "message": "Image file not found: ./a.png",
    "hint": "Use an absolute path or check whether the file exists."
  }
}
```

Error code groups:

```text
CONFIG_MISSING_API_KEY
CONFIG_INVALID_BASE_URL
CONFIG_MODEL_MISSING

IMAGE_FILE_NOT_FOUND
IMAGE_PERMISSION_DENIED
IMAGE_UNSUPPORTED_FORMAT
IMAGE_TOO_LARGE
IMAGE_DECODE_FAILED

PROVIDER_UNAUTHORIZED
PROVIDER_RATE_LIMITED
PROVIDER_TIMEOUT
PROVIDER_BAD_REQUEST
PROVIDER_UNSUPPORTED_IMAGE
PROVIDER_INVALID_RESPONSE

DB_OPEN_FAILED
DB_MIGRATION_FAILED
CACHE_READ_FAILED
CACHE_WRITE_FAILED

BATCH_NO_MATCH
BATCH_PARTIAL_FAILED
```

Exit codes:

```text
0  success
1  runtime error
2  argument error
3  config error
4  file error
5  provider error
6  database error
7  batch partial failure
```

## Security notes

- Local files are read only when explicitly passed by the user.
- API keys and Authorization headers are redacted from logs.
- Image base64 data is never printed in logs.
- EXIF metadata is stripped by default when image normalization is enabled.
- URL images require explicit support in future releases.
- Proxy mode will listen on `127.0.0.1` by default.

## Roadmap

### V0.1

- `init`, `doctor`, `set`, `unset`
- `ask`, `describe`, `ocr`
- `batch`, `history`, `cache`
- OpenAI-compatible vision provider
- SQLite cache and history
- JSON and JSONL output
- npm global install

### V0.2

- semantic `locate`
- VLM-assisted `crop`
- VLM-assisted `annotate`
- batch resume
- multi-image input

### V0.3

- OpenAI-compatible proxy
- vision model + text-only model forwarding
- streaming passthrough
- OpenCode integration example

### V0.4

- MCP server
- plugin-style providers
- local VLM backend
- generative image editing backend

## Suggested stack

- TypeScript
- Node.js >= 18
- commander
- sharp
- better-sqlite3
- zod
- undici
- fast-glob
- vitest
- tsup

## 中文简介

`imgx` 是一个给文本模型补充图像理解能力的命令行工具。它读取本地图片，调用一个符合 OpenAI 格式的视觉模型，然后输出文本、OCR、JSON 或 JSONL，方便交给 DeepSeek、本地 LLM、代码 Agent、脚本和自动化流程继续处理。

典型用途：

```bash
imgx ./error.png "这张截图里的报错是什么？"
imgx ocr ./paper.png --json
imgx batch "./screenshots/**/*.png" --task ocr --jsonl out.jsonl
```

## License

MIT
