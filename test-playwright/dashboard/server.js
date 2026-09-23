import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PROJECTS, getProject } from './projects.config.js';
import { enqueueRun, getRun, listRecentRuns, events } from './runner.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PORT = process.env.DASHBOARD_PORT || 4300;

const app = express();
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Serve each project's HTML report directory statically so any teammate can open it in their own browser.
for (const project of PROJECTS) {
  app.use(`/reports/${project.id}`, express.static(path.join(REPO_ROOT, project.cwd, project.reportDir)));
}

const SPEC_PATTERN = /\.spec\.(js|ts)$/i;
const SKIP_DIRS = new Set(['node_modules', '.git', 'test-results', 'playwright-report', 'allure-results', 'allure-report', 'screenshots']);

/** Recursively find *.spec.js/.spec.ts under `dir`, returning posix-style paths relative to `dir`. */
async function walkSpecs(dir, relPrefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const results = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const nested = await walkSpecs(path.join(dir, entry.name), `${relPrefix}${entry.name}/`);
      results.push(...nested);
    } else if (entry.isFile() && SPEC_PATTERN.test(entry.name)) {
      results.push(`${relPrefix}${entry.name}`);
    }
  }
  return results;
}

async function listSpecs(project) {
  const dir = path.join(REPO_ROOT, project.cwd, project.testDir);
  if (project.shallow) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    return entries
      .filter((e) => e.isFile() && SPEC_PATTERN.test(e.name))
      .map((e) => e.name)
      .sort();
  }
  const specs = await walkSpecs(dir);
  return specs.sort();
}

app.get('/api/projects', (req, res) => {
  res.json(PROJECTS.map(({ id, label }) => ({ id, label })));
});

app.get('/api/projects/:id/tests', async (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Unknown project' });
  const specs = await listSpecs(project);
  res.json({ specs });
});

app.post('/api/runs', async (req, res) => {
  const { projectId, specs = [] } = req.body ?? {};
  const project = getProject(projectId);
  if (!project) return res.status(400).json({ error: 'Unknown project' });

  if (specs.length > 0) {
    const available = await listSpecs(project);
    const invalid = specs.filter((s) => !available.includes(s));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Unknown spec file(s): ${invalid.join(', ')}` });
    }
  }

  const run = enqueueRun(projectId, specs);
  res.json({ runId: run.runId });
});

app.get('/api/runs', (req, res) => {
  res.json(listRecentRuns());
});

app.get('/api/runs/:runId', (req, res) => {
  const run = getRun(req.params.runId);
  if (!run) return res.status(404).json({ error: 'Unknown run' });
  res.json(run);
});

app.get('/api/runs/:runId/stream', (req, res) => {
  const { runId } = req.params;
  const run = getRun(runId);
  if (!run) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Replay whatever's already happened for this run (covers reconnects / late subscribers).
  send('status', { status: run.status });
  if (run.output) send('log', { line: run.output });

  const onLog = (payload) => {
    if (payload.runId === runId) send('log', { line: payload.line });
  };
  const onUpdate = (payload) => {
    if (payload.runId === runId) send('status', { status: payload.status });
  };
  const onDone = (payload) => {
    if (payload.runId === runId) {
      send('done', { exitCode: payload.exitCode, summary: payload.summary, status: payload.status });
      cleanup();
    }
  };

  events.on('run-log', onLog);
  events.on('run-update', onUpdate);
  events.on('run-done', onDone);

  function cleanup() {
    events.off('run-log', onLog);
    events.off('run-update', onUpdate);
    events.off('run-done', onDone);
    res.end();
  }

  req.on('close', cleanup);

  if (run.status === 'passed' || run.status === 'failed' || run.status === 'error') {
    send('done', { exitCode: run.exitCode, summary: run.summary, status: run.status });
    cleanup();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GCCS test dashboard running: http://0.0.0.0:${PORT}`);
});
