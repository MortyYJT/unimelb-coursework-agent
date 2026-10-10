import { mkdtempSync, existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { synthetic } from '../fixtures/synthetic.js';
import { SqliteRepository } from '../../src/store/sqlite.js';

const stores: SqliteRepository[] = [];
const dirs: string[] = [];
function open(path = ':memory:') {
  const store = new SqliteRepository(path);
  stores.push(store);
  return store;
}
function databasePath() {
  const dir = mkdtempSync(join(tmpdir(), 'coursework-store-'));
  dirs.push(dir);
  return join(dir, 'nested', 'coursework.db');
}
afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it('opens a full in-memory schema without creating a file', () => {
  const store = open();
  store.saveBatch({ modules: [synthetic.module], courses: [synthetic.course],
    assessments: synthetic.assessments, sourceItems: [synthetic.sourceItem],
    tasks: [synthetic.task], runs: [synthetic.run] });
  expect(store.loadModule(synthetic.module.id)).toEqual(synthetic.module);
  expect(store.loadCourse(synthetic.course.id)).toEqual(synthetic.course);
  expect(store.loadAssessment('a')).toEqual(synthetic.assessments[0]);
  expect(store.loadSourceItem(synthetic.sourceItem.id)).toEqual(synthetic.sourceItem);
  expect(store.loadTask(synthetic.task.id)).toEqual(synthetic.task);
  expect(store.loadRun(synthetic.run.id)).toEqual(synthetic.run);
  expect(existsSync(':memory:')).toBe(false);
});

it('creates missing parents and persists all entity operations across reopen', () => {
  const path = databasePath();
  const store = open(path);
  store.saveModule(synthetic.module);
  store.saveCourse(synthetic.course);
  store.saveAssessment(synthetic.assessments[0]);
  store.saveSourceItem(synthetic.sourceItem);
  store.saveTask(synthetic.task);
  store.recordRun(synthetic.run);
  store.close();
  const reopened = open(path);
  expect(reopened.loadModule(synthetic.module.id)).toEqual(synthetic.module);
  expect(reopened.loadCourse(synthetic.course.id)).toEqual(synthetic.course);
  expect(reopened.loadAssessment('a')).toEqual(synthetic.assessments[0]);
  expect(reopened.loadSourceItem(synthetic.sourceItem.id)).toEqual(synthetic.sourceItem);
  expect(reopened.loadTask(synthetic.task.id)).toEqual(synthetic.task);
  expect(reopened.loadRun(synthetic.run.id)).toEqual(synthetic.run);
});

it('returns undefined for missing entities and upserts existing ids', () => {
  const store = open();
  expect(store.loadModule('missing')).toBeUndefined();
  expect(store.loadCourse('missing')).toBeUndefined();
  expect(store.loadAssessment('missing')).toBeUndefined();
  expect(store.loadSourceItem('missing')).toBeUndefined();
  expect(store.loadTask('missing')).toBeUndefined();
  expect(store.loadRun('missing')).toBeUndefined();
  store.saveTask(synthetic.task);
  const updated = { ...synthetic.task, title: 'Updated fictional title' };
  store.saveTask(updated);
  expect(store.loadTask(updated.id)).toEqual(updated);
});

it('rejects a batch of three tasks without leaving any trace', () => {
  const store = open();
  const first = { ...synthetic.task, id: 'first' };
  const second = { ...synthetic.task, id: 'second' };
  const invalid = { ...synthetic.task, id: 'third', steps: [] };
  expect(() => store.saveBatch({ tasks: [first, second, invalid] })).toThrow();
  for (const id of ['first', 'second', 'third']) expect(store.loadTask(id)).toBeUndefined();
  store.saveTask(first);
  expect(store.loadTask(first.id)).toEqual(first);
});

it('rolls back earlier groups and overwritten rows when a later group fails', () => {
  const store = open();
  store.saveModule(synthetic.module);
  expect(() => store.saveBatch({
    modules: [{ ...synthetic.module, name: 'Overwritten' }],
    courses: [synthetic.course], runs: [{ ...synthetic.run, steps: -1 }],
  })).toThrow();
  expect(store.loadModule(synthetic.module.id)).toEqual(synthetic.module);
  expect(store.loadCourse(synthetic.course.id)).toBeUndefined();
  expect(store.loadRun(synthetic.run.id)).toBeUndefined();
});

it('parses on write, strips unknown fields and rejects malformed nested data', () => {
  const store = open();
  const extra = { ...synthetic.task, ignored: 'not persisted' };
  store.saveTask(extra);
  expect(store.loadTask(extra.id)).toEqual(synthetic.task);
  const invalid = { ...synthetic.task, steps: [{ ...synthetic.task.steps[0], citations: [] }] };
  expect(() => store.saveTask(invalid)).toThrow();
  expect(store.loadTask(extra.id)).toEqual(synthetic.task);
});

it('parses persisted JSON on read and refuses corrupt entities', () => {
  const path = databasePath();
  const store = open(path);
  store.saveTask(synthetic.task);
  store.close();
  // Equal-length corruption preserves SQLite pages while removing a required JSON field.
  const bytes = readFileSync(path);
  const offset = bytes.indexOf(Buffer.from('"title":'));
  expect(offset).toBeGreaterThan(-1);
  bytes.write('"xxxxx":', offset);
  writeFileSync(path, bytes);
  expect(() => open(path).loadTask(synthetic.task.id)).toThrow();
});

// Task 3.4 and directory resolution belong to issue D.
it.skip('Default location: resolves package root .local/coursework.db (issue D)', () => {});
it.skip('Override: resolves all data under COURSEWORK_HOME (issue D)', () => {});
