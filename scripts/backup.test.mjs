/**
 * backup.test.mjs
 *
 * Node.js native test for scripts/backup.sh.
 * Uses Node built-ins plus better-sqlite3 for WAL integrity verification.
 * NOT part of the Vitest suite — run with: node scripts/backup.test.mjs
 *
 * Test cases:
 *   1. Happy path — creates a timestamped backup file.
 *   2. Retention — backup files older than 30 days are deleted.
 *   3. Missing DB_PATH — exits with code 1 and writes ERROR to stderr.
 *   4. WAL-mode integrity — committed WAL rows are present in the backup.
 */

import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import Database from 'better-sqlite3';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;
const BACKUP_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'backup.sh');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(...dirs) {
  for (const dir of dirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* best effort */ }
  }
}

function runBackup(env) {
  return spawnSync('bash', [BACKUP_SCRIPT], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function createSqliteDb(dbPath) {
  const database = new Database(dbPath);
  try {
    database.exec('CREATE TABLE smoke (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
    database.prepare('INSERT INTO smoke (value) VALUES (?)').run('ok');
  } finally {
    database.close();
  }
}

// ── Test 1: Happy path ────────────────────────────────────────────────────────

console.log('Test 1: happy path — creates timestamped backup');
{
  const tmpData = makeTempDir('syncrv-test-data-');
  const tmpBackup = makeTempDir('syncrv-test-backup-');

  try {
    const dbPath = path.join(tmpData, 'sync_sirius.db');
    createSqliteDb(dbPath);

    const result = runBackup({
      DB_PATH: dbPath,
      BACKUP_DIR: tmpBackup,
    });

    assert.equal(result.status, 0, `Expected exit 0, got ${result.status}. stderr: ${result.stderr}`);

    const files = fs.readdirSync(tmpBackup).filter(f => f.startsWith('sync_sirius_') && f.endsWith('.db'));
    assert.ok(files.length === 1, `Expected 1 backup file, found ${files.length}: ${JSON.stringify(files)}`);

    const backupFile = path.join(tmpBackup, files[0]);
    const stat = fs.statSync(backupFile);
    assert.ok(stat.size > 0, 'Backup file should not be empty');

    assert.ok(result.stdout.includes('[backup] Created:'), `stdout should contain "[backup] Created:". Got: ${result.stdout}`);

    console.log('  PASS — backup file created:', files[0]);
  } finally {
    cleanup(tmpData, tmpBackup);
  }
}

// ── Test 2: Retention ─────────────────────────────────────────────────────────

console.log('Test 2: retention — deletes backups older than 30 days');
{
  const tmpData = makeTempDir('syncrv-test-data-');
  const tmpBackup = makeTempDir('syncrv-test-backup-');

  try {
    const dbPath = path.join(tmpData, 'sync_sirius.db');
    createSqliteDb(dbPath);

    // Create two "old" backup files with mtime set to 31 days ago
    const oldFile1 = path.join(tmpBackup, 'sync_sirius_2026-04-01_02-00-00.db');
    const oldFile2 = path.join(tmpBackup, 'sync_sirius_2026-04-15_02-00-00.db');
    fs.writeFileSync(oldFile1, 'old backup 1');
    fs.writeFileSync(oldFile2, 'old backup 2');

    // Set mtime to 31 days ago without shelling out so the test works in
    // restricted sandboxes and CI containers.
    const oldTime = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    fs.utimesSync(oldFile1, oldTime, oldTime);
    fs.utimesSync(oldFile2, oldTime, oldTime);

    // Verify old files exist before the run
    assert.ok(fs.existsSync(oldFile1), 'Old file 1 should exist before run');
    assert.ok(fs.existsSync(oldFile2), 'Old file 2 should exist before run');

    const result = runBackup({
      DB_PATH: dbPath,
      BACKUP_DIR: tmpBackup,
    });

    assert.equal(result.status, 0, `Expected exit 0, got ${result.status}. stderr: ${result.stderr}`);

    // Old files should be gone
    assert.ok(!fs.existsSync(oldFile1), 'Old file 1 should have been deleted by retention');
    assert.ok(!fs.existsSync(oldFile2), 'Old file 2 should have been deleted by retention');

    // New backup should exist
    const files = fs.readdirSync(tmpBackup).filter(f => f.startsWith('sync_sirius_') && f.endsWith('.db'));
    assert.equal(files.length, 1, `Expected 1 remaining backup (the new one), found ${files.length}`);

    console.log('  PASS — old backups deleted, new backup retained:', files[0]);
  } finally {
    cleanup(tmpData, tmpBackup);
  }
}

// ── Test 3: Missing DB_PATH → exit 1 + ERROR on stderr ───────────────────────

console.log('Test 3: nonexistent DB_PATH → exit code 1 and ERROR on stderr');
{
  const tmpBackup = makeTempDir('syncrv-test-backup-');

  try {
    const result = runBackup({
      DB_PATH: '/nonexistent/path/to/sync_sirius.db',
      BACKUP_DIR: tmpBackup,
    });

    assert.equal(result.status, 1, `Expected exit 1, got ${result.status}`);
    assert.ok(
      result.stderr.includes('[backup] ERROR:'),
      `stderr should contain "[backup] ERROR:". Got: ${result.stderr}`
    );

    console.log('  PASS — exit 1 and ERROR logged to stderr');
  } finally {
    cleanup(tmpBackup);
  }
}

// ── Test 4: WAL-mode SQLite backup integrity ────────────────────────────────

console.log('Test 4: WAL-mode integrity — backs up committed rows from WAL');
{
  const tmpData = makeTempDir('syncrv-test-data-');
  const tmpBackup = makeTempDir('syncrv-test-backup-');

  try {
    const dbPath = path.join(tmpData, 'sync_sirius.db');
    const sourceDb = new Database(dbPath);
    sourceDb.pragma('journal_mode = WAL');
    sourceDb.exec('CREATE TABLE records (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
    sourceDb.prepare('INSERT INTO records (name) VALUES (?)').run('wal-backed row');

    const walPath = `${dbPath}-wal`;
    assert.ok(fs.existsSync(walPath), 'WAL file should exist before backup');

    const result = runBackup({
      DB_PATH: dbPath,
      BACKUP_DIR: tmpBackup,
    });

    assert.equal(result.status, 0, `Expected exit 0, got ${result.status}. stderr: ${result.stderr}`);

    const files = fs.readdirSync(tmpBackup).filter(f => f.startsWith('sync_sirius_') && f.endsWith('.db'));
    assert.equal(files.length, 1, `Expected 1 backup file, found ${files.length}: ${JSON.stringify(files)}`);

    const backupDb = new Database(path.join(tmpBackup, files[0]), { readonly: true, fileMustExist: true });
    try {
      const row = backupDb.prepare('SELECT name FROM records WHERE id = 1').get();
      assert.deepEqual(row, { name: 'wal-backed row' });
    } finally {
      backupDb.close();
      sourceDb.close();
    }

    console.log('  PASS — committed WAL row present in backup:', files[0]);
  } finally {
    cleanup(tmpData, tmpBackup);
  }
}

// ── All tests passed ──────────────────────────────────────────────────────────

console.log('\nAll backup tests passed.');
