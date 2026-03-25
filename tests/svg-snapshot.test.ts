import { describe, it, expect } from 'vitest';
import { printSvg } from '../src/print/svg';
import { Characters } from '../src/settings';
import type { Settings } from '../src/settings';
import { BranchSettingsDef, BranchSettings, MergePatterns } from '../src/settings';
import { loadArbolGraph } from './fixtures/load-graph';

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
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
    ...overrides,
  };
}

const styles = [
  { name: 'normal', chars: Characters.thin() },
  { name: 'round', chars: Characters.round() },
  { name: 'bold', chars: Characters.bold() },
  { name: 'double', chars: Characters.double() },
  { name: 'ascii', chars: Characters.ascii() },
] as const;

describe('SVG snapshot regression', () => {
  const graph = loadArbolGraph();

  describe('vertical', () => {
    for (const { name, chars } of styles) {
      it(`matches snapshot for ${name} style`, async () => {
        const settings = makeSettings({ characters: chars });
        const svg = printSvg(graph, settings);
        await expect(svg).toMatchFileSnapshot(
          `__snapshots__/svg-vertical-${name}.svg`
        );
      });
    }
  });

  describe('vertical reverse', () => {
    for (const { name, chars } of styles) {
      it(`matches snapshot for ${name} style (reverse)`, async () => {
        const settings = makeSettings({
          characters: chars.reverse(),
          reverseCommitOrder: true,
        });
        const svg = printSvg(graph, settings);
        await expect(svg).toMatchFileSnapshot(
          `__snapshots__/svg-vertical-reverse-${name}.svg`
        );
      });
    }
  });

  describe('horizontal', () => {
    for (const { name, chars } of styles) {
      it(`matches snapshot for ${name} style`, async () => {
        const settings = makeSettings({ characters: chars });
        const svg = printSvg(graph, settings, true);
        await expect(svg).toMatchFileSnapshot(
          `__snapshots__/svg-horizontal-${name}.svg`
        );
      });
    }
  });

  describe('horizontal reverse', () => {
    for (const { name, chars } of styles) {
      it(`matches snapshot for ${name} style (reverse)`, async () => {
        const settings = makeSettings({
          characters: chars.reverse(),
          reverseCommitOrder: true,
        });
        const svg = printSvg(graph, settings, true);
        await expect(svg).toMatchFileSnapshot(
          `__snapshots__/svg-horizontal-reverse-${name}.svg`
        );
      });
    }
  });
});
