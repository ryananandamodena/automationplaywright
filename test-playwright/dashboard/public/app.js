const projectSelect = document.getElementById('project-select');
const specList = document.getElementById('spec-list');
const runBtn = document.getElementById('run-btn');
const queueNote = document.getElementById('queue-note');
const statusBadge = document.getElementById('status-badge');
const logOutput = document.getElementById('log-output');
const reportLink = document.getElementById('report-link');
const historyBody = document.querySelector('#history-table tbody');

let currentEventSource = null;

async function loadProjects() {
  const projects = await fetch('/api/projects').then((r) => r.json());
  projectSelect.innerHTML = projects.map((p) => `<option value="${p.id}">${p.label}</option>`).join('');
  await loadSpecs();
}

async function loadSpecs() {
  const projectId = projectSelect.value;
  const { specs } = await fetch(`/api/projects/${projectId}/tests`).then((r) => r.json());
  specList.innerHTML = specs
    .map((s) => `<label><input type="checkbox" value="${s}" /> ${s}</label>`)
    .join('') || '<em>Tidak ada file test ditemukan.</em>';
}

function setStatus(status) {
  statusBadge.textContent = status;
  statusBadge.className = `badge ${status}`;
}

function formatTime(ts) {
  return ts ? new Date(ts).toLocaleTimeString('id-ID') : '-';
}

async function loadHistory() {
  const runs = await fetch('/api/runs').then((r) => r.json());
  historyBody.innerHTML = runs
    .map((r) => {
      const summary = r.summary
        ? `${r.summary.passed} passed, ${r.summary.failed} failed${r.summary.skipped ? `, ${r.summary.skipped} skipped` : ''}`
        : '-';
      const reportUrl = `/reports/${r.projectId}/index.html`;
      return `<tr>
        <td>${formatTime(r.createdAt)}</td>
        <td>${r.projectId}</td>
        <td>${r.specs.length ? r.specs.join(', ') : 'all'}</td>
        <td>${r.status}</td>
        <td>${summary}</td>
        <td><a href="${reportUrl}" target="_blank" rel="noopener">Report</a></td>
      </tr>`;
    })
    .join('');
}

function watchRun(runId) {
  if (currentEventSource) currentEventSource.close();
  logOutput.textContent = '';
  reportLink.classList.add('hidden');
  currentEventSource = new EventSource(`/api/runs/${runId}/stream`);

  currentEventSource.addEventListener('status', (e) => {
    setStatus(JSON.parse(e.data).status);
  });
  currentEventSource.addEventListener('log', (e) => {
    logOutput.textContent += JSON.parse(e.data).line;
    logOutput.scrollTop = logOutput.scrollHeight;
  });
  currentEventSource.addEventListener('done', (e) => {
    const { status } = JSON.parse(e.data);
    setStatus(status);
    runBtn.disabled = false;
    const projectId = projectSelect.value;
    reportLink.innerHTML = `<a href="/reports/${projectId}/index.html" target="_blank" rel="noopener">📄 Buka Report</a>`;
    reportLink.classList.remove('hidden');
    loadHistory();
    currentEventSource.close();
  });
}

projectSelect.addEventListener('change', loadSpecs);

runBtn.addEventListener('click', async () => {
  const projectId = projectSelect.value;
  const specs = Array.from(specList.querySelectorAll('input:checked')).map((i) => i.value);

  runBtn.disabled = true;
  setStatus('queued');
  queueNote.classList.add('hidden');

  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, specs }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    queueNote.textContent = `Gagal: ${error}`;
    queueNote.classList.remove('hidden');
    runBtn.disabled = false;
    return;
  }

  const { runId } = await res.json();
  watchRun(runId);
  loadHistory();
});

loadProjects();
loadHistory();
setInterval(loadHistory, 5000);
