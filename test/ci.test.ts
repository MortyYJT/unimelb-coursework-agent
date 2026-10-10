import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('checks PRs and main pushes on Node 24 using the local command', () => {
  const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  expect(workflow).toContain('pull_request:');
  expect(workflow).toMatch(/push:\s+branches: \[main\]/);
  expect(workflow).toContain('node-version: 24');
  expect(workflow).toContain('run: npm ci && npm run check');
});
