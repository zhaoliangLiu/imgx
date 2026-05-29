# imgx

![npm package](https://img.shields.io/badge/npm-imgx--bridge-cb3837)
![node](https://img.shields.io/badge/node-%3E%3D18-43853d)
![license](https://img.shields.io/badge/license-MIT-blue)

> A CLI image bridge for text-only LLMs.

`imgx` is a CLI tool that connects to any OpenAI-compatible vision model, analyzes local images, persists results in SQLite, and exposes image understanding capabilities to text-only LLM workflows.

`imgx` 是一个基于 OpenAI-compatible 多模态模型的图像 CLI 工具，用于为无多模态能力的大模型提供外置图像理解、OCR、问答、批处理和代理转发能力。

## Why

Many cost-effective text LLMs, local models, and coding agents cannot read images directly. In terminal workflows, OpenCode-style agents, automation scripts, and batch jobs, users still need to inspect screenshots, papers, charts, scanned documents, UI mockups, and error images.

`imgx` bridges that gap by sending local images to a configured vision model and returning text, OCR, or structured JSON that can be consumed by text-only models and other tools.

## Goals

- Configure one OpenAI-compatible vision provider: `baseURL`, `model`, and `apiKey`.
- Read local image files that the user explicitly passes to the CLI.
- Support image Q&A, description, OCR, batch processing, and JSON output.
- Persist history, cache entries, and batch state in SQLite.
- Support npm global installation and `npx` usage.
- Provide standard CLI help, error codes, exit codes, and logging behavior.
- Later expose an OpenAI-compatible proxy that wraps text-only models as pseudo-multimodal providers.

## Install

The npm package is `imgx-bridge`; the installed command is `imgx`.

```bash
npm install -g imgx-bridge
imgx --help
```

You can also run it with `npx`:

```bash
npx imgx-bridge --help
```

## Quick Start

```bash
npm install -g imgx-bridge

imgx set \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini \
  --api-key sk-xxx

imgx doctor

imgx ./screenshot.png "这张截图里的报错是什么？"

imgx ocr ./paper.png --json

imgx batch "./images/**/*.png" \
  --task ocr \
  --jsonl results.jsonl \
  --concurrency 3
```

## Commands

```text
Usage: imgx <command> [options]

Commands:
  init                         Initialize imgx config
  config                       Manage configuration
  doctor                       Check environment and provider connectivity
  ask <image> <question>       Ask a question about an image
  describe <image>             Describe an image
  ocr <image>                  Extract text from an image
  locate <image> <target>      Locate a target region in an image
  crop <image>                 Crop an image by bbox or semantic target
  annotate <image>             Annotate image regions
  batch <pattern>              Run task on multiple images
  history                      Show analysis history
  cache                        Manage cache
  set                          Save provider settings to local SQLite
  unset                        Delete saved local settings
  proxy                        Start OpenAI-compatible proxy server

Global Options:
  --config <path>              Use custom config file
  --json                       Output JSON
  --quiet                      Suppress non-result output
  --verbose                    Show more logs
  --debug                      Show debug logs with secrets redacted
  -h, --help                   Show help
  -v, --version                Show version
```

## Highlights

| Feature | Status |
| --- | --- |
| OpenAI-compatible vision model | V0.1 |
| Local image path input | V0.1 |
| Image Q&A, description, OCR | V0.1 |
| SQLite-backed cache and history | V0.1 |
| JSON and JSONL output | V0.1 |
| Batch processing | V0.1 |
| Standard error and exit codes | V0.1 |
| OpenAI-compatible proxy for text-only models | Planned |

## MVP Scope

V0.1 focuses on the core loop:

```bash
imgx init
imgx doctor
imgx ask <image> <question>
imgx describe <image>
imgx ocr <image>
imgx batch <glob>
imgx history
imgx cache clear
```

V0.1 must support:

- OpenAI-compatible vision models.
- Local image loading.
- Base64 data URL image upload.
- Text output.
- JSON output.
- SQLite cache and history.
- Batch JSONL output.
- Standard error and exit codes.
- npm global installation.

## Configuration

Use `imgx set` once after installation. Provider settings are stored in local SQLite, including the API key. The JSON config file is kept for non-secret defaults and backward compatibility.

```bash
imgx set \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini \
  --api-key sk-xxx
```

Delete saved credentials:

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

Example:

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

## Command Requirements

### `imgx init`

Initializes user configuration, database, and cache directory.

```bash
imgx init

imgx init \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini
```

Acceptance criteria:

- Creates `~/.config/imgx/config.json`.
- Does not write plaintext API keys to config.
- Creates the SQLite database.
- Creates the cache directory.

### `imgx doctor`

Checks local environment and provider connectivity.

```bash
imgx doctor
imgx doctor --json
```

Checks:

- Node.js version.
- imgx version.
- Config file path.
- SQLite writability.
- Cache directory writability.
- API key presence.
- `baseURL` reachability.
- Whether the model can process a test image.

### `imgx ask`

Asks a question about an image.

```bash
imgx ask ./error.png "这张截图报错是什么？"
imgx ./error.png "这张截图报错是什么？"
```

Options:

```text
--json
--task coding | general | ui | document | chart
--no-cache
--save-raw
--timeout <ms>
```

### `imgx describe`

Generates an image description.

```bash
imgx describe ./ui.png
imgx describe ./ui.png --json
imgx describe ./ui.png --for coding
```

`--for` values:

```text
general
coding
ui
document
chart
paper
```

### `imgx ocr`

Extracts visible text from an image.

```bash
imgx ocr ./paper.png
imgx ocr ./paper.png --json
```

OCR should preserve line breaks, table structure, code indentation, and punctuation when possible. Uncertain characters should be marked as `[?]`.

### `imgx batch`

Runs a task across multiple images.

```bash
imgx batch "./screenshots/**/*.png" \
  --task ocr \
  --jsonl out.jsonl \
  --concurrency 3 \
  --continue-on-error
```

Options:

```text
--task describe | ocr | coding | ui | chart | document
--prompt <text>
--jsonl <path>
--concurrency <n>
--resume
--continue-on-error
--no-cache
--limit <n>
```

Batch acceptance criteria:

- Supports glob patterns and recursive directories.
- Supports concurrency limits.
- Can continue after individual item failures.
- Streams JSONL to stdout or a specified file.
- Supports resume.
- Writes progress to stderr.

## JSON Output

Example `ask --json` result:

```json
{
  "ok": true,
  "analysis_id": "ana_01J...",
  "task": "ask",
  "question": "这张截图报错是什么？",
  "image": {
    "path": "/abs/error.png",
    "sha256": "8b7c...",
    "mime": "image/png",
    "width": 1920,
    "height": 1080,
    "size_bytes": 345672
  },
  "result": {
    "answer": "图片显示前端运行时报错，错误为 TypeError: Cannot read properties of undefined (reading 'map')。",
    "visible_text": [
      "TypeError: Cannot read properties of undefined (reading 'map')"
    ],
    "observations": [
      "页面中央有错误覆盖层",
      "错误与 JavaScript 数组 map 调用有关"
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

Example JSONL batch output:

```jsonl
{"ok":true,"path":"a.png","analysis_id":"ana_1","result":{"summary":"..."}}
{"ok":false,"path":"b.png","error":{"code":"IMAGE_DECODE_FAILED","message":"Cannot decode image"}}
```

## Provider Request

Vision requests use the OpenAI Chat Completions format:

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请描述这张图片。"
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

Provider requirements:

- Custom `baseURL`.
- Bearer token authentication.
- Request timeout.
- Usage recording when returned by provider.
- Raw response persistence for non-standard provider fields.
- Provider errors mapped to standard `imgx` error codes.

## Built-In Prompt Tasks

Planned prompt templates:

```text
general
coding
ocr
ui
chart
document
paper
locate
compare
```

JSON mode should return:

```json
{
  "summary": "string",
  "visible_text": ["string"],
  "observations": ["string"],
  "limitations": ["string"]
}
```

## Persistence

SQLite is used for image metadata, analyses, requests, batches, and migrations. The recommended implementation library is `better-sqlite3`.

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

## Errors And Exit Codes

All machine-readable failures use this shape:

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

## Logging And Security

- stdout is reserved for command results.
- stderr is used for progress, warnings, and logs.
- `--quiet` outputs only results.
- `--verbose` includes paths, cache hits, and latency.
- `--debug` includes debug details with secrets redacted.
- `--json` ensures stdout contains only JSON.
- API keys, Authorization headers, and image base64 are never logged.
- Saved API keys are stored only in the local SQLite database and can be removed with `imgx unset api-key`.
- Local files are read only when explicitly passed by the user.
- URL images require explicit `--allow-url`.
- EXIF is stripped by default.
- Image size and batch size are bounded.
- Proxy mode listens on `127.0.0.1` by default.

## Suggested Stack

- Language: TypeScript
- Runtime: Node.js >= 18, recommended >= 20
- CLI: commander
- Image processing: sharp
- SQLite: better-sqlite3
- Config validation: zod
- HTTP: undici
- Glob: fast-glob
- Logging: pino or a lightweight custom logger
- Tests: vitest
- Bundling: tsup
- Publishing: npm

## Roadmap

V0.1:

- `init`, `doctor`, `ask`, `describe`, `ocr`, `batch`, `history`, `cache clear`
- OpenAI-compatible vision provider
- SQLite cache and history
- JSON and JSONL output
- npm global install

V0.2:

- `locate`, `crop`, and `annotate`
- Batch resume
- Multi-image input

V0.3:

- OpenAI-compatible proxy
- Main text model plus vision model forwarding
- Streaming passthrough
- OpenCode integration example

V0.4:

- MCP server
- Plugin-style providers
- Local VLM backend
- Generative image editing backend

## V0.1 Acceptance

- `npm install -g imgx-bridge` makes `imgx --help` available.
- `imgx set` saves provider settings locally.
- `imgx doctor` completes provider checks.
- `imgx describe ./a.png` returns an image description.
- `imgx ocr ./a.png` returns OCR text.
- `imgx ask ./a.png "question"` returns an answer.
- `--json` returns stable machine-readable JSON.
- Repeating the same image and task hits the cache.
- `batch` handles image directories and writes JSONL.
- Error cases return standard error codes and non-zero exit codes.
