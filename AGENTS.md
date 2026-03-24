# AGENTS.md

## Project Overview

TypeScript port of [git-graph](https://github.com/git-bahn/git-graph) (v0.7.0) by Martin Lange. Renders clear git commit graphs in the terminal or as SVG, arranged for your branching model.

## Development Methodology

**Always use Test-Driven Development (TDD).** Write tests first, then implement. No code changes without corresponding test coverage. Run `npm test` before and after every change.

## Tech Stack

- **Language:** TypeScript (strict mode), compiled to CommonJS
- **Runtime:** Node.js 18+
- **Git access:** isomorphic-git (pure JS, no native dependencies)
- **CLI:** commander.js
- **Colors:** chalk v4 (not v5+ which is ESM-only)
- **TOML:** smol-toml
- **Text wrapping:** wrap-ansi v7 (not v8+ which is ESM-only)
- **Testing:** vitest
- **Build:** tsup
- **Dev runner:** tsx

## Commands

- `npm test` — run all tests (vitest)
- `npm run build` — build to `dist/` (tsup)
- `npm run dev` — run CLI in dev mode (tsx)
- `npx tsc --noEmit` — type-check without emitting

## Project Structure

```
src/
  cli.ts              # CLI entry point (commander.js)
  config.ts           # TOML branching model config I/O
  graph.ts            # Core graph construction (isomorphic-git)
  index.ts            # Library entry point (re-exports)
  settings.ts         # All types: Settings, BranchSettings, Characters, etc.
  print/
    colors.ts         # ANSI 256-color palette mapping
    format.ts         # Commit formatting with %placeholder system
    index.ts          # Print module entry (getDeviateIndex helper)
    svg.ts            # SVG graph renderer
    unicode.ts        # Unicode terminal graph renderer (Grid, vline, hline, zigzag)
tests/
  *.test.ts           # One test file per source module
```

## Architecture Notes

- **CommitInfo.data** stores full commit metadata (author, message, etc.) populated during graph construction — the renderer doesn't need repo access.
- **BranchInfo.visual.column** is assigned during graph construction. The renderers read it to position branches.
- **Settings types** live in `settings.ts`. `CommitFormat` is defined there and re-exported by `format.ts`.
- **TOML config** uses snake_case keys; TypeScript uses camelCase. `config.ts` has conversion helpers.
- **chalk v4 and wrap-ansi v7** are used because v5+/v8+ are ESM-only and this project is CommonJS.

## Conventions

- Module structure mirrors the original Rust codebase.
- Use `import type` for type-only imports.
- Only comment code that needs clarification — don't over-comment.
- Keep test files in `tests/` with the naming pattern `<module>.test.ts`.
- Run `npx tsc --noEmit` to verify types compile cleanly.

## Origin

Ported from [git-bahn/git-graph](https://github.com/git-bahn/git-graph) v0.7.0 (Rust, MIT License by Martin Lange). The `baseline/v0.7.0` branch preserves the faithful port state for future sync with upstream versions.
