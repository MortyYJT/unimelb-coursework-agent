#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

new Command()
  .name('coursework')
  .description('Manage cited coursework tasks')
  .version(version)
  .parse();
