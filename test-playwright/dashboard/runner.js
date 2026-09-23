import { spawn } from 'node:child_process';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { getProject } from './projects.config.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

let nextRunId = 1;
const runs = new Map(); // runId -> run record
const queue = []; // runIds waiting to start
let activeRunId = null;

export const events = new EventEmitter();
events.setMaxListeners(0);

function summarize(output) {
  const passed = /(\d+)\s+passed/.exec(output);
  const failed = /(\d+)\s+failed/.exec(output);
  const skipped = /(\d+)\s+skipped/.exec(output);
  if (!passed && !failed && !skipped) return null;
  return {
    passed: passed ? Number(passed[1]) : 0,
    failed: failed ? Number(failed[1]) : 0,
    skipped: skipped ? Number(skipped[1]) : 0,
  };
}

function startNextIfIdle() {
  if (activeRunId !== null) return;
  const runId = queue.shift();
  if (runId === undefined) return;
  const run = runs.get(runId);
  activeRunId = runId;
  run.status = 'running';
  run.startedAt = Date.now();
  events.emit('run-update', run);

  const project = getProject(run.projectId);
  const cwd = path.join(REPO_ROOT, project.cwd);
  // run.specs are paths relative to project.testDir (as listed by the dashboard); Playwright's
  // file filter matches by substring against each test file's resolved path, so prefixing with
  // testDir keeps the match precise even when the same filename exists in multiple subfolders.
  const specArgs = run.specs.map((s) => path.posix.join(project.testDir, s));
  const args = ['playwright', 'test', '--config', project.config, ...specArgs];

  const child = spawn('npx', args, { cwd, shell: process.platform === 'win32' });
  run.pid = child.pid;

  const appendLine = (line) => {
    run.output += line;
    events.emit('run-log', { runId, line });
  };

  child.stdout.on('data', (chunk) => appendLine(chunk.toString()));
  child.stderr.on('data', (chunk) => appendLine(chunk.toString()));

  child.on('close', (code) => {
    run.exitCode = code;
    run.status = code === 0 ? 'passed' : 'failed';
    run.finishedAt = Date.now();
    run.summary = summarize(run.output);
    events.emit('run-update', run);
    events.emit('run-done', run);
    activeRunId = null;
    startNextIfIdle();
  });

  child.on('error', (err) => {
    run.exitCode = -1;
    run.status = 'error';
    run.finishedAt = Date.now();
    appendLine(`\n[dashboard] Failed to start process: ${err.message}\n`);
    events.emit('run-update', run);
    events.emit('run-done', run);
    activeRunId = null;
    startNextIfIdle();
  });
}

/** Enqueue a run. specs is an array of already-validated spec filenames (empty = run whole project). */
export function enqueueRun(projectId, specs) {
  const runId = String(nextRunId++);
  const run = {
    runId,
    projectId,
    specs,
    status: 'queued',
    output: '',
    exitCode: null,
    summary: null,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
  };
  runs.set(runId, run);
  queue.push(runId);
  events.emit('run-update', run);
  startNextIfIdle();
  return run;
}

export function getRun(runId) {
  return runs.get(runId);
}

export function listRecentRuns(limit = 20) {
  return Array.from(runs.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map(({ output, ...rest }) => rest); // omit full output from list view
}
