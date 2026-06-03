const state = {
  printers: [],
  jobs: [],
  pendingJob: null
};

const elements = {
  addPrinterButton: document.querySelector('#addPrinterButton'),
  cancelPrinterButton: document.querySelector('#cancelPrinterButton'),
  clearDoneButton: document.querySelector('#clearDoneButton'),
  closePrinterDialog: document.querySelector('#closePrinterDialog'),
  deletePrinterButton: document.querySelector('#deletePrinterButton'),
  dropZone: document.querySelector('#dropZone'),
  enqueueButton: document.querySelector('#enqueueButton'),
  jobPreview: document.querySelector('#jobPreview'),
  linkForm: document.querySelector('#linkForm'),
  linkInput: document.querySelector('#linkInput'),
  managePrintersButton: document.querySelector('#managePrintersButton'),
  previewDescription: document.querySelector('#previewDescription'),
  previewImage: document.querySelector('#previewImage'),
  previewSource: document.querySelector('#previewSource'),
  previewTitle: document.querySelector('#previewTitle'),
  printerAddress: document.querySelector('#printerAddress'),
  printerBedSize: document.querySelector('#printerBedSize'),
  printerDialog: document.querySelector('#printerDialog'),
  printerDialogTitle: document.querySelector('#printerDialogTitle'),
  printerDrawer: document.querySelector('#printerDrawer'),
  printerForm: document.querySelector('#printerForm'),
  printerId: document.querySelector('#printerId'),
  printerList: document.querySelector('#printerList'),
  printerModel: document.querySelector('#printerModel'),
  printerName: document.querySelector('#printerName'),
  printerNotes: document.querySelector('#printerNotes'),
  queueList: document.querySelector('#queueList'),
  statusMessage: document.querySelector('#statusMessage'),
  targetPrinter: document.querySelector('#targetPrinter')
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.dataset.type = type;
}

async function persist() {
  await window.spoolerApi.saveState({
    printers: state.printers,
    jobs: state.jobs
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function getPrinter(printerId) {
  return state.printers.find((printer) => printer.id === printerId);
}

function renderPrinterOptions() {
  elements.targetPrinter.innerHTML = '';

  for (const printer of state.printers) {
    const option = document.createElement('option');
    option.value = printer.id;
    option.textContent = printer.name;
    elements.targetPrinter.append(option);
  }

  elements.enqueueButton.disabled = state.printers.length === 0 || !state.pendingJob;
}

function renderPrinters() {
  elements.printerList.innerHTML = '';

  if (state.printers.length === 0) {
    elements.printerList.innerHTML = '<p class="empty-state">Noch keine Drucker angelegt. Erstelle zuerst ein Druckerprofil.</p>';
    renderPrinterOptions();
    return;
  }

  for (const printer of state.printers) {
    const card = document.createElement('article');
    card.className = 'printer-card';
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(printer.name)}</h3>
        <p>${escapeHtml(printer.model || 'Kein Modell angegeben')}</p>
        <small>${escapeHtml(printer.address || 'Keine Adresse')} · ${escapeHtml(printer.bedSize || 'Bauraum offen')}</small>
      </div>
      <button class="ghost-button" type="button">Bearbeiten</button>
    `;
    card.querySelector('button').addEventListener('click', () => openPrinterDialog(printer));
    elements.printerList.append(card);
  }

  renderPrinterOptions();
}

function renderQueue() {
  elements.queueList.innerHTML = '';

  if (state.jobs.length === 0) {
    elements.queueList.innerHTML = '<p class="empty-state">Die Warteschlange ist leer. Ziehe einen MakerWorld-Link in das Importfeld.</p>';
    return;
  }

  for (const job of state.jobs) {
    const printer = getPrinter(job.printerId);
    const card = document.createElement('article');
    card.className = `queue-card status-${escapeHtml(job.status)}`;
    card.innerHTML = `
      <img src="${escapeHtml(job.image || '')}" alt="" />
      <div class="queue-content">
        <div class="queue-title-row">
          <h3>${escapeHtml(job.title)}</h3>
          <span>${escapeHtml(job.status)}</span>
        </div>
        <p>${escapeHtml(job.description || 'Keine Beschreibung verfügbar.')}</p>
        <small>Drucker: ${escapeHtml(printer?.name || 'Nicht zugewiesen')} · Erstellt: ${formatDate(job.createdAt)}</small>
        <div class="queue-actions">
          <button data-action="open" type="button" class="ghost-button">Link öffnen</button>
          <button data-action="queued" type="button">Wartend</button>
          <button data-action="printing" type="button">Druckt</button>
          <button data-action="done" type="button">Fertig</button>
          <button data-action="remove" type="button" class="danger-button">Entfernen</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="open"]').addEventListener('click', () => window.spoolerApi.openExternal(job.url));
    card.querySelector('[data-action="queued"]').addEventListener('click', () => updateJob(job.id, { status: 'queued' }));
    card.querySelector('[data-action="printing"]').addEventListener('click', () => updateJob(job.id, { status: 'printing' }));
    card.querySelector('[data-action="done"]').addEventListener('click', () => updateJob(job.id, { status: 'done' }));
    card.querySelector('[data-action="remove"]').addEventListener('click', () => removeJob(job.id));
    elements.queueList.append(card);
  }
}

function renderPendingJob() {
  if (!state.pendingJob) {
    elements.jobPreview.classList.add('hidden');
    renderPrinterOptions();
    return;
  }

  elements.previewImage.src = state.pendingJob.image || '';
  elements.previewImage.classList.toggle('hidden', !state.pendingJob.image);
  elements.previewSource.textContent = state.pendingJob.source;
  elements.previewTitle.textContent = state.pendingJob.title;
  elements.previewDescription.textContent = state.pendingJob.description || 'Keine Beschreibung gefunden.';
  elements.jobPreview.classList.remove('hidden');
  renderPrinterOptions();
}

function render() {
  renderPrinters();
  renderQueue();
  renderPendingJob();
}

async function loadMakerWorldLink(url) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    setStatus('Bitte einen MakerWorld-Link einfügen.', 'error');
    return;
  }

  setStatus('Lade MakerWorld-Informationen ...');
  elements.dropZone.classList.add('is-loading');

  try {
    state.pendingJob = await window.spoolerApi.fetchMakerWorld(trimmedUrl);
    elements.linkInput.value = trimmedUrl;
    setStatus('Informationen geladen. Wähle einen Drucker und füge den Auftrag hinzu.', 'success');
    renderPendingJob();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.dropZone.classList.remove('is-loading');
  }
}

async function enqueuePendingJob() {
  if (!state.pendingJob || state.printers.length === 0) {
    setStatus('Es muss ein Auftrag geladen und mindestens ein Drucker angelegt sein.', 'error');
    return;
  }

  state.jobs.unshift({
    ...state.pendingJob,
    id: createId('job'),
    printerId: elements.targetPrinter.value,
    status: 'queued',
    createdAt: new Date().toISOString()
  });
  state.pendingJob = null;
  elements.linkInput.value = '';
  await persist();
  setStatus('Druckauftrag wurde in die Warteschlange gelegt.', 'success');
  render();
}

async function updateJob(jobId, patch) {
  state.jobs = state.jobs.map((job) => (job.id === jobId ? { ...job, ...patch } : job));
  await persist();
  renderQueue();
}

async function removeJob(jobId) {
  state.jobs = state.jobs.filter((job) => job.id !== jobId);
  await persist();
  renderQueue();
}

function openPrinterDialog(printer = null) {
  elements.printerDialogTitle.textContent = printer ? 'Drucker bearbeiten' : 'Drucker hinzufügen';
  elements.printerId.value = printer?.id || '';
  elements.printerName.value = printer?.name || '';
  elements.printerModel.value = printer?.model || '';
  elements.printerAddress.value = printer?.address || '';
  elements.printerBedSize.value = printer?.bedSize || '';
  elements.printerNotes.value = printer?.notes || '';
  elements.deletePrinterButton.classList.toggle('hidden', !printer);
  elements.printerDialog.showModal();
}

async function savePrinterFromForm(event) {
  event.preventDefault();

  const printer = {
    id: elements.printerId.value || createId('printer'),
    name: elements.printerName.value.trim(),
    model: elements.printerModel.value.trim(),
    address: elements.printerAddress.value.trim(),
    bedSize: elements.printerBedSize.value.trim(),
    notes: elements.printerNotes.value.trim()
  };

  if (!printer.name) {
    return;
  }

  const existingIndex = state.printers.findIndex((item) => item.id === printer.id);
  if (existingIndex >= 0) {
    state.printers[existingIndex] = printer;
  } else {
    state.printers.push(printer);
  }

  await persist();
  elements.printerDialog.close();
  render();
}

async function deleteCurrentPrinter() {
  const printerId = elements.printerId.value;
  state.printers = state.printers.filter((printer) => printer.id !== printerId);
  state.jobs = state.jobs.map((job) => (job.printerId === printerId ? { ...job, printerId: '' } : job));
  await persist();
  elements.printerDialog.close();
  render();
}

function bindEvents() {
  elements.linkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadMakerWorldLink(elements.linkInput.value);
  });

  elements.dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    elements.dropZone.classList.add('is-dragging');
  });

  elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('is-dragging'));

  elements.dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove('is-dragging');
    const url = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
    loadMakerWorldLink(url);
  });

  elements.enqueueButton.addEventListener('click', enqueuePendingJob);
  elements.managePrintersButton.addEventListener('click', () => elements.printerDrawer.classList.toggle('is-open'));
  elements.addPrinterButton.addEventListener('click', () => openPrinterDialog());
  elements.closePrinterDialog.addEventListener('click', () => elements.printerDialog.close());
  elements.cancelPrinterButton.addEventListener('click', () => elements.printerDialog.close());
  elements.deletePrinterButton.addEventListener('click', deleteCurrentPrinter);
  elements.printerForm.addEventListener('submit', savePrinterFromForm);
  elements.clearDoneButton.addEventListener('click', async () => {
    state.jobs = state.jobs.filter((job) => job.status !== 'done');
    await persist();
    renderQueue();
  });
}

async function boot() {
  const loaded = await window.spoolerApi.loadState();
  state.printers = loaded.printers;
  state.jobs = loaded.jobs;
  bindEvents();
  render();
}

boot();
