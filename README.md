# git-network-graph

[![npm version](https://img.shields.io/npm/v/git-network-graph)](https://www.npmjs.com/package/git-network-graph)
[![CI](https://github.com/pedrofuentes/git-network-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/pedrofuentes/git-network-graph/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Clear git graphs arranged for your branching model. Renders structured, readable commit graphs in the terminal or as SVG. Works as a CLI tool or as a library in your project.

A TypeScript port of [git-graph](https://github.com/git-bahn/git-graph) (v0.7.0) by Martin Lange.

<img src="samples/vertical-thin.svg" width="600" alt="git-network-graph vertical output">

## Requirements

- **Node.js** >= 20

## Installation

### As a CLI tool

```bash
npm install -g git-network-graph
```

Or run directly with npx:

```bash
npx git-network-graph
```

### As a library

```bash
npm install git-network-graph
```

> **Note:** This package is CommonJS. It works in ESM projects with `esModuleInterop` enabled in your `tsconfig.json`.

## CLI Usage

Run inside any git repository:

```bash
git-network-graph
```

Or point to a repo:

```bash
git-network-graph --path /path/to/repo
```

### Terminal output example

```
 ●       4a6fe1b (HEAD -> main) [v1.0] After merge
 ○<┐     a8da1d8 Merge branch 'feature'
 │ ●     6874821 (feature) More feature work
 │ ●     a92071e Add feature
 ● │     18281f7 Main work
 ├─┘
 ●       f41a216 Second commit
 ●       4d6cd76 Initial commit
```

### Graph Styles

Five built-in styles are available via `--style`:

| Style | Lines | Corners | Dots | Example |
|-------|-------|---------|------|---------|
| `thin` / `normal` (default) | `│ ─` | `└ ┌ ┐ ┘` | `● ○` | `├─┘` |
| `round` | `│ ─` | `╰ ╭ ╮ ╯` | `● ○` | `├─╯` |
| `bold` | `┃ ━` | `┗ ┏ ┓ ┛` | `● ○` | `┣━┛` |
| `double` | `║ ═` | `╚ ╔ ╗ ╝` | `● ○` | `╠═╝` |
| `ascii` | `\| -` | `' . . '` | `* o` | `+-'` |

```bash
git-network-graph --style round
```

### SVG Output

Render graphs as SVG for documentation, presentations, or web embedding:

```bash
# Output SVG to stdout
git-network-graph --svg

# Write SVG to a file
git-network-graph --svg-file output.svg

# Horizontal layout (time flows left → right)
git-network-graph --svg-file output.svg --horizontal
```

<details>
<summary>Vertical SVG example (click to expand)</summary>

<img src="samples/vertical-round.svg" width="600" alt="Vertical SVG with round style">
</details>

<details>
<summary>Horizontal SVG example (click to expand)</summary>

<img src="samples/horizontal-thin.svg" width="800" alt="Horizontal SVG with thin style">
</details>

### CLI Options

| Option | Description |
|--------|-------------|
| `-p, --path <dir>` | Path to git repository (default: current directory) |
| `-m, --model <model>` | Branching model: `simple`, `git-flow`, `none`, or a custom model name |
| `-n, --max-count <n>` | Maximum number of commits to show |
| `-f, --format <fmt>` | Commit format: `oneline`, `short`, `medium`, `full`, or custom `"<string>"` |
| `--color <mode>` | Color mode: `auto`, `always`, `never` |
| `--no-color` | Print without colors |
| `-s, --style <style>` | Graph style: `normal`, `round`, `bold`, `double`, `ascii` |
| `-r, --reverse` | Reverse the order of commits |
| `-l, --local` | Show only local branches (no remotes) |
| `--svg` | Render graph as SVG (stdout) |
| `--svg-file [path]` | Write SVG to a file (default: `git-graph.svg` in repo dir) |
| `--horizontal` | Render SVG horizontally (left-to-right). Use with `--svg`/`--svg-file` |
| `--merges-only` | Only show dots on merge commits (○), hide dots on regular commits |
| `-S, --sparse` | Less compact graph layout |
| `-d, --debug` | Debug output with timing info |
| `-w, --wrap [args]` | Line wrapping: `<width>|auto|none [<indent1> [<indent2>]]` |

### Branching Models

Configure branch display order, colors, and persistence:

```bash
# List available models
git-network-graph model --list

# Set a model for the current repo
git-network-graph model <name>

# Show current model
git-network-graph model
```

### Custom Format Strings

Use `%` placeholders in custom format strings:

```bash
git-network-graph -f "%h %s (%an)"
```

| Placeholder | Description |
|-------------|-------------|
| `%H` | Full commit hash |
| `%h` | Abbreviated commit hash |
| `%s` | Subject (first line of message) |
| `%b` | Body (rest of message) |
| `%an` | Author name |
| `%ae` | Author email |
| `%ad` | Author date |
| `%cn` | Committer name |
| `%ce` | Committer email |
| `%cd` | Committer date |
| `%p` | Parent hashes |
| `%n` | Newline |

## Library Usage

### Settings

Both `createGitGraph` and `createGitGraphFromData` require a `Settings` object. Here's what each field controls:

| Field | Type | Description |
|-------|------|-------------|
| `reverseCommitOrder` | `boolean` | Reverse commit display order (oldest first) |
| `compact` | `boolean` | Compact graph layout (fewer blank lines) |
| `colored` | `boolean` | Enable ANSI colors in terminal output |
| `includeRemote` | `boolean` | Include remote tracking branches |
| `format` | `CommitFormat` | Commit text format: `{ type: 'OneLine' }`, `{ type: 'Short' }`, etc. |
| `wrapping` | `[width, indent1, indent2] \| null` | Line wrapping config, or `null` for no wrapping |
| `characters` | `Characters` | Graph style: `Characters.thin()`, `.round()`, `.bold()`, `.double()`, `.ascii()` |
| `branchOrder` | `BranchOrder` | Branch column ordering strategy |
| `branches` | `BranchSettings` | Branch colors and persistence. Use `BranchSettings.from(BranchSettingsDef.gitFlow())` for git-flow defaults |
| `mergePatterns` | `MergePatterns` | Patterns for detecting merge commits. Use `MergePatterns.default()` |
| `debug` | `boolean` | Enable debug output |
| `mergesOnly` | `boolean` | Only show dots on merge commits |

### From a git repository

`createGitGraph(dir, fs, settings)` reads commits directly from a git repo using [isomorphic-git](https://isomorphic-git.org/).

```typescript
import * as fs from 'fs';
import { createGitGraph, printUnicode, Characters, BranchSettings, BranchSettingsDef, MergePatterns } from 'git-network-graph';
import type { Settings } from 'git-network-graph';

const settings: Settings = {
  reverseCommitOrder: false,
  debug: false,
  compact: true,
  colored: true,
  includeRemote: true,
  format: { type: 'OneLine' },
  wrapping: null,
  characters: Characters.thin(),
  branchOrder: { type: 'ShortestFirst', forward: true },
  branches: BranchSettings.from(BranchSettingsDef.gitFlow()),
  mergePatterns: MergePatterns.default(),
};

const graph = await createGitGraph('/path/to/repo', fs, settings);

// printUnicode returns [graphLines[], textLines[]] — parallel arrays
const [graphLines, textLines] = printUnicode(graph, settings);
graphLines.forEach((g, i) => console.log(` ${g}  ${textLines[i]}`));
```

### From raw data (no git repo needed)

`createGitGraphFromData(input, settings)` builds a graph from raw commit, branch, and tag data — useful for APIs, databases, or custom data sources.

```typescript
import { createGitGraphFromData, printUnicode } from 'git-network-graph';
import type { RawGraphInput, Settings } from 'git-network-graph';

const input: RawGraphInput = {
  head: { oid: 'abc123', name: 'main', isBranch: true },
  commits: [
    // Commits must be in newest-first order (by committer timestamp)
    {
      oid: 'abc123',
      parentOids: ['def456'],
      message: 'Latest commit',
      author: { name: 'Alice', email: 'alice@example.com', timestamp: 1700000000, timezoneOffset: 0 },
      committer: { name: 'Alice', email: 'alice@example.com', timestamp: 1700000000, timezoneOffset: 0 },
    },
    {
      oid: 'def456',
      parentOids: [],
      message: 'Initial commit',
      // author and committer are optional but recommended
    },
  ],
  branches: [{ name: 'main', oid: 'abc123' }],
  tags: [{ name: 'v1.0', oid: 'def456' }],    // optional
};

const graph = createGitGraphFromData(input, settings); // settings as shown above
const [graphLines, textLines] = printUnicode(graph, settings);
```

### SVG rendering

`printSvg(graph, settings, horizontal)` returns the SVG as a string.

```typescript
import { printSvg } from 'git-network-graph';

// Vertical SVG (default)
const svg = printSvg(graph, settings, false);

// Horizontal SVG (time flows left → right)
const horizontalSvg = printSvg(graph, settings, true);

// Write to file
import * as fs from 'fs';
fs.writeFileSync('graph.svg', svg);
```

## API Reference

### Core functions

| Function | Description |
|----------|-------------|
| `createGitGraph(dir, fs, settings)` | Build graph from a git repository (async) |
| `createGitGraphFromData(input, settings)` | Build graph from raw JSON data (sync) |
| `printUnicode(graph, settings)` | Render graph as terminal text. Returns `[graphLines[], textLines[]]` |
| `printSvg(graph, settings, horizontal)` | Render graph as SVG string |

### Key types

| Type | Description |
|------|-------------|
| `GitGraph` | The graph object: `{ commits, indices, allBranches, head }` |
| `Settings` | Full configuration for graph construction and rendering |
| `RawGraphInput` | Input for `createGitGraphFromData`: `{ head, commits, branches, tags? }` |
| `RawCommit` | Raw commit: `{ oid, parentOids, message, author?, committer? }` |
| `RawBranch` | Raw branch ref: `{ name, oid, isRemote? }` |
| `RawTag` | Raw tag ref: `{ name, oid }` |
| `CommitInfo` | Commit in the graph with topology and metadata |
| `BranchInfo` | Branch with visual layout info |
| `HeadInfo` | HEAD ref: `{ oid, name, isBranch }` |
| `Characters` | Graph style characters (factory methods: `.thin()`, `.round()`, `.bold()`, `.double()`, `.ascii()`) |
| `FS` | Filesystem interface for `createGitGraph` (Node.js `fs` module works) |

## Credits

This is a TypeScript port of [git-graph](https://github.com/git-bahn/git-graph) (v0.7.0), originally written in Rust by [Martin Lange](https://github.com/git-bahn). The original project is licensed under the MIT License.

## License

[MIT](LICENSE) — see the license file for full details.
