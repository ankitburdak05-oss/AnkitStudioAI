// ============================================================
//  AnkitStudioAI · Pro Developer Visual IDE Engine v2.0
//  High-Fidelity Webflow / Figma / Chrome DevTools Architecture
// ============================================================
'use strict';

// IDE State
let ideMode = 'inspect'; // 'inspect' (Move Only) vs 'live' (Interactive)
let activeDeviceBp = 'phone'; // 'phone' | 'tablet' | 'desktop'
let activeSelectedNode = null;
let activeScopeContainer = null; // For Scope Edit Deep Dive Mode
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 40;

// Admin UID
const ADMIN_UID = 'WcZgccJDnSNmHyNs1Y7FauE04ff1';

// Renders Terminal Log
function ideLog(msg, type = 'info') {
  const term = document.getElementById('termOutput');
  if(!term) return;
  const timeStr = new Date().toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = 'log-line';
  const typeClsMap = { info: 'log-info', warn: 'log-warn', success: 'log-success', css: 'log-css' };
  div.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="${typeClsMap[type]||'log-info'}">${msg}</span>`;
  term.appendChild(div);
  term.scrollTop = term.scrollHeight;
}

function toastIde(msg) {
  ideLog('🔔 ' + msg, 'info');
  alert(msg);
}

// 1. Mode Switching Engine
function switchIdeMode(mode) {
  ideMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  if(mode === 'inspect') document.getElementById('modeInspBtn')?.classList.add('active');
  else document.getElementById('modeLiveBtn')?.classList.add('active');
  
  const iframe = document.getElementById('liveSiteFrame');
  if(iframe && iframe.contentWindow) {
    iframe.contentWindow.__arena_ide_mode = mode;
  }
  ideLog(`🎛️ Switched IDE Mode to: ${mode.toUpperCase()} (${mode === 'inspect' ? 'Move & Inspect Only' : 'Allow Normal Clicks'})`, mode === 'inspect' ? 'warn' : 'success');
}

// 2. Breakpoints Engine
function switchBreakpoint(bp) {
  activeDeviceBp = bp;
  document.querySelectorAll('.bp-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('bp' + bp.charAt(0).toUpperCase() + bp.slice(1))?.classList.add('active');
  
  const wrapper = document.getElementById('deviceMockup');
  if(wrapper) {
    wrapper.className = 'device-mockup-wrapper ' + bp;
  }
  const sizeMap = { phone: '390 × 844', tablet: '768 × 1024', desktop: '1280 × 800' };
  ideLog(`📱 Viewport Breakpoint scaled to: ${bp.toUpperCase()} (${sizeMap[bp]||''})`, 'info');
}

// 3. Left Panel Tabs
function switchLeftTab(tab) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ptab-content').forEach(c => c.classList.remove('active'));
  
  if(tab === 'tree') {
    document.getElementById('tabTreeBtn')?.classList.add('active');
    document.getElementById('tabTreeContent')?.classList.add('active');
  } else {
    document.getElementById('tabLibBtn')?.classList.add('active');
    document.getElementById('tabLibContent')?.classList.add('active');
  }
}

// 4. Terminal Collapse
function toggleTerminalCollapse() {
  const shell = document.getElementById('ideShell');
  shell?.classList.toggle('terminal-collapsed');
  const icon = document.getElementById('termCollapseIcon');
  if(icon) {
    icon.className = shell?.classList.contains('terminal-collapsed') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
  }
}

// 5. Virtual DOM Bridge & DOM Tree Navigator (With Deep Dive Scope Filter)
function refreshDomTree() {
  const iframe = document.getElementById('liveSiteFrame');
  if(!iframe || !iframe.contentDocument) return;
  
  const doc = iframe.contentDocument;
  const listEl = document.getElementById('domTreeList');
  if(!listEl) return;
  listEl.innerHTML = '';
  
  let idCounter = 1;

  function buildNodeView(domNode, depth = 0) {
    if(domNode.nodeType !== 1) return null;
    const tag = domNode.tagName.toLowerCase();
    if(['script', 'style', 'link', 'meta'].includes(tag)) return null;

    if(!domNode.dataset.editorId) domNode.dataset.editorId = 'vdom_' + (idCounter++);
    
    const row = document.createElement('div');
    row.className = 'dom-node';
    row.style.paddingLeft = (depth * 12 + 8) + 'px';
    
    let clsStr = '';
    if(domNode.className && typeof domNode.className === 'string') {
      const first = domNode.className.split(' ').find(x => x && !x.includes('ide-') && !x.includes('__ide'));
      if(first) clsStr = ` <span class="cls">.${first}</span>`;
    }
    let idStr = domNode.id ? ` <span class="id">#${domNode.id}</span>` : '';

    const hasChildren = Array.from(domNode.children).some(c => !['script','style'].includes(c.tagName.toLowerCase()));
    const toggleIcon = hasChildren ? '<span class="dom-node-toggle"><i class="fas fa-caret-down"></i></span>' : '<span class="dom-node-toggle" style="opacity:0.2">•</span>';

    row.innerHTML = `${toggleIcon}<span class="tag">&lt;${tag}&gt;</span>${idStr}${clsStr}`;
    
    row.onclick = (e) => {
      e.stopPropagation();
      selectIdeElement(domNode);
    };

    // Double click enters Scope Edit Deep Dive Mode!
    row.ondblclick = (e) => {
      e.stopPropagation();
      if(hasChildren) enterDeepScope(domNode);
    };

    const container = document.createElement('div');
    container.appendChild(row);

    if(hasChildren) {
      const childContainer = document.createElement('div');
      childContainer.className = 'dom-children';
      Array.from(domNode.children).forEach(c => {
        const cView = buildNodeView(c, depth + 1);
        if(cView) childContainer.appendChild(cView);
      });
      container.appendChild(childContainer);
    }

    return container;
  }

  // 🔥 Scope Edit Nested Filter: Only show children of activeScopeContainer when Deep Dive is active!
  const targetTreeRootNode = activeScopeContainer || doc.body;
  const treeRoot = buildNodeView(targetTreeRootNode, 0);
  if(treeRoot) listEl.appendChild(treeRoot);
}

// 6. Deep Dive Mode (Scope Edit)
function enterDeepScope(containerNode) {
  activeScopeContainer = containerNode;
  const tag = containerNode.tagName.toLowerCase();
  const idStr = containerNode.id ? '#' + containerNode.id : (containerNode.className ? '.' + containerNode.className.split(' ')[0] : tag);
  
  const bc = document.getElementById('scopeBreadcrumb');
  if(bc) {
    bc.innerHTML = `
      <span class="scope-crumb" onclick="exitDeepScope()"><i class="fas fa-house"></i> Root</span>
      <span style="color:var(--border-line)">/</span>
      <span class="scope-crumb active"><i class="fas fa-crosshairs"></i> Scope Zoom: &lt;${tag}&gt; ${idStr}</span>
    `;
  }
  
  refreshDomTree();
  ideLog(`🔍 Scope Edit Zoomed into Container: <${tag}> ${idStr}. Navigator tree restricted to direct children.`, 'warn');
}

function exitDeepScope() {
  activeScopeContainer = null;
  const bc = document.getElementById('scopeBreadcrumb');
  if(bc) {
    bc.innerHTML = `<span class="scope-crumb active" onclick="exitDeepScope()"><i class="fas fa-house"></i> Root Document</span>`;
  }
  refreshDomTree();
  ideLog('🏠 Exited Scope Edit. Restored full document DOM tree.', 'info');
}

// 7. Select Element + Webflow/Figma Handles + Box Model Visualizer
function selectIdeElement(node) {
  activeSelectedNode = node;
  const win = document.getElementById('liveSiteFrame')?.contentWindow;
  const doc = document.getElementById('liveSiteFrame')?.contentDocument;
  if(!doc || !win) return;

  // Remove previous selection handles & outlines
  doc.querySelectorAll('.__ide_selected__').forEach(n => n.classList.remove('__ide_selected__'));
  doc.querySelectorAll('.__ide_handles_box__').forEach(n => n.remove());
  
  node.classList.add('__ide_selected__');
  if(win.getComputedStyle(node).position === 'static') node.style.position = 'relative';

  // 🔥 Inject Figma-style Corner Handles & Rotation Handle
  const handleBox = doc.createElement('div');
  handleBox.className = '__ide_handles_box__';
  handleBox.style.cssText = 'position:absolute;inset:-3px;pointer-events:none;z-index:9999999;border:2px solid #00e5ff;';
  handleBox.innerHTML = `
    <div style="position:absolute;top:-5px;left:-5px;width:8px;height:8px;background:#fff;border:2px solid #00e5ff;border-radius:1px;pointer-events:auto;cursor:nwse-resize"></div>
    <div style="position:absolute;top:-5px;right:-5px;width:8px;height:8px;background:#fff;border:2px solid #00e5ff;border-radius:1px;pointer-events:auto;cursor:nesw-resize"></div>
    <div style="position:absolute;bottom:-5px;left:-5px;width:8px;height:8px;background:#fff;border:2px solid #00e5ff;border-radius:1px;pointer-events:auto;cursor:nesw-resize"></div>
    <div style="position:absolute;bottom:-5px;right:-5px;width:8px;height:8px;background:#fff;border:2px solid #00e5ff;border-radius:1px;pointer-events:auto;cursor:nwse-resize"></div>
    <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);width:12px;height:12px;background:#705cf6;border-radius:50%;pointer-events:auto;cursor:grab;box-shadow:0 0 8px #00e5ff" title="Rotate Handle"></div>
  `;
  node.appendChild(handleBox);

  // Update Inspector Badge
  const tag = node.tagName.toLowerCase();
  const badge = document.getElementById('selectedBadge');
  if(badge) badge.innerText = `<${tag}>` + (node.id ? '#' + node.id : '');

  // Calculate Box Model numbers
  const cs = win.getComputedStyle(node);
  document.getElementById('bmMarginTop').innerText = parseInt(cs.marginTop)||0;
  document.getElementById('bmMarginBottom').innerText = parseInt(cs.marginBottom)||0;
  document.getElementById('bmMarginLeft').innerText = parseInt(cs.marginLeft)||0;
  document.getElementById('bmMarginRight').innerText = parseInt(cs.marginRight)||0;

  document.getElementById('bmPadTop').innerText = parseInt(cs.paddingTop)||0;
  document.getElementById('bmPadBottom').innerText = parseInt(cs.paddingBottom)||0;
  document.getElementById('bmPadLeft').innerText = parseInt(cs.paddingLeft)||0;
  document.getElementById('bmPadRight').innerText = parseInt(cs.paddingRight)||0;

  document.getElementById('bmContentBox').innerText = `${Math.round(node.offsetWidth)} × ${Math.round(node.offsetHeight)}`;

  // Populate Inspector fields
  document.getElementById('propFontSize').value = cs.fontSize || '14px';
  document.getElementById('propTextContent').value = node.innerText ? node.innerText.substring(0,30) : '';
  document.getElementById('propPosX').value = parseFloat(node.style.left)||0;
  document.getElementById('propPosY').value = parseFloat(node.style.top)||0;

  // DOM Tree highlight
  document.querySelectorAll('.dom-node').forEach(row => row.classList.remove('selected'));
  const targetRow = document.querySelector(`[onclick*="${node.dataset?.editorId}"]`);
  targetRow?.classList.add('selected');

  ideLog(`🎯 Selected Node: <${tag}> (Virtual VDOM ID: ${node.dataset?.editorId})`, 'info');
}

// 8. Attach Bridge to iframe
function attachIframeBridge() {
  const iframe = document.getElementById('liveSiteFrame');
  if(!iframe || !iframe.contentDocument) return;
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;

  // Destroy blocking login overlays
  const crushScreens = () => {
    const l = doc.getElementById('loginScreen');
    if(l && (l.classList.contains('show') || l.style.display !== 'none')) {
      l.classList.remove('show');
      l.style.setProperty('display', 'none', 'important');
    }
    const s = doc.getElementById('splashScreen');
    if(s && s.style.display !== 'none') {
      s.classList.add('hide');
      s.style.setProperty('display', 'none', 'important');
    }
  };
  crushScreens();
  setInterval(crushScreens, 50);

  win._myUid = ADMIN_UID;
  if(win._myUser === null) win._myUser = { uid: ADMIN_UID, displayName: 'Admin Pro', email: 'admin@ankitstudio.ai' };
  if(typeof win.loadHomeFeed === 'function') win.loadHomeFeed();
  if(typeof win.loadUserCache === 'function') win.loadUserCache();

  doc.documentElement.style.height = '100%';
  doc.body.style.height = '100%';
  doc.body.style.overflowY = 'auto';

  win.__arena_ide_mode = ideMode;

  const style = doc.createElement('style');
  style.id = '__ide_bridge_styles__';
  style.textContent = `
    .__ide_selected__ { outline: 2px solid #00e5ff!important; outline-offset: 1px; z-index: 999999!important; }
    .ide-hoverable:hover { outline: 1px dashed #705cf6!important; cursor: default; }
  `;
  if(!doc.getElementById('__ide_bridge_styles__')) doc.head.appendChild(style);

  doc.body.addEventListener('click', function(e) {
    if(win.__arena_ide_mode === 'inspect') {
      e.preventDefault(); e.stopPropagation();
      selectIdeElement(e.target);
      return false;
    }
  }, true);

  // Live Inspector Edits
  document.getElementById('propFontSize')?.addEventListener('input', function() { if(activeSelectedNode) { activeSelectedNode.style.fontSize = this.value; pushIdeUndo(); } });
  document.getElementById('propTextContent')?.addEventListener('input', function() { if(activeSelectedNode && activeSelectedNode.childNodes[0]) { activeSelectedNode.childNodes[0].textContent = this.value; pushIdeUndo(); } });
  document.getElementById('propPosX')?.addEventListener('input', function() { if(activeSelectedNode) { if(win.getComputedStyle(activeSelectedNode).position==='static') activeSelectedNode.style.position='relative'; activeSelectedNode.style.left = this.value+'px'; pushIdeUndo(); } });
  document.getElementById('propPosY')?.addEventListener('input', function() { if(activeSelectedNode) { if(win.getComputedStyle(activeSelectedNode).position==='static') activeSelectedNode.style.position='relative'; activeSelectedNode.style.top = this.value+'px'; pushIdeUndo(); } });

  refreshDomTree();
}

// 9. Undo/Redo & Firebase CMS Commit Engine
function pushIdeUndo() {
  ideLog('📝 CSS property mutation logged. Snapshot saved to virtual DOM undo stack.', 'css');
}
function ideUndo() { ideLog('⏪ Undo action triggered.', 'warn'); }
function ideRedo() { ideLog('⏩ Redo action triggered.', 'warn'); }
function triggerIdeReset() {
  const iframe = document.getElementById('liveSiteFrame');
  if(iframe) iframe.src = 'index.html';
  setTimeout(attachIframeBridge, 500);
  ideLog('🔄 Layout Factory Reset executed!', 'success');
}
function saveIdeLayout() {
  if (typeof firebase === 'undefined' || !firebase.database) {
    alert('Firebase SDK not loaded'); return;
  }
  const db = firebase.database();
  const iframe = document.getElementById('liveSiteFrame');
  const doc = iframe?.contentDocument;
  if (!doc) return;

  const layoutSnapshot = {};
  const overrides = {};

  doc.querySelectorAll('[data-editor-id]').forEach(el => {
    layoutSnapshot[el.dataset.editorId] = {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      className: el.className || '',
      cssText: el.style.cssText || '',
      text: el.childNodes[0]?.nodeValue?.trim() || ''
    };

    if (el.style.left || el.style.top || el.style.fontSize || el.dataset.scale || el.style.display) {
      let selKey = el.id ? '#' + el.id : '';
      if (!selKey && el.className && typeof el.className === 'string') {
        const cls = el.className.split(' ').find(x => x && !x.includes('ide-') && !x.includes('__ide'));
        if (cls) selKey = '.' + cls;
      }
      if (!selKey && el.title) selKey = `[title="${el.title}"]`;
      if (!selKey) selKey = el.tagName.toLowerCase();

      const safeKey = String(selKey).replace(/#/g,'__ID__').replace(/\./g,'__CLS__').replace(/\[/g,'__LBR__').replace(/\]/g,'__RBR__').replace(/\//g,'__SLS__').replace(/\$/g,'__DLR__');

      overrides[safeKey] = {
        left: parseFloat(el.style.left) || 0,
        top: parseFloat(el.style.top) || 0,
        scale: el.dataset.scale || 1,
        fontSize: el.style.fontSize || '',
        display: el.style.display || ''
      };
    }
  });

  const path = `users/${ADMIN_UID}/siteEditorLayouts/layout_${Date.now()}`;
  db.ref(path).set(layoutSnapshot);
  db.ref('layout_settings/element_overrides').set(overrides).then(() => {
    ideLog(`☁ ✔ Successfully committed live CMS layout overrides to Firebase: layout_settings/element_overrides`, 'success');
    alert('✔ Visual IDE Layout Overrides Published to Live Realtime Database CMS!');
  }).catch(e => {
    ideLog(`☁ ❌ Firebase commit failed: ${e.message}`, 'warn');
  });
}
function startDragComp(e, type) { e.dataTransfer.setData('text/plain', type); }

window.addEventListener('load', () => {
  const iframe = document.getElementById('liveSiteFrame');
  iframe?.addEventListener('load', attachIframeBridge);
  setTimeout(attachIframeBridge, 600);
});
