# imgx Development Plan

## Assumptions

- V0.1 should optimize for a working CLI core, not proxy mode.
- Provider support is limited to OpenAI-compatible Chat Completions with image URL content.
- Local files are the only default image source.
- API keys are provided through environment variables, not stored directly in config files.
- SQLite is the source of truth for history, cache metadata, and batch state.

## Success Criteria

V0.1 is complete when a user can install the package, initialize config, run provider diagnostics, analyze local images with `describe`, `ocr`, and `ask`, batch over a glob, receive stable JSON/JSONL output, and get deterministic error codes for expected failure cases.

## Milestone 1: Project Skeleton

Implementation:

- Create TypeScript package with npm bin entry.
- Add `commander` CLI root.
- Add `tsup`, `vitest`, and TypeScript config.
- Add top-level command registration.
- Add package scripts for build, test, typecheck, and lint if used.

Verify:

- `npm run build` succeeds.
- `node ./bin/imgx.js --help` prints command help.
- `npm pack --dry-run` includes only expected files.

## Milestone 2: Config And Errors

Implementation:

- Add config schema with `zod`.
- Load config from defaults, user config, project config, environment, and CLI overrides.
- Implement `init`.
- Add `ImgxError`, error codes, and exit code mapping.
- Add redaction utilities for API keys, Authorization headers, and base64 payloads.

Verify:

- Unit tests cover config precedence.
- `imgx init --base-url ... --model ... --api-key-env ...` creates config.
- Missing API key returns `CONFIG_MISSING_API_KEY` and exit code `3`.
- Invalid image path returns `IMAGE_FILE_NOT_FOUND` and exit code `4`.

## Milestone 3: SQLite Persistence

Implementation:

- Add SQLite client using `better-sqlite3`.
- Add migrations table and schema migrations.
- Add repositories for images, analyses, requests, batches, and batch items.
- Add cache key generation.

Verify:

- Unit tests cover cache key stability.
- Migration is idempotent.
- Database open failure maps to `DB_OPEN_FAILED`.
- Same image and prompt can be looked up by cache key.

## Milestone 4: Image Pipeline

Implementation:

- Load local image files.
- Validate extension and size.
- Extract metadata with `sharp`.
- Normalize image size and strip EXIF by default.
- Compute SHA-256.
- Build data URLs.

Verify:

- Unit tests cover unsupported format, oversized file, hashing, and MIME detection.
- Normalized image output is accepted by request builder.
- Base64 image data is never written to logs.

## Milestone 5: Provider Client

Implementation:

- Build OpenAI-compatible Chat Completions request.
- Send request with timeout using `undici`.
- Parse text responses and usage.
- Save raw response when requested or needed.
- Map provider HTTP and response errors to standard error codes.

Verify:

- Mocked tests cover success, unauthorized, rate limited, timeout, bad request, unsupported image, and invalid response.
- Request includes model, text content, image URL content, temperature `0`, and Bearer token.
- Usage fields are recorded when returned.

## Milestone 6: Core Analysis Commands

Implementation:

- Implement `analyzeImage` orchestration.
- Add prompt templates for `general`, `coding`, `ocr`, `ui`, `chart`, `document`, and `paper`.
- Implement `describe`, `ocr`, and `ask`.
- Add text and JSON output formatters.
- Add cache lookup and write-through behavior.

Verify:

- `describe` returns text by default.
- `ocr --json` returns stable JSON.
- `ask --task coding` uses the coding prompt.
- Repeating the same call returns `cached: true` in JSON mode.

## Milestone 7: Doctor, History, And Cache

Implementation:

- Implement `doctor`.
- Implement `history`.
- Implement `cache clear`.
- Add quiet, verbose, debug, and JSON output behavior.

Verify:

- `doctor --json` returns an `ok` boolean and checks array.
- `history` lists recent analyses.
- `cache clear` removes only imgx-managed cache entries.
- stdout/stderr separation is maintained.

## Milestone 8: Batch Processing

Implementation:

- Expand glob patterns with `fast-glob`.
- Add concurrency-limited queue.
- Stream JSONL output to stdout or file.
- Persist batch and item state.
- Add `--continue-on-error`, `--limit`, `--no-cache`, and `--resume`.
- Write progress to stderr.

Verify:

- Batch processes recursive patterns.
- Concurrency limit is honored.
- Item failures can be recorded without stopping the batch.
- Partial batch failure returns exit code `7`.
- Resume skips completed items.

## Milestone 9: Packaging And Release Readiness

Implementation:

- Finalize npm package metadata.
- Add `files` allowlist.
- Add README quick start and examples.
- Add license.
- Add CI workflow if the repository uses GitHub.

Verify:

- `npm pack --dry-run` output is clean.
- Fresh install from the packed tarball exposes `imgx`.
- Build and tests pass from a clean checkout.

## V0.2 Backlog

- `locate`: locate a semantic target and return bbox JSON.
- `crop`: crop from explicit bbox or VLM-located target.
- `annotate`: draw labels and boxes over detected regions.
- Multi-image input.
- Stronger batch resume UX.

## V0.3 Backlog

- OpenAI-compatible proxy at `/v1/chat/completions`.
- Vision model preprocessor plus main text model forwarding.
- `stream=true` passthrough.
- OpenCode integration example.

## V0.4 Backlog

- MCP server.
- Plugin-style providers.
- Local VLM backend.
- Generative image editing backend.

