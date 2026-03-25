/**
 * Generate sample SVGs in the samples/ directory from the test fixture.
 * Uses the same fixture data as the snapshot tests — no external repo needed.
 *
 * Usage: npx tsx scripts/generate-samples.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { printSvg } from '../src/print/svg';
import { Characters, BranchSettings, BranchSettingsDef, MergePatterns } from '../src/settings';
import type { Settings } from '../src/settings';
import type { GitGraph } from '../src/graph';

function loadFixture(): GitGraph {
  const jsonPath = path.join(__dirname, '..', 'tests', 'fixtures', 'arbol-graph.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  return {
    commits: data.commits,
    indices: new Map(data.indices),
    allBranches: data.allBranches,
    head: data.head,
  };
}

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
  { name: 'thin', chars: Characters.thin() },
  { name: 'round', chars: Characters.round() },
  { name: 'bold', chars: Characters.bold() },
  { name: 'double', chars: Characters.double() },
  { name: 'ascii', chars: Characters.ascii() },
];

function main(): void {
  const graph = loadFixture();
  const samplesDir = path.join(__dirname, '..', 'samples');
  fs.mkdirSync(samplesDir, { recursive: true });

  let count = 0;

  for (const { name, chars } of styles) {
    // Vertical
    const vSettings = makeSettings({ characters: chars });
    fs.writeFileSync(path.join(samplesDir, `vertical-${name}.svg`), printSvg(graph, vSettings));
    count++;

    // Vertical reverse
    const vrSettings = makeSettings({ characters: chars.reverse(), reverseCommitOrder: true });
    fs.writeFileSync(path.join(samplesDir, `vertical-reverse-${name}.svg`), printSvg(graph, vrSettings));
    count++;

    // Horizontal
    fs.writeFileSync(path.join(samplesDir, `horizontal-${name}.svg`), printSvg(graph, vSettings, true));
    count++;

    // Horizontal reverse
    fs.writeFileSync(path.join(samplesDir, `horizontal-reverse-${name}.svg`), printSvg(graph, vrSettings, true));
    count++;
  }

  console.log(`Generated ${count} sample SVGs in ${samplesDir}`);
}

main();
