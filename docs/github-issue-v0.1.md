# Implement imgx V0.1 Core CLI

## Summary

Build the V0.1 MVP for `imgx`, a CLI image bridge for text-only LLMs. The CLI should connect to an OpenAI-compatible vision model, analyze local images, persist results in SQLite, and expose text, JSON, and JSONL outputs for downstream LLM and automation workflows.

## Product Goal

Enable text-only LLM workflows to use external image understanding through a standard CLI:

```text
Local image file -> OpenAI-compatible vision model -> text / JSON / JSONL -> text-only LLM or script
```

## V0.1 Commands

- `imgx init`
- `imgx doctor`
- `imgx ask <image> <question>`
- `imgx describe <image>`
- `imgx ocr <image>`
- `imgx batch <glob>`
- `imgx history`
- `imgx cache clear`

## Scope

V0.1 includes:

- OpenAI-compatible vision provider.
- Local image reading.
- Base64 data URL upload.
- Text output.
- JSON output.
- SQLite cache and history.
- Batch JSONL output.
- Standard error codes and exit codes.
- npm global installation.

V0.1 excludes:

- Proxy server.
- MCP server.
- Local VLM backend.
- Generative image editing.
- Multi-provider plugin system.
- Image annotation UI.

## Configuration

Support local SQLite provider settings via `imgx set`:

```bash
imgx set \
  --base-url https://api.example.com/v1 \
  --model gpt-4o-mini \
  --api-key sk-xxx
```

Support config files:

```text
~/.config/imgx/config.json
./imgx.config.json
```

Precedence:

```text
CLI options > local SQLite settings > project config > user config > defaults
```

Do not write plaintext API keys to config. Store the provider API key only in local SQLite via `imgx set`.

## Command Acceptance Criteria

### `init`

- Creates `~/.config/imgx/config.json`.
- Supports non-interactive arguments: `--base-url`, `--model`.
- Creates the SQLite database.
- Creates the cache directory.
- Does not persist plaintext API keys.

### `doctor`

- Checks Node.js version.
- Reports imgx version.
- Reports resolved config path.
- Checks SQLite writability.
- Checks cache directory writability.
- Checks API key presence.
- Checks provider reachability.
- Sends a tiny test image to confirm model image support.
- Supports `--json`.

### `ask`

- Accepts a local image path and question.
- Supports `--json`, `--task`, `--no-cache`, `--save-raw`, and `--timeout <ms>`.
- Returns a direct answer in text mode.
- Returns stable structured JSON in JSON mode.
- Persists image metadata and analysis result.
- Uses cache unless disabled.

### `describe`

- Accepts a local image path.
- Supports `--json`.
- Supports `--for general|coding|ui|document|chart|paper`.
- Uses prompt templates appropriate for the selected purpose.

### `ocr`

- Extracts visible text.
- Preserves line breaks when possible.
- Preserves table structure when possible.
- Preserves code indentation when possible.
- Marks uncertain characters as `[?]`.
- Supports `--json`.

### `batch`

- Supports glob and recursive directory patterns.
- Supports `--task`, `--prompt`, `--jsonl`, `--concurrency`, `--resume`, `--continue-on-error`, `--no-cache`, and `--limit`.
- Enforces concurrency.
- Writes progress to stderr.
- Streams JSONL to stdout or a specified file.
- Can continue after item-level failures when requested.
- Can resume previously recorded batch state.

### `history`

- Lists recent analyses.
- Includes analysis id, task, image path, model, status, and created time.
- Supports `--json`.

### `cache clear`

- Clears cached analyses and cache files managed by imgx.
- Does not delete unrelated user files.
- Supports quiet operation.

## Data Model

Use SQLite with tables for:

- `images`
- `analyses`
- `requests`
- `batches`
- `batch_items`
- `migrations`

Cache key inputs:

```text
sha256(image_bytes)
+ task
+ prompt
+ model
+ baseURL
+ promptTemplateVersion
+ imageOptions
```

## Error Handling

All JSON errors should use:

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

Required exit codes:

```text
0 success
1 runtime error
2 argument error
3 config error
4 file error
5 provider error
6 database error
7 batch partial failure
```

## Logging And Security

- stdout is for command results only.
- stderr is for progress, warnings, and logs.
- `--json` must keep stdout valid JSON.
- Redact API keys.
- Do not log Authorization headers.
- Do not log image base64.
- Do not store plaintext API keys in config.
- Read only explicitly passed local files by default.
- Require `--allow-url` before reading URL images.
- Strip EXIF by default.
- Enforce maximum image size and batch limits.

## Suggested Implementation Stack

- TypeScript
- Node.js >= 18, recommended >= 20
- commander
- sharp
- better-sqlite3
- zod
- undici
- fast-glob
- vitest
- tsup

## Definition Of Done

- `npm install -g` exposes `imgx --help`.
- `imgx init` writes valid config and initializes local state.
- `imgx doctor` validates provider connectivity.
- `imgx describe ./a.png` returns a description.
- `imgx ocr ./a.png` returns OCR text.
- `imgx ask ./a.png "question"` returns an answer.
- `--json` output is stable and machine-readable.
- Repeating the same image and task hits SQLite-backed cache.
- `imgx batch` processes multiple images and writes JSONL.
- Standard error cases return the expected error code and non-zero exit code.
- Unit tests cover config loading, error mapping, cache key generation, and response parsing.
- Integration tests cover at least one mocked provider flow for `describe`, `ocr`, `ask`, and `batch`.
