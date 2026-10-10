import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

describe('Node 24 TypeScript scaffold', () => {
  it('publishes the coursework executable from an ESM package', () => {
    const pkg = readJson('package.json');
    expect(pkg.type).toBe('module');
    expect(pkg.engines.node).toBe('>=24');
    expect(pkg.bin).toEqual({ coursework: 'dist/cli.js' });
  });

  it('compiles strictly with NodeNext and emits the CLI into dist', () => {
    const config = readJson('tsconfig.json');
    expect(config.compilerOptions).toMatchObject({
      strict: true, module: 'NodeNext', moduleResolution: 'NodeNext', outDir: 'dist',
    });
  });
});
