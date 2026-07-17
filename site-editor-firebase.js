'use strict';

firebase.auth().onAuthStateChanged(function(user) {
  const gate = document.getElementById('loginGate');
  const root = document.getElementById('appRoot');
  db = firebase.database();

  if (user) {
    myUid = user.uid;
    if (gate) gate.classList.add('hide');
    if (root) root.style.display = 'grid';
    siteEditorLog('success', 'Firebase auth success. IDE unlocked for ' + user.uid);
  } else {
    myUid = null;
    if (gate) gate.classList.remove('hide');
    if (root) root.style.display = 'none';
    siteEditorLog('warn', 'Auth required. Login gate visible.');
  }
});

function openSaveNameModal() {
  if (!myUid) { toastOrLog('Pehle login karo', 'error'); return; }
  document.getElementById('saveNameInput').value = currentLayoutName || '';
  document.getElementById('saveNameModal').classList.add('open');
  setTimeout(() => document.getElementById('saveNameInput').focus(), 50);
}
function closeSaveNameModal() { document.getElementById('saveNameModal').classList.remove('open'); }
window.closeSaveNameModal = closeSaveNameModal;
window.openSaveNameModal = openSaveNameModal;

function toastOrLog(msg, kind){
  if (typeof window.siteEditorLog === 'function') window.siteEditorLog(kind || 'info', msg);
}

document.getElementById('saveBtn').addEventListener('click', openSaveNameModal);
document.getElementById('confirmSaveBtn').addEventListener('click', () => {
  const name = document.getElementById('saveNameInput').value.trim();
  if (!name) { toastOrLog('Naam daalo layout ke liye', 'error'); return; }
  currentLayoutName = name;
  saveLayoutToFirebase(false);
});
document.getElementById('saveNameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('confirmSaveBtn').click();
});

function saveLayoutToFirebase(isAutoSave) {
  if (!myUid || !db) { toastOrLog('Login required', 'error'); return Promise.resolve(); }

  const btn = document.getElementById('confirmSaveBtn');
  if (btn && !isAutoSave) { btn.disabled = true; btn.textContent = 'Saving...'; }

  const payload = Object.assign({
    name: currentLayoutName,
    updatedAt: firebase.database.ServerValue.TIMESTAMP,
    autosaved: !!isAutoSave,
    ideVersion: 'pro-visual-ide-v1'
  }, (typeof window.collectEditorPayload === 'function' ? window.collectEditorPayload() : { elements: [] }));

  const ref = currentLayoutId
    ? db.ref(`users/${myUid}/siteEditorLayouts/${currentLayoutId}`)
    : db.ref(`users/${myUid}/siteEditorLayouts`).push();

  if (!currentLayoutId) payload.createdAt = firebase.database.ServerValue.TIMESTAMP;

  return ref.update(payload).then(() => {
    currentLayoutId = ref.key;
    if (btn && !isAutoSave) { btn.disabled = false; btn.textContent = 'Save'; }
    if (!isAutoSave) closeSaveNameModal();
    markClean();
    toastOrLog((isAutoSave ? 'Auto-save sync' : 'Manual save') + ' success: ' + currentLayoutName, 'success');
  }).catch((err) => {
    if (btn && !isAutoSave) { btn.disabled = false; btn.textContent = 'Save'; }
    toastOrLog('Save fail ho gaya: ' + err.message, 'error');
  });
}
window.saveLayoutToFirebase = saveLayoutToFirebase;

document.getElementById('openLayoutBtn').addEventListener('click', openLayoutsModal);
function openLayoutsModal() {
  if (!myUid) { toastOrLog('Pehle login karo', 'error'); return; }
  document.getElementById('layoutsModal').classList.add('open');
  loadLayoutsList();
}
function closeLayoutsModal() { document.getElementById('layoutsModal').classList.remove('open'); }
window.closeLayoutsModal = closeLayoutsModal;

function loadLayoutsList() {
  const body = document.getElementById('layoutsListBody');
  body.innerHTML = `<div style="text-align:center;color:var(--text-3);padding:30px 0"><i class="fas fa-circle-notch fa-spin"></i><br><br>Loading...</div>`;

  db.ref(`users/${myUid}/siteEditorLayouts`).once('value').then((snap) => {
    if (!snap.exists()) {
      body.innerHTML = `<div style="text-align:center;color:var(--text-3);padding:30px 10px"><i class="fas fa-folder-open" style="font-size:24px;opacity:.4;display:block;margin-bottom:10px"></i>Koi saved layout nahi hai abhi.<br>Pehle ek design banao aur Save karo.</div>`;
      return;
    }

    const layouts = [];
    snap.forEach((child) => layouts.push({ id: child.key, ...child.val() }));
    layouts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    body.innerHTML = layouts.map(l => `
      <div class="layout-list-item" data-layout-id="${l.id}">
        <div>
          <div style="font-weight:800;font-size:12.5px">${esc(l.name || 'Untitled')}</div>
          <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${(l.elements||[]).length || l.elementCount || 0} mappings · ${l.updatedAt ? new Date(l.updatedAt).toLocaleString() : 'recently'} · ${l.autosaved ? 'auto-save' : 'manual'}</div>
        </div>
        <i class="fas fa-trash" data-del-id="${l.id}" style="color:var(--danger);font-size:13px;padding:4px 6px;cursor:pointer;opacity:.7"></i>
      </div>
    `).join('');

    body.querySelectorAll('.layout-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.dataset.delId) return;
        const hit = layouts.find(l => l.id === item.dataset.layoutId);
        loadLayoutById(item.dataset.layoutId, hit);
      });
    });

    body.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('Ye layout delete karna hai?')) return;
        db.ref(`users/${myUid}/siteEditorLayouts/${btn.dataset.delId}`).remove().then(() => {
          toastOrLog('Layout delete ho gaya', 'success');
          loadLayoutsList();
        });
      });
    });
  }).catch((err) => {
    body.innerHTML = `<div style="text-align:center;color:var(--danger);padding:30px 10px">Error: ${esc(err.message)}</div>`;
    toastOrLog('Load layouts error: ' + err.message, 'error');
  });
}

function loadLayoutById(id, data) {
  if (!data) return;
  if (isDirty && !confirm('Unsaved changes hain. Current changes lost ho jayenge. Load karna hai?')) return;

  currentLayoutId = id;
  currentLayoutName = data.name || 'Untitled Layout';
  undoStack = []; redoStack = [];
  updateHistoryButtons();

  if (typeof window.applyLoadedEditorState === 'function') {
    window.applyLoadedEditorState(data);
  }

  markClean();
  closeLayoutsModal();
  toastOrLog('Layout load ho gaya: ' + currentLayoutName, 'success');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

window.addEventListener('beforeunload', (e) => {
  if (isDirty) { e.preventDefault(); e.returnValue = ''; }
});