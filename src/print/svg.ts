/**
 * Create graphs in SVG format (Scalable Vector Graphics).
 * Renders a terminal-style output: colored Unicode graph characters
 * alongside commit text on a dark background with monospace font.
 */

import type { GitGraph } from '../graph';
import type { Settings } from '../settings';
import { printUnicode, buildUnicodeGrid, Grid, SPACE, DOT, CIRCLE, VER, HOR, CROSS, R_U, R_D, L_D, L_U, VER_L, VER_R, HOR_U, HOR_D, ARR_L, ARR_R, WHITE } from './unicode';
import { ansi256ToHex } from './colors';
import chalk from 'chalk';

// Layout constants — Kreative Square SM is a 1:1 (square cell) monospace font
const FONT_SIZE = 14;
const CHAR_WIDTH = FONT_SIZE;
const LINE_HEIGHT = FONT_SIZE;
const PADDING_X = 10;
const PADDING_Y = 8;
const BG_COLOR = '#1e1e1e';
const DEFAULT_TEXT_COLOR = '#cccccc';
const FONT_FAMILY = "'Kreative Square SM', monospace";
const TEXT_FONT_FAMILY = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace";
const TEXT_FONT_SIZE = 12;
const TEXT_CHAR_WIDTH = 7.2;

// Kreative Square SM (subset) — SIL OFL licensed, 1:1 square monospace font
// Source: https://github.com/kreativekorp/open-relay/tree/master/KreativeSquare
import { FONT_BASE64 } from './font-data';

/**
 * SVG character override map.
 * Maps terminal characters → Kreative Square SM glyphs for SVG output.
 * Edit this map to swap characters — no other changes needed.
 */
const SVG_CHAR_OVERRIDE: Record<string, string> = {
  '●': '\u26AB', // U+25CF → U+26AB (medium black circle)
  '○': '\u26AA', // U+25CB → U+26AA (medium white circle)
};

/**
 * Additional overrides for horizontal SVG (by character index).
 * These are applied on top of SVG_CHAR_OVERRIDE.
 */
const SVG_HORIZONTAL_OVERRIDE: Record<number, string> = {
  [ARR_L]: '\u2303',  // < → ⌃ (up arrowhead)
  [ARR_R]: '\u2304',  // > → ⌄ (down arrowhead)
};

function applySvgOverrides(spans: AnsiSpan[]): AnsiSpan[] {
  return spans.map(span => {
    let text = span.text;
    for (const [from, to] of Object.entries(SVG_CHAR_OVERRIDE)) {
      text = text.replaceAll(from, to);
    }
    return text === span.text ? span : { ...span, text };
  });
}

function resolveHorizontalChar(charIndex: number, characters: { chars: string[] }): string {
  if (SVG_HORIZONTAL_OVERRIDE[charIndex] !== undefined) return SVG_HORIZONTAL_OVERRIDE[charIndex];
  const base = characters.chars[charIndex];
  return SVG_CHAR_OVERRIDE[base] ?? base;
}

function svgFontFace(): string {
  return `<defs><style>@font-face{font-family:'Kreative Square SM';src:url('data:font/woff2;base64,${FONT_BASE64}') format('woff2');}</style></defs>`;
}

/** A span of text with an optional hex color. */
export interface AnsiSpan {
  text: string;
  color?: string;
}

/**
 * Parse a string containing ANSI-256 color escape sequences into
 * structured spans with hex colors.
 *
 * Handles: ESC[38;5;Nm (set fg), ESC[39m (reset fg), ESC[0m (full reset)
 */
export function parseAnsi(input: string): AnsiSpan[] {
  if (input.length === 0) return [];

  const spans: AnsiSpan[] = [];
  // Match ANSI 256-color set (38;5;N), fg reset (39), or full reset (0)
  const ansiRe = /\x1b\[(?:38;5;(\d+)|39|0)m/g;

  let currentColor: string | undefined;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiRe.exec(input)) !== null) {
    // Text before this escape
    const text = input.slice(lastIndex, match.index);
    if (text.length > 0) {
      spans.push(currentColor ? { text, color: currentColor } : { text });
    }

    if (match[1] !== undefined) {
      // ESC[38;5;Nm — set foreground color
      currentColor = ansi256ToHex(parseInt(match[1], 10));
    } else {
      // ESC[39m or ESC[0m — reset
      currentColor = undefined;
    }

    lastIndex = match.index + match[0].length;
  }

  // Trailing text
  const tail = input.slice(lastIndex);
  if (tail.length > 0) {
    spans.push(currentColor ? { text: tail, color: currentColor } : { text: tail });
  }

  return spans;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a line of spans as SVG `<text>` with colored `<tspan>` children.
 */
function renderSvgLine(spans: AnsiSpan[], x: number, y: number): string {
  const parts: string[] = [];
  for (const span of spans) {
    const fill = span.color ?? DEFAULT_TEXT_COLOR;
    parts.push(`<tspan fill="${fill}">${escapeXml(span.text)}</tspan>`);
  }
  return `<text x="${x}" y="${y}" xml:space="preserve">${parts.join('')}</text>`;
}

/**
 * Character index mapping for 90° clockwise rotation.
 * Direction transform: UP→RIGHT, RIGHT→DOWN, DOWN→LEFT, LEFT→UP.
 */
const ROTATE_CW_MAP: Record<number, number> = {
  [SPACE]: SPACE,
  [DOT]: DOT,
  [CIRCLE]: CIRCLE,
  [VER]: HOR,
  [HOR]: VER,
  [CROSS]: CROSS,
  [R_U]: R_D,      // └(right+up) → ┌(down+right)
  [R_D]: L_D,      // ┌(right+down) → ┐(left+down)
  [L_D]: L_U,      // ┐(left+down) → ┘(left+up)
  [L_U]: R_U,      // ┘(left+up) → └(right+up)
  [VER_L]: HOR_U,  // ┤(u+d+l) → ┴(l+r+u)
  [VER_R]: HOR_D,  // ├(u+d+r) → ┬(l+r+d)
  [HOR_U]: VER_R,  // ┴(l+r+u) → ├(u+d+r)
  [HOR_D]: VER_L,  // ┬(l+r+d) → ┤(u+d+l)
  [ARR_L]: ARR_L,
  [ARR_R]: ARR_R,
};

/**
 * Character index mapping for 90° counter-clockwise rotation.
 * Same corner/junction remapping as CW (branches keep same vertical order),
 * but arrows are swapped (merge direction reverses with time).
 */
const ROTATE_CCW_MAP: Record<number, number> = {
  [SPACE]: SPACE,
  [DOT]: DOT,
  [CIRCLE]: CIRCLE,
  [VER]: HOR,
  [HOR]: VER,
  [CROSS]: CROSS,
  [R_U]: R_D,      // └ → ┌
  [R_D]: L_D,      // ┌ → ┐
  [L_D]: L_U,      // ┐ → ┘
  [L_U]: R_U,      // ┘ → └
  [VER_L]: HOR_U,  // ┤ → ┴
  [VER_R]: HOR_D,  // ├ → ┬
  [HOR_U]: VER_R,  // ┴ → ├
  [HOR_D]: VER_L,  // ┬ → ┤
  [ARR_L]: ARR_R,  // ⌃ → ⌄
  [ARR_R]: ARR_L,  // ⌄ → ⌃
};

/**
 * Rotate a grid 90° clockwise: time flows left(oldest)→right(newest).
 * Maps original (x, y) → new (H-1-y, x).
 */
export function rotateGridCW(grid: Grid): Grid {
  const newGrid = new Grid(grid.height, grid.width, {
    character: SPACE,
    color: WHITE,
    pers: 0,
  });

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.data[grid.index(x, y)];
      const newChar = ROTATE_CW_MAP[cell.character] ?? cell.character;
      newGrid.set(grid.height - 1 - y, x, newChar, cell.color, cell.pers);
    }
  }

  return newGrid;
}

/**
 * Rotate a grid 90° counter-clockwise: time flows left(newest)→right(oldest).
 * Maps original (x, y) → new (y, W-1-x).
 */
export function rotateGridCCW(grid: Grid): Grid {
  const newGrid = new Grid(grid.height, grid.width, {
    character: SPACE,
    color: WHITE,
    pers: 0,
  });

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.data[grid.index(x, y)];
      const newChar = ROTATE_CCW_MAP[cell.character] ?? cell.character;
      newGrid.set(y, grid.width - 1 - x, newChar, cell.color, cell.pers);
    }
  }

  return newGrid;
}

/**
 * Creates a terminal-style SVG representation of a graph.
 * Produces colored Unicode graph characters alongside formatted commit text
 * on a dark background with monospace font.
 * When horizontal is true, the graph flows left-to-right using the original
 * SVG primitive renderer (circles, lines, paths).
 */
export function printSvg(graph: GitGraph, settings: Settings, horizontal: boolean = false): string {
  // Force colored output — chalk may disable colors when piped
  const prevLevel = chalk.level;
  chalk.level = 2; // 256-color support
  try {
    if (horizontal) {
      return printSvgHorizontal(graph, settings);
    }
    return printSvgVertical(graph, settings);
  } finally {
    chalk.level = prevLevel;
  }
}

function printSvgVertical(graph: GitGraph, settings: Settings): string {
  const svgSettings: Settings = { ...settings, colored: true };

  const [graphLines, textLines] = printUnicode(graph, svgSettings);

  // Parse graph and text ANSI separately, trimming trailing spaces from graph
  const parsedGraph = graphLines.map(line => {
    const spans = parseAnsi(line);
    // Trim trailing whitespace-only spans
    while (spans.length > 0) {
      const last = spans[spans.length - 1];
      const trimmed = last.text.replace(/\s+$/, '');
      if (trimmed.length === 0) {
        spans.pop();
      } else {
        spans[spans.length - 1] = { ...last, text: trimmed };
        break;
      }
    }
    return spans;
  });
  const parsedText = textLines.map(parseAnsi);

  // Calculate graph width in characters (max stripped length of graph lines)
  const graphCharWidth = graphLines.reduce((max, line) => {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
    return Math.max(max, stripped.length);
  }, 0);

  // Calculate text width for SVG sizing
  const maxTextLen = textLines.reduce((max, line) => {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
    return Math.max(max, stripped.length);
  }, 0);

  const textXOffset = graphCharWidth * CHAR_WIDTH + 2 * CHAR_WIDTH; // 2-char gap
  const width = PADDING_X * 2 + textXOffset + maxTextLen * TEXT_CHAR_WIDTH;
  const height = PADDING_Y * 2 + graphLines.length * LINE_HEIGHT;

  const elements: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    svgFontFace(),
    `<rect width="100%" height="100%" fill="${BG_COLOR}"/>`,
  ];

  // Graph portion — Kreative Square SM (1:1 square cells)
  elements.push(`<g font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" dominant-baseline="text-before-edge">`);
  for (let i = 0; i < parsedGraph.length; i++) {
    if (parsedGraph[i].length === 0) continue;
    const x = PADDING_X;
    const y = PADDING_Y + i * LINE_HEIGHT;
    elements.push(renderSvgLine(applySvgOverrides(parsedGraph[i]), x, y));
  }
  elements.push('</g>');

  // Text portion — standard monospace font
  elements.push(`<g font-family="${TEXT_FONT_FAMILY}" font-size="${TEXT_FONT_SIZE}" dominant-baseline="text-before-edge">`);
  for (let i = 0; i < parsedText.length; i++) {
    if (parsedText[i].length === 0) continue;
    const x = PADDING_X + textXOffset;
    const y = PADDING_Y + i * LINE_HEIGHT;
    elements.push(renderSvgLine(parsedText[i], x, y));
  }
  elements.push('</g>');

  elements.push('</svg>');

  return elements.join('\n');
}

// ---- Horizontal SVG — grid-based renderer (90° rotation of vertical) ----

function printSvgHorizontal(graph: GitGraph, settings: Settings): string {
  // Build grid without reversal — rotation handles time direction
  const svgSettings: Settings = { ...settings, colored: true, reverseCommitOrder: false };

  const result = buildUnicodeGrid(graph, svgSettings);
  if (!result) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0" width="0" height="0"></svg>';
  }

  const { grid } = result;
  // CW rotation: oldest-left → newest-right (conventional)
  // CCW rotation: newest-left → oldest-right (reversed)
  const rotated = settings.reverseCommitOrder
    ? rotateGridCCW(grid)
    : rotateGridCW(grid);

  const width = PADDING_X * 2 + rotated.width * CHAR_WIDTH;
  const height = PADDING_Y * 2 + rotated.height * LINE_HEIGHT;

  const elements: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    svgFontFace(),
    `<rect width="100%" height="100%" fill="${BG_COLOR}"/>`,
  ];

  elements.push(`<g font-family="${FONT_FAMILY}" font-size="${FONT_SIZE}" dominant-baseline="text-before-edge">`);

  for (let y = 0; y < rotated.height; y++) {
    const spans: AnsiSpan[] = [];
    for (let x = 0; x < rotated.width; x++) {
      const cell = rotated.data[rotated.index(x, y)];
      if (cell.character === SPACE) {
        spans.push({ text: ' ' });
      } else {
        const charStr = resolveHorizontalChar(cell.character, settings.characters);
        const color = cell.color !== WHITE ? ansi256ToHex(cell.color) : undefined;
        spans.push(color ? { text: charStr, color } : { text: charStr });
      }
    }

    // Trim trailing whitespace-only spans
    while (spans.length > 0) {
      const last = spans[spans.length - 1];
      const trimmed = last.text.replace(/\s+$/, '');
      if (trimmed.length === 0) {
        spans.pop();
      } else {
        spans[spans.length - 1] = { ...last, text: trimmed };
        break;
      }
    }

    if (spans.length === 0) continue;
    const sx = PADDING_X;
    const sy = PADDING_Y + y * LINE_HEIGHT;
    elements.push(renderSvgLine(spans, sx, sy));
  }

  elements.push('</g>');
  elements.push('</svg>');

  return elements.join('\n');
}
