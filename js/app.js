/* 小灵感说 — 界面与交互 */
'use strict';

const LS = { user: 'xlg_user', repo: 'xlg_repo', token: 'xlg_token' };
const CATS = ['世界观', '人物', '地点', '势力', '情节', '物品', '其他'];
const GRAPH_TYPES = ['人物关系', '势力分布', '大纲脉络', '其他'];
const NODE_COLORS = [
  { name: '紫', hex: '#6c5ce7' },
  { name: '粉', hex: '#e84393' },
  { name: '绿', hex: '#00b894' },
  { name: '橙', hex: '#e17055' },
  { name: '蓝', hex: '#0984e3' },
  { name: '黄', hex: '#f39c12' },
  { name: '灰', hex: '#636e72' }
];
function colorHex(name) {
  const c = NODE_COLORS.find(x => x.name === name);
  return c ? c.hex : NODE_COLORS[0].hex;
}
const TABS = [
  { id: 'inspiration', name: '灵感' },
  { id: 'graph', name: '图谱' },
  { id: 'write', name: '开始写' },
  { id: 'photo', name: '照片墙' },
  { id: 'more', name: '更多' }
];

const state = {
  tab: 'inspiration',
  novelId: null, chapterId: null,   // 开始写：小说 → 章节
  inspCat: null, inspId: null,      // 灵感：分类 → 条目详情
  fragId: null,                     // 片段（位于开始写模块内）：详情
  wordId: null,                     // 短词（位于开始写模块内）：详情
  graphId: null,                    // 图谱：当前编辑的图谱
  gLinkMode: false, gLinkFrom: null,// 图谱：连线模式与连线起点
  photoPage: 1,                     // 照片墙：当前页码
  dirty: false
};

const $app = document.getElementById('app');
const $modalRoot = document.getElementById('modal-root');
const $toast = document.getElementById('toast');

/* ---------- 图标 ---------- */
const svg = (p, size) => '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
const IC = {
  inspiration: svg('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/>'),
  fragment: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'),
  write: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  more: svg('<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>'),
  graph: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
  photo: svg('<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15.5l-4.5-4.5L6 21.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  chev: svg('<path d="M9 18l6-6-6-6"/>', 18),
  edit: svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>', 14),
  trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', 14),
  catIcons: [
    svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', 18),
    svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', 18),
    svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>', 18),
    svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>', 18),
    svg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', 18),
    svg('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>', 18),
    svg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><circle cx="7" cy="7" r="1.5"/>', 18)
  ]
};

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
let toastTimer = null;
function toast(msg, isErr) {
  $toast.textContent = msg;
  $toast.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $toast.className = ''; }, 2400);
}
async function guard(fn) {
  try { await fn(); return true; }
  catch (e) { console.error(e); toast('同步失败：' + e.message, true); return false; }
}
function emptyBox(title, sub) {
  return '<div class="empty"><div class="empty-icon">✍️</div><h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p></div>';
}
/** 返回按钮（带文字，更醒目） */
function backBtn(act) {
  return '<button class="icon-btn back-btn" data-act="' + act + '">' + IC.back + '<span>返回</span></button>';
}
/** 标记有改动：点亮保存按钮 */
function lightSaveBtn() {
  state.dirty = true;
  const btn = document.querySelector('.save-btn');
  if (btn) { btn.classList.remove('off'); btn.disabled = false; }
  updateCrumb();
}
/** 给详情页输入框绑定「未保存」标记：有改动时点亮保存按钮 */
function bindDirty(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', lightSaveBtn);
  });
}

/* ---------- 启动 ---------- */
window.addEventListener('DOMContentLoaded', boot);
async function boot() {
  let u = localStorage.getItem(LS.user), r = localStorage.getItem(LS.repo), t = localStorage.getItem(LS.token);
  /* 旧版本登录的是代码仓库，数据已迁移到私有数据仓库，自动纠正一次 */
  if (r === 'inspirasay') { r = 'inspirasay-data'; localStorage.setItem(LS.repo, r); }
  if (u && r && t) {
    showLoading('正在连接 GitHub…');
    try { await enterApp(u, r, t); return; }
    catch (e) { renderLogin('自动登录失败：' + e.message); return; }
  }
  renderLogin();
}

async function enterApp(user, repo, token) {
  await Store.init(user, repo, token);
  showLoading('正在同步数据…');
  await Store.loadAll();
  if (Store.metaSha === null) {
    throw new Error('仓库「' + repo + '」中未找到应用数据，请登录数据仓库（如 inspirasay-data）');
  }
  Object.assign(state, { tab: 'inspiration', novelId: null, chapterId: null, inspCat: null, inspId: null, fragId: null, wordId: null, graphId: null, gLinkMode: false, gLinkFrom: null, photoPage: 1, dirty: false });
  renderShell();
}

/* ---------- 登录页 ---------- */
function renderLogin(msg) {
  $app.innerHTML =
    '<div class="login-wrap"><div class="login-card">' +
    '<div class="logo">📖</div><h1>小灵感说</h1>' +
    '<p class="sub">记录小说灵感 · 数据加密存放于你的私有仓库</p>' +
    (msg ? '<div class="login-err">' + esc(msg) + '</div>' : '') +
    '<form id="login-form">' +
    '<label><span>GitHub 用户名</span><input name="user" required autocomplete="username" value="' + esc(localStorage.getItem(LS.user) || '') + '"></label>' +
    '<label><span>数据仓库名</span><input name="repo" required placeholder="私有数据仓库，如：inspirasay-data" value="' + esc(localStorage.getItem(LS.repo) || '') + '"></label>' +
    '<label><span>Access Token</span><input name="token" type="password" required placeholder="需授权该数据仓库读写" autocomplete="off"></label>' +
    '<button class="primary-btn" type="submit">登 录</button>' +
    '</form>' +
    '<p class="tip">设定内容存放在你的<b>私有仓库</b>中，任何人无法查看或 fork。Token 仅保存在本机浏览器，不会上传到任何第三方。</p>' +
    '</div></div>';

  document.getElementById('login-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    const user = fd.user.trim(), repo = fd.repo.trim(), token = fd.token.trim();
    showLoading('正在验证仓库…');
    try {
      localStorage.setItem(LS.user, user);
      localStorage.setItem(LS.repo, repo);
      localStorage.setItem(LS.token, token);
      await enterApp(user, repo, token);
    } catch (e) {
      renderLogin('登录失败：' + e.message);
    }
  });
}

function showLoading(text) {
  $app.innerHTML = '<div class="loading"><div class="spinner"></div><p>' + esc(text) + '</p></div>';
}

/* ---------- 主框架 ---------- */
function tabbarHTML() {
  return '<nav class="tabbar">' + TABS.map(t =>
    '<button class="tab' + (state.tab === t.id ? ' active' : '') + '" data-act="tab" data-tab="' + t.id + '">' +
    IC[t.id] + '<span>' + t.name + '</span></button>').join('') + '</nav>';
}

function renderShell() {
  if (state.tab === 'write' && state.chapterId) { renderEditor(); return; }
  if (state.tab === 'write' && state.wordId) { renderWordDetail(); return; }
  if (state.tab === 'write' && state.fragId) { renderFragDetail(); return; }
  if (state.tab === 'inspiration' && state.inspId) { renderInspDetail(); return; }
  if (state.tab === 'graph' && state.graphId) { renderGraphEditor(); return; }

  let headerTitle = '', pageHTML = '', showFAB = false, backAct = null;

  switch (state.tab) {
    case 'inspiration':
      if (state.inspCat) {
        headerTitle = state.inspCat;
        pageHTML = pageInspList(state.inspCat);
        showFAB = true; backAct = 'back-insp';
      } else {
        headerTitle = '灵感';
        pageHTML = pageInspCats();
      }
      break;
    case 'write':
      if (state.novelId) {
        const novel = Store.novelById(state.novelId);
        if (!novel) { state.novelId = null; }
        else { headerTitle = novel.title; pageHTML = pageChapters(novel); showFAB = true; backAct = 'back-novels'; }
      }
      if (!pageHTML) { headerTitle = '开始写'; pageHTML = pageWriteHome(); }
      break;
    case 'graph':
      headerTitle = '图谱'; pageHTML = pageGraphs(); showFAB = true; break;
    case 'photo':
      headerTitle = '照片墙'; pageHTML = pagePhotos(); showFAB = true; break;
    case 'more':
      headerTitle = '更多'; pageHTML = pageMore(); break;
  }

  $app.innerHTML =
    '<div class="shell">' +
    '<header class="topbar">' +
    (backAct ? backBtn(backAct) : '') +
    '<h1>' + esc(headerTitle) + '</h1>' +
    '</header>' +
    '<main class="page">' + pageHTML + '</main>' +
    (showFAB ? '<button class="fab" data-act="fab-add" aria-label="新增">' + IC.plus + '</button>' : '') +
    tabbarHTML() +
    '</div>';

  hydratePhotos();
}

/* ---------- 灵感：分类列表（首页） ---------- */
function pageInspCats() {
  const rows = CATS.map((c, i) => {
    const n = Store.inspirations.filter(x => (x.category || '其他') === c).length;
    return '<div class="row" data-act="open-insp-cat" data-cat="' + esc(c) + '">' +
      '<span class="row-icon ri' + i + '">' + IC.catIcons[i] + '</span>' +
      '<div class="row-info"><b>' + esc(c) + '</b><span>' + n + ' 条记录</span></div>' +
      IC.chev + '</div>';
  }).join('');
  const hint = Store.inspirations.length === 0
    ? '<p class="list-hint">小说是从一条条设定生长出来的。点击右下角 +，从世界观开始搭建你的故事。</p>' : '';
  return '<div class="page-head"><span class="page-sub">选择一个分类，构建你的小说世界</span><span class="count">' + Store.inspirations.length + ' 条</span></div>' +
    '<div class="list">' + rows + '</div>' + hint;
}

/* ---------- 灵感：某分类下的条目列表 ---------- */
function pageInspList(cat) {
  const items = Store.inspirations
    .filter(x => (x.category || '其他') === cat)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const rows = items.map(i =>
    '<div class="row" data-act="open-insp" data-id="' + i.id + '">' +
    '<div class="row-info"><b>' + esc(i.title) + '</b>' +
    '<span>' + esc((i.content || '').replace(/\s+/g, ' ').slice(0, 40) || '（暂无内容，点进去补充）') + '</span></div>' +
    '<button class="row-del" data-act="del-insp" data-id="' + i.id + '">' + IC.trash + '</button>' +
    IC.chev + '</div>').join('');
  return '<div class="page-head"><span class="page-sub">' + items.length + ' 条 · 点击条目查看或编辑</span></div>' +
    (items.length ? '<div class="list">' + rows + '</div>' : emptyBox('这里还没有内容', '点击右下角 +，写下第一条「' + cat + '」'));
}

/** 详情页顶栏的「分类 · 标题」面包屑 */
function updateCrumb() {
  const c = document.getElementById('dt-crumb');
  if (!c) return;
  const catEl = document.getElementById('dt-cat');
  const titleEl = document.getElementById('dt-title');
  const cat = catEl ? catEl.value : (c.dataset.cat || '');
  const title = (titleEl && titleEl.value.trim()) || '未命名';
  c.textContent = (cat ? cat + ' · ' : '') + title;
}

/* ---------- 灵感：条目详情（全屏编辑） ---------- */
function renderInspDetail() {
  const item = Store.inspirations.find(x => x.id === state.inspId);
  if (!item) { state.inspId = null; renderShell(); return; }
  $app.innerHTML =
    '<div class="detail">' +
    '<div class="editor-bar">' +
    backBtn('back-insp') +
    '<span class="crumb" id="dt-crumb" data-cat="' + esc(item.category || '其他') + '"></span>' +
    '<button class="save-btn off" data-act="save-insp" disabled>保存</button>' +
    '</div>' +
    '<div class="detail-body">' +
    '<div class="edit-frame">' +
    '<input id="dt-title" class="frame-title" value="' + esc(item.title) + '" placeholder="标题">' +
    '<textarea id="dt-content" placeholder="写下这条灵感的详细内容…">' + esc(item.content || '') + '</textarea>' +
    '</div>' +
    '<p class="detail-meta">更新于 ' + fmtDate(item.updatedAt) + ' · 保存后自动同步到你的 GitHub 仓库</p>' +
    '</div></div>';
  bindDirty(['dt-title', 'dt-content']);
  updateCrumb();
}

/* ---------- 开始写：首页（小说区 + 片段区） ---------- */
function pageWriteHome() {
  const novelRows = Store.novels.map(n => {
    const chs = n.chapters || [];
    const words = chs.reduce((s, c) => s + (c.content || '').length, 0);
    return '<div class="row" data-act="open-novel" data-id="' + n.id + '">' +
      '<span class="row-icon ri-book">📖</span>' +
      '<div class="row-info"><b>' + esc(n.title) + '</b>' +
      '<span>' + chs.length + ' 章 · ' + words + ' 字 · ' + fmtDate(n.updatedAt) + '</span></div>' +
      IC.chev + '</div>';
  }).join('');
  const fragRows = Store.fragments.slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map(f =>
    '<div class="row" data-act="open-frag" data-id="' + f.id + '">' +
    '<span class="row-icon ri-frag">' + IC.fragment + '</span>' +
    '<div class="row-info"><b>' + esc(f.title) + '</b>' +
    '<span>' + esc((f.content || '').replace(/\s+/g, ' ').slice(0, 40) || '（暂无内容）') + ' · ' + fmtDate(f.updatedAt) + '</span></div>' +
    '<button class="row-del" data-act="del-frag" data-id="' + f.id + '">' + IC.trash + '</button>' +
    IC.chev + '</div>').join('');

  const wordRows = Store.words.slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map(w =>
    '<div class="row" data-act="open-word" data-id="' + w.id + '">' +
    '<span class="row-icon ri-word">✒️</span>' +
    '<div class="row-info"><b>' + esc(w.title) + '</b>' +
    '<span>' + esc((w.content || '').replace(/\s+/g, ' ').slice(0, 40) || '（暂无备注）') + ' · ' + fmtDate(w.updatedAt) + '</span></div>' +
    '<button class="row-del" data-act="del-word" data-id="' + w.id + '">' + IC.trash + '</button>' +
    IC.chev + '</div>').join('');

  return '<div class="section-head"><b>✒️ 短词</b><button class="section-add" data-act="add-word">＋ 新建短词</button></div>' +
    (Store.words.length ? '<div class="list">' + wordRows + '</div>' : '<p class="list-hint">收集好词、妙句、称谓、术语，写作时随手取用。</p>') +
    '<div class="section-head"><b>📝 片段</b><button class="section-add" data-act="add-frag">＋ 新建片段</button></div>' +
    (Store.fragments.length ? '<div class="list">' + fragRows + '</div>' : '<p class="list-hint">随手记下打动你的段落与句子，会出现在这里。</p>') +
    '<div class="section-head"><b>📖 小说</b><button class="section-add" data-act="add-novel">＋ 新建小说</button></div>' +
    (Store.novels.length ? '<div class="list">' + novelRows + '</div>' : '<p class="list-hint">还没有小说，点上方「＋ 新建小说」开始你的故事。</p>');
}

/* ---------- 片段：详情（全屏编辑） ---------- */
function renderFragDetail() {
  const item = Store.fragments.find(x => x.id === state.fragId);
  if (!item) { state.fragId = null; renderShell(); return; }
  $app.innerHTML =
    '<div class="detail">' +
    '<div class="editor-bar">' +
    backBtn('back-frag') +
    '<span class="crumb" id="dt-crumb" data-cat="片段"></span>' +
    '<button class="save-btn off" data-act="save-frag" disabled>保存</button>' +
    '</div>' +
    '<div class="detail-body">' +
    '<div class="edit-frame">' +
    '<input id="dt-title" class="frame-title" value="' + esc(item.title) + '" placeholder="片段标题">' +
    '<textarea id="dt-content" placeholder="粘贴或写下这段文字…">' + esc(item.content || '') + '</textarea>' +
    '</div>' +
    '<p class="detail-meta">更新于 ' + fmtDate(item.updatedAt) + ' · 保存后自动同步到你的 GitHub 仓库</p>' +
    '</div></div>';
  bindDirty(['dt-title', 'dt-content']);
  updateCrumb();
}

/* ---------- 短词：详情（全屏编辑） ---------- */
function renderWordDetail() {
  const item = Store.words.find(x => x.id === state.wordId);
  if (!item) { state.wordId = null; renderShell(); return; }
  $app.innerHTML =
    '<div class="detail">' +
    '<div class="editor-bar">' +
    backBtn('back-words') +
    '<span class="crumb" id="dt-crumb" data-cat="短词"></span>' +
    '<button class="save-btn off" data-act="save-word" disabled>保存</button>' +
    '</div>' +
    '<div class="detail-body">' +
    '<div class="edit-frame">' +
    '<input id="dt-title" class="frame-title" value="' + esc(item.title) + '" placeholder="词语">' +
    '<textarea id="dt-content" placeholder="释义、出处、用法示例…（可留空）">' + esc(item.content || '') + '</textarea>' +
    '</div>' +
    '<p class="detail-meta">更新于 ' + fmtDate(item.updatedAt) + ' · 保存后自动同步到你的 GitHub 仓库</p>' +
    '</div></div>';
  bindDirty(['dt-title', 'dt-content']);
  updateCrumb();
}

/* ---------- 开始写：章节列表 ---------- */
function pageChapters(novel) {
  const chs = novel.chapters || [];
  const rows = chs.map((c, idx) =>
    '<div class="row" data-act="open-chapter" data-id="' + c.id + '">' +
    '<span class="row-index">' + (idx + 1) + '</span>' +
    '<div class="row-info"><b>' + esc(c.title) + '</b>' +
    '<span>' + (c.content || '').length + ' 字 · ' + fmtDate(c.updatedAt) + '</span></div>' +
    '<button class="row-del" data-act="del-chapter" data-id="' + c.id + '">' + IC.trash + '</button>' +
    IC.chev + '</div>').join('');
  return '<div class="page-head"><span class="page-sub">共 ' + chs.length + ' 章 · 点击章节开始写作</span></div>' +
    (chs.length ? '<div class="list">' + rows + '</div>' : emptyBox('还没有章节', '点击右下角 +，创建第一章')) +
    '<div class="book-ops">' +
    '<button data-act="edit-novel" data-id="' + novel.id + '">' + IC.edit + ' 书名/简介</button>' +
    '<button data-act="del-novel">' + IC.trash + ' 删除这本小说</button>' +
    '</div>';
}

/* ---------- 章节/正文编辑器 ---------- */
function renderEditor() {
  const novel = Store.novelById(state.novelId);
  const ch = novel.chapters.find(c => c.id === state.chapterId);
  if (!ch) { state.chapterId = null; renderShell(); return; }

  $app.innerHTML =
    '<div class="editor">' +
    '<div class="editor-bar">' +
    backBtn('back-chapters') +
    '<input id="ch-title" value="' + esc(ch.title) + '" placeholder="章节标题">' +
    '<button class="save-btn off" data-act="save-chapter" disabled>保存</button>' +
    '</div>' +
    '<textarea id="ch-content" placeholder="从这里开始你的故事…">' + esc(ch.content || '') + '</textarea>' +
    '</div>';
  bindDirty(['ch-title', 'ch-content']);
}

/* ---------- 图谱：列表 ---------- */
function pageGraphs() {
  const list = Store.graphs.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const rows = list.map(gr => {
    const ti = Math.max(0, GRAPH_TYPES.indexOf(gr.type));
    const tc = ['#e84393', '#0984e3', '#00b894', '#636e72'][ti];
    return '<div class="row" data-act="open-graph" data-id="' + gr.id + '">' +
      '<span class="row-icon" style="background:' + tc + '">' + IC.graph + '</span>' +
      '<div class="row-info"><b>' + esc(gr.title) + '</b>' +
      '<span>' + esc(gr.type) + ' · ' + (gr.nodes || []).length + ' 个节点 · ' + fmtDate(gr.updatedAt) + '</span></div>' +
      '<button class="row-del" data-act="del-graph-id" data-id="' + gr.id + '">' + IC.trash + '</button>' +
      IC.chev + '</div>';
  }).join('');
  const hint = list.length === 0
    ? '<p class="list-hint">创建人物关系网、势力分布图，把设定连成一张网。</p>' : '';
  return '<div class="page-head"><span class="page-sub">把人物、势力、情节连成看得见的网</span><span class="count">' + list.length + ' 张</span></div>' +
    (list.length ? '<div class="list">' + rows + '</div>' : emptyBox('还没有图谱', '点击右下角 +，创建第一张关系网')) + hint;
}

/* ---------- 图谱：编辑器 ---------- */
function renderGraphEditor() {
  const g = Store.graphById(state.graphId);
  if (!g) { state.graphId = null; renderShell(); return; }
  $app.innerHTML =
    '<div class="geditor">' +
    '<div class="editor-bar">' +
    backBtn('back-graphs') +
    '<b class="g-title" data-act="g-open-settings">' + esc(g.title) + '</b>' +
    '<button class="save-btn off" data-act="save-graph" disabled>保存</button>' +
    '</div>' +
    '<div class="graph-tools">' +
    '<button class="g-tool" data-act="g-add-node">＋ 节点</button>' +
    '<button class="g-tool' + (state.gLinkMode ? ' on' : '') + '" data-act="g-link-toggle">' + (state.gLinkMode ? '连线中…轻触退出' : '🔗 连线') + '</button>' +
    '<span class="g-hint">拖动移动 · 点节点编辑</span>' +
    '</div>' +
    '<svg id="graph-svg" viewBox="0 0 360 520" preserveAspectRatio="xMidYMid meet"></svg>' +
    '</div>';
  drawGraph(g);
  bindGraphEvents(g);
}

function drawGraph(g) {
  const svgEl = document.getElementById('graph-svg');
  if (!svgEl) return;
  const byId = {};
  g.nodes.forEach(n => { byId[n.id] = n; });
  let html = '';
  (g.edges || []).forEach(e => {
    const a = byId[e.a], b = byId[e.b];
    if (!a || !b) return;
    const eid = e.a + '|' + e.b;
    html += '<line class="gedge" data-eid="' + eid + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>' +
      '<line class="gedge-hit" data-eid="' + eid + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    if (e.label) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const w = Math.max(30, e.label.length * 13 + 12);
      html += '<g class="glabel" data-eid="' + eid + '" transform="translate(' + mx + ',' + my + ')">' +
        '<rect x="' + (-w / 2) + '" y="-9" width="' + w + '" height="18" rx="4" fill="#fff" opacity="0.92"/>' +
        '<text y="1">' + esc(e.label) + '</text></g>';
    }
  });
  g.nodes.forEach(n => {
    const w = Math.max(56, n.label.length * 15 + 24);
    const cls = 'gnode' + (state.gLinkFrom === n.id ? ' sel' : '');
    html += '<g class="' + cls + '" data-nid="' + n.id + '" transform="translate(' + n.x + ',' + n.y + ')">' +
      '<rect x="' + (-w / 2) + '" y="-16" width="' + w + '" height="32" rx="16" fill="' + colorHex(n.color) + '"/>' +
      '<text y="4.5">' + esc(n.label) + '</text></g>';
  });
  svgEl.innerHTML = html;
}

function updateEdges(g, svgEl) {
  const byId = {};
  g.nodes.forEach(n => { byId[n.id] = n; });
  (g.edges || []).forEach(e => {
    const a = byId[e.a], b = byId[e.b];
    if (!a || !b) return;
    const eid = e.a + '|' + e.b;
    svgEl.querySelectorAll('.gedge[data-eid="' + eid + '"], .gedge-hit[data-eid="' + eid + '"]').forEach(line => {
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    });
    svgEl.querySelectorAll('.glabel[data-eid="' + eid + '"]').forEach(lb => {
      lb.setAttribute('transform', 'translate(' + ((a.x + b.x) / 2) + ',' + ((a.y + b.y) / 2) + ')');
    });
  });
}

function toSVG(svgEl, cx, cy) {
  const pt = svgEl.createSVGPoint();
  pt.x = cx; pt.y = cy;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

function bindGraphEvents(g) {
  const svgEl = document.getElementById('graph-svg');
  let dragNode = null, startX = 0, startY = 0, moved = false, suppressClick = false;

  /* 拖动：pointer 事件负责移动节点 */
  svgEl.addEventListener('pointerdown', e => {
    const nodeEl = e.target.closest('.gnode');
    if (!nodeEl) return;
    dragNode = g.nodes.find(n => n.id === nodeEl.dataset.nid);
    if (!dragNode) return;
    const pt = toSVG(svgEl, e.clientX, e.clientY);
    dragNode._dx = pt.x - dragNode.x;
    dragNode._dy = pt.y - dragNode.y;
    startX = e.clientX; startY = e.clientY; moved = false;
    try { svgEl.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  svgEl.addEventListener('pointermove', e => {
    if (!dragNode) return;
    if (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4) moved = true;
    const pt = toSVG(svgEl, e.clientX, e.clientY);
    dragNode.x = Math.round(Math.min(350, Math.max(10, pt.x - dragNode._dx)));
    dragNode.y = Math.round(Math.min(505, Math.max(20, pt.y - dragNode._dy)));
    const el = svgEl.querySelector('[data-nid="' + dragNode.id + '"]');
    if (el) el.setAttribute('transform', 'translate(' + dragNode.x + ',' + dragNode.y + ')');
    updateEdges(g, svgEl);
  });

  svgEl.addEventListener('pointerup', () => {
    if (dragNode && moved) suppressClick = true; // 拖动结束，吞掉紧跟的 click 防误触
    dragNode = null;
  });
  svgEl.addEventListener('pointercancel', () => { dragNode = null; });

  /* 单击（click 在手机上最可靠）：节点=编辑/连线，连线或标签=编辑连线 */
  svgEl.addEventListener('click', e => {
    if (suppressClick) { suppressClick = false; return; }
    const nodeEl = e.target.closest('.gnode');
    const edgeEl = e.target.closest('.gedge-hit');
    const labelEl = e.target.closest('.glabel');
    if (nodeEl) {
      const node = g.nodes.find(n => n.id === nodeEl.dataset.nid);
      if (node) handleNodeTap(g, node);
    } else if (edgeEl || labelEl) {
      const eid = (edgeEl || labelEl).dataset.eid;
      const edge = (g.edges || []).find(x => x.a + '|' + x.b === eid);
      if (edge) openEdgeModal(g, edge);
    }
  });
}

function handleNodeTap(g, node) {
  if (state.gLinkMode) {
    if (!state.gLinkFrom) {
      state.gLinkFrom = node.id;
      drawGraph(g);
    } else if (state.gLinkFrom === node.id) {
      state.gLinkFrom = null;
      drawGraph(g);
    } else {
      const key = [state.gLinkFrom, node.id].sort().join('|');
      if (!g.edges.some(x => x.a + '|' + x.b === key)) {
        const parts = key.split('|');
        const edge = { a: parts[0], b: parts[1], label: '' };
        g.edges.push(edge);
        lightSaveBtn();
        state.gLinkFrom = null;
        drawGraph(g);
        openEdgeModal(g, edge);
        return;
      }
      state.gLinkFrom = null;
      drawGraph(g);
    }
  } else {
    openNodeModal(g, node);
  }
}

/* ---------- 图谱：弹窗与保存 ---------- */
function openEdgeModal(g, edge) {
  const a = g.nodes.find(n => n.id === edge.a);
  const b = g.nodes.find(n => n.id === edge.b);
  if (!a || !b) return;
  openFormModal('连线：' + a.label + ' ↔ ' + b.label,
    fieldText('label', '关系标签（可留空）', edge.label || '', '例如：师徒 / 敌对 / 同盟'),
    async fd => {
      edge.label = fd.label.trim();
      lightSaveBtn();
      closeModal();
      drawGraph(g);
    },
    '<button type="button" class="del-btn" data-act="g-del-edge" data-eid="' + edge.a + '|' + edge.b + '">删除这条连线</button>'
  );
}

function openNodeModal(g, node) {
  openFormModal(node ? '编辑节点' : '新增节点',
    fieldText('label', '名称', node && node.label, node ? '' : '例如：林晚') +
    fieldSelect('color', '颜色', NODE_COLORS.map(c => c.name), node && node.color),
    async fd => {
      if (node) {
        node.label = fd.label.trim() || node.label;
        node.color = fd.color;
      } else {
        if (!fd.label.trim()) { toast('请填写节点名称', true); return; }
        g.nodes.push({
          id: Store.uid(), label: fd.label.trim(), color: fd.color,
          x: 100 + Math.round(Math.random() * 160),
          y: 150 + Math.round(Math.random() * 220)
        });
      }
      lightSaveBtn();
      closeModal();
      drawGraph(g);
    },
    node ? '<button type="button" class="del-btn" data-act="g-del-node" data-nid="' + node.id + '">删除该节点</button>' : ''
  );
}

function openGraphModal(id) {
  const item = id ? Store.graphById(id) : null;
  openFormModal(item ? '图谱设置' : '新建图谱',
    fieldText('title', '名称', item && item.title, '例如：主角人物关系') +
    fieldSelect('type', '类型', GRAPH_TYPES, item && item.type),
    async fd => {
      if (!fd.title.trim()) { toast('请填写名称', true); return; }
      if (item) {
        item.title = fd.title.trim(); item.type = fd.type;
        lightSaveBtn();
        closeModal();
        renderGraphEditor();
      } else {
        const gr = { id: Store.uid(), title: fd.title.trim(), type: fd.type, createdAt: Date.now(), updatedAt: Date.now(), nodes: [], edges: [] };
        Store.graphs.unshift(gr);
        closeModal(); renderShell();
        if (await guard(() => Store.saveGraph(gr))) toast('图谱已创建 ✓');
      }
    },
    item ? '<button type="button" class="del-btn" data-act="g-del-graph">删除该图谱</button>' : ''
  );
}

async function saveGraphNow() {
  const g = Store.graphById(state.graphId);
  if (!g) return;
  state.dirty = false;
  const ok = await guard(() => Store.saveGraph(g));
  const btn = document.querySelector('.save-btn');
  if (btn) {
    btn.textContent = '保存';
    if (ok) { btn.classList.add('off'); btn.disabled = true; }
  }
  toast(ok ? '图谱已保存到 GitHub ✓' : '同步失败，请重试', !ok);
}

/* ---------- 照片墙 ---------- */
const PHOTOS_PER_PAGE = 12;
/* 1px 透明占位图：照片本体由 hydratePhotos 走 API 异步加载（私有仓库无 CDN 直链可用） */
const PH_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function phImgTag(p) {
  return '<img data-ph="' + p.id + '" src="' + PH_PLACEHOLDER + '" alt="' + esc(p.name) + '" class="ph-lazy">';
}

/** 渲染后异步加载所有照片（私有仓库必须带 Token 走 API 拉 blob） */
async function hydratePhotos() {
  document.querySelectorAll('img[data-ph]').forEach(img => {
    if (img.dataset.hyd) return;
    img.dataset.hyd = '1';
    const p = Store.photoById(img.dataset.ph);
    if (!p) return;
    Store.photoBlob(p)
      .then(blob => { img.src = URL.createObjectURL(blob); })
      .catch(() => { img.alt = '图片加载失败'; });
  });
}

function pagePhotos() {
  const list = Store.photos;
  const totalPages = Math.max(1, Math.ceil(list.length / PHOTOS_PER_PAGE));
  if (state.photoPage > totalPages) state.photoPage = totalPages;
  if (state.photoPage < 1) state.photoPage = 1;
  const start = (state.photoPage - 1) * PHOTOS_PER_PAGE;
  const pageItems = list.slice(start, start + PHOTOS_PER_PAGE);

  const cells = pageItems.map(p => {
    const tag = p.targetTitle ? '<span class="ph-tag">' + esc(p.targetTitle) + '</span>' : '';
    return '<div class="ph-cell" data-act="open-photo" data-id="' + p.id + '">' +
      phImgTag(p) + tag + '</div>';
  }).join('');

  return '<div class="page-head"><span class="page-sub">给灵感和片段配上画面 · 共 ' + list.length + ' 张</span></div>' +
    (list.length
      ? '<div class="ph-grid">' + cells + '</div>' + pageBarHTML(totalPages)
      : emptyBox('照片墙还是空的', '点击右下角 +，为你的灵感和片段配上图片'));
}

/** 分页条：首页/上一页/页码/下一页/末页 + 页码下拉 */
function pageBarHTML(totalPages) {
  if (totalPages <= 1) return '';
  const cur = state.photoPage;
  // 页码窗口：最多显示 7 个，以当前页为中心
  let from = Math.max(1, Math.min(cur - 3, totalPages - 6));
  const to = Math.min(totalPages, from + 6);
  from = Math.max(1, to - 6);
  let nums = '';
  for (let i = from; i <= to; i++) {
    nums += '<button class="pg-num' + (i === cur ? ' on' : '') + '" data-act="photo-page" data-page="' + i + '">' + i + '</button>';
  }
  let opts = '';
  for (let i = 1; i <= totalPages; i++) opts += '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>第 ' + i + ' / ' + totalPages + ' 页</option>';
  return '<div class="pg-bar">' +
    '<button class="pg-num" data-act="photo-page" data-page="1"' + (cur === 1 ? ' disabled' : '') + '>«</button>' +
    '<button class="pg-num" data-act="photo-page" data-page="' + (cur - 1) + '"' + (cur === 1 ? ' disabled' : '') + '>‹</button>' +
    nums +
    '<button class="pg-num" data-act="photo-page" data-page="' + (cur + 1) + '"' + (cur === totalPages ? ' disabled' : '') + '>›</button>' +
    '<button class="pg-num" data-act="photo-page" data-page="' + totalPages + '"' + (cur === totalPages ? ' disabled' : '') + '>»</button>' +
    '<select class="pg-jump" id="pg-jump">' + opts + '</select>' +
    '</div>';
}

/** 照片全屏查看器 */
function openPhotoViewer(p) {
  $modalRoot.innerHTML =
    '<div class="pv-mask" data-act="close-pv">' +
    '<div class="pv-body">' + phImgTag(p) + '</div>' +
    '<div class="pv-bar">' +
    '<div class="pv-info"><b>' + esc(p.name) + '</b>' +
    '<span>' + (p.targetTitle ? '关联：' + esc(p.targetTitle) + ' · ' : '') + fmtDate(p.createdAt) + '</span></div>' +
    '<button class="pv-del" data-act="del-photo" data-id="' + p.id + '">' + IC.trash + ' 删除</button>' +
    '</div></div>';
}

/** 压缩图片：等比缩放到最长边 maxDim，导出 JPEG DataURL */
function resizeImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/** 新增照片弹窗 */
function openPhotoModal() {
  const targets = [{ v: '', t: '不关联任何条目' }]
    .concat(Store.inspirations.map(x => ({ v: 'insp:' + x.id, t: '灵感：' + x.title })))
    .concat(Store.fragments.map(x => ({ v: 'frag:' + x.id, t: '片段：' + x.title })));
  openFormModal('添加照片',
    '<input type="file" accept="image/*" id="ph-file" style="display:none">' +
    '<button type="button" class="ph-pick" id="ph-pick-btn">＋ 添加照片</button>' +
    '<label class="f" style="margin-top:14px"><span>关联条目（可选）</span><select name="target">' +
    targets.map(t => '<option value="' + t.v + '">' + esc(t.t) + '</option>').join('') +
    '</select></label>',
    async fd => {
      const input = document.getElementById('ph-file');
      const file = input && input.files && input.files[0];
      if (!file) { toast('请先点「＋ 添加照片」选择一张图片', true); return; }
      toast('正在压缩并上传…');
      const dataUrl = await resizeImage(file, 1280, 0.85);
      const tv = fd.target || '';
      const assoc = { targetType: null, targetId: null, targetTitle: '' };
      if (tv.indexOf('insp:') === 0) {
        const it = Store.inspirations.find(x => x.id === tv.slice(5));
        if (it) { assoc.targetType = 'inspiration'; assoc.targetId = it.id; assoc.targetTitle = it.title; }
      } else if (tv.indexOf('frag:') === 0) {
        const it = Store.fragments.find(x => x.id === tv.slice(5));
        if (it) { assoc.targetType = 'fragment'; assoc.targetId = it.id; assoc.targetTitle = it.title; }
      }
      // 上传自动重试 2 次（弱网上传偶发失败）
      let lastErr = null;
      for (let i = 0; i < 3; i++) {
        try { await Store.uploadPhoto(file.name.replace(/\.[^.]+$/, ''), dataUrl, assoc); lastErr = null; break; }
        catch (e) { lastErr = e; }
      }
      if (lastErr) throw lastErr;
      closeModal(); renderShell();
      toast('照片已上传 ✓');
    });

  // 「添加照片」按钮：触发隐藏的文件选择器，选中后回显文件名
  document.getElementById('ph-pick-btn').addEventListener('click', () => document.getElementById('ph-file').click());
  document.getElementById('ph-file').addEventListener('change', () => {
    const f = document.getElementById('ph-file').files[0];
    const btn = document.getElementById('ph-pick-btn');
    if (f && btn) btn.textContent = '✓ ' + (f.name.length > 16 ? f.name.slice(0, 16) + '…' : f.name);
  });
}

/* ---------- 更多页 ---------- */
function pageMore() {
  return '<div class="page-head"><span class="page-sub">后续功能扩展区</span></div>' +
    '<div class="card more-card"><div class="more-icon">🚧</div><h3>更多功能建设中</h3>' +
    '<p>角色关系图谱、灵感看板、导出成稿等功能将在后续版本上线，敬请期待。</p></div>' +
    '<div class="card account-card">' +
    '<div class="acc-row"><span>账号</span><b>' + esc(Store.account.user) + '</b></div>' +
    '<div class="acc-row"><span>仓库</span><b>' + esc(Store.account.repo) + '</b></div>' +
    '<div class="acc-row"><span>数据目录</span><b>xiaolingganshuo/</b></div>' +
    '</div>' +
    '<button class="logout-btn" data-act="logout">退出登录</button>';
}

/* ---------- 弹窗表单（仅用于快速新增） ---------- */
function closeModal() { $modalRoot.innerHTML = ''; }

/** 自定义确认弹窗（替代原生 confirm）：返回 Promise<boolean> */
function confirmDialog(opts) {
  return new Promise(resolve => {
    $modalRoot.innerHTML =
      '<div class="mask confirm-mask"><div class="confirm-box">' +
      '<div class="confirm-icon">' + (opts.icon || '⚠️') + '</div>' +
      '<h3>' + esc(opts.title || '确认操作') + '</h3>' +
      (opts.message ? '<p>' + esc(opts.message) + '</p>' : '') +
      '<div class="confirm-btns">' +
      '<button class="confirm-cancel">取消</button>' +
      '<button class="confirm-ok' + (opts.okWarn ? ' warn' : '') + '">' + esc(opts.okText || '确认') + '</button>' +
      '</div></div></div>';
    const done = v => { $modalRoot.innerHTML = ''; resolve(v); };
    $modalRoot.querySelector('.confirm-cancel').addEventListener('click', () => done(false));
    $modalRoot.querySelector('.confirm-ok').addEventListener('click', () => done(true));
    $modalRoot.querySelector('.confirm-mask').addEventListener('click', e => {
      if (e.target === e.currentTarget) done(false);
    });
  });
}
/** 删除专用确认弹窗（红色警告按钮） */
async function confirmDelete(name) {
  return confirmDialog({ icon: '🗑️', title: '删除确认', message: '删除' + name + '？此操作不可恢复。', okText: '确认删除' });
}
/** 未保存离开确认弹窗 */
async function confirmLeave(msg) {
  return confirmDialog({ icon: '📝', title: '未保存的修改', message: msg || '离开后修改将丢失，确定离开？', okText: '确定离开', okWarn: true });
}

function openFormModal(title, fieldsHTML, onsubmit, extraHTML) {
  $modalRoot.innerHTML =
    '<div class="mask" data-act="close-mask"><form class="sheet" id="modal-form">' +
    '<div class="sheet-head"><b>' + esc(title) + '</b><button type="button" class="icon-btn" data-act="close-modal">✕</button></div>' +
    fieldsHTML +
    '<button class="primary-btn" type="submit">保 存</button>' +
    (extraHTML || '') +
    '</form></div>';

  document.getElementById('modal-form').addEventListener('submit', ev => {
    ev.preventDefault();
    const form = ev.target;
    if (form.dataset.busy === '1') return; // 防重入：避免慢网络下连点导致重复添加
    form.dataset.busy = '1';
    const btn = form.querySelector('.primary-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.textContent = '保存中…'; }
    Promise.resolve(onsubmit(Object.fromEntries(new FormData(form))))
      .catch(e => { console.error(e); toast('操作失败：' + e.message, true); })
      .finally(() => {
        // 任何路径（含校验失败）都解锁按钮；弹窗已关闭时跳过
        const f = document.getElementById('modal-form');
        if (!f) return;
        f.dataset.busy = '';
        const b = f.querySelector('.primary-btn');
        if (b) { b.disabled = false; b.style.opacity = ''; b.textContent = '保 存'; }
      });
  });
}

function fieldText(name, label, value, placeholder) {
  return '<label class="f"><span>' + esc(label) + '</span><input name="' + name + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"></label>';
}
function fieldTextarea(name, label, value, placeholder, rows) {
  return '<label class="f"><span>' + esc(label) + '</span><textarea name="' + name + '" rows="' + (rows || 6) + '" placeholder="' + esc(placeholder || '') + '">' + esc(value || '') + '</textarea></label>';
}
function fieldSelect(name, label, options, value) {
  return '<label class="f"><span>' + esc(label) + '</span><select name="' + name + '">' +
    options.map(o => '<option' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>').join('') +
    '</select></label>';
}

/* ---------- 快速新增弹窗 ---------- */
function openInspModal(presetCat) {
  openFormModal('新增灵感',
    fieldText('title', '标题', '', '例如：灵气复苏的世界规则') +
    fieldSelect('category', '分类', CATS, presetCat || '世界观') +
    fieldTextarea('content', '内容（也可以保存后点进去补充）', '', '写下设定细节…', 5),
  async fd => {
    if (!fd.title.trim()) { toast('请填写标题', true); return; }
    Store.inspirations.unshift({
      id: Store.uid(), title: fd.title.trim(), category: fd.category,
      content: fd.content, createdAt: Date.now(), updatedAt: Date.now()
    });
    closeModal(); renderShell();
    if (await guard(() => Store.saveMeta())) toast('已保存到 GitHub ✓');
  });
}

function openFragModal() {
  openFormModal('新增片段',
    fieldText('title', '标题', '', '片段标题') +
    fieldTextarea('content', '内容（也可以保存后点进去补充）', '', '粘贴或写下这段文字…', 5),
  async fd => {
    if (!fd.title.trim()) { toast('请填写标题', true); return; }
    Store.fragments.unshift({
      id: Store.uid(), title: fd.title.trim(),
      content: fd.content, createdAt: Date.now(), updatedAt: Date.now()
    });
    closeModal(); renderShell();
    if (await guard(() => Store.saveMeta())) toast('已保存到 GitHub ✓');
  });
}

function openWordModal() {
  openFormModal('新增短词',
    fieldText('title', '词语', '', '例如：霁月 / 顿开茅塞') +
    fieldTextarea('content', '备注（可留空）', '', '释义、出处、用法示例…', 3),
  async fd => {
    if (!fd.title.trim()) { toast('请填写词语', true); return; }
    Store.words.push({
      id: Store.uid(), title: fd.title.trim(),
      content: fd.content, createdAt: Date.now(), updatedAt: Date.now()
    });
    closeModal(); renderShell();
    if (await guard(() => Store.saveMeta())) toast('已保存到 GitHub ✓');
  });
}

function openNovelModal(id) {
  const item = id ? Store.novelById(id) : null;
  openFormModal(item ? '编辑小说' : '新建小说',
    fieldText('title', '书名', item && item.title, '例如：星海拾遗') +
    fieldTextarea('desc', '简介', item && item.desc, '一句话介绍这本书…', 3),
  async fd => {
    if (!fd.title.trim()) { toast('请填写书名', true); return; }
    if (item) {
      item.title = fd.title.trim(); item.desc = fd.desc;
      closeModal(); renderShell();
      if (await guard(() => Store.saveNovel(item))) toast('已保存到 GitHub ✓');
    } else {
      const novel = { id: Store.uid(), title: fd.title.trim(), desc: fd.desc, createdAt: Date.now(), updatedAt: Date.now(), chapters: [] };
      Store.novels.unshift(novel);
      closeModal(); renderShell();
      if (await guard(() => Store.saveNovel(novel))) toast('小说已创建 ✓');
    }
  });
}

function openChapterModal(novelId) {
  const novel = Store.novelById(novelId);
  openFormModal('新建章节',
    fieldText('title', '章节标题', '', '例如：第一章 初入荒原'),
  async fd => {
    if (!fd.title.trim()) { toast('请填写章节标题', true); return; }
    if (!novel.chapters) novel.chapters = [];
    novel.chapters.push({ id: Store.uid(), title: fd.title.trim(), content: '', createdAt: Date.now(), updatedAt: Date.now() });
    novel.updatedAt = Date.now();
    closeModal(); renderShell();
    if (await guard(() => Store.saveNovel(novel))) toast('已保存到 GitHub ✓');
  });
}

/* ---------- 事件分发 ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'close-mask' && e.target !== el) return; // 只有点击遮罩空白处才关闭

  const id = el.dataset.id;
  const novel = state.novelId ? Store.novelById(state.novelId) : null;

  switch (act) {
    case 'tab':
      state.tab = el.dataset.tab;
      Object.assign(state, { novelId: null, chapterId: null, inspCat: null, inspId: null, fragId: null, wordId: null, graphId: null, gLinkMode: false, gLinkFrom: null, photoPage: 1, dirty: false });
      renderShell(); break;

    case 'fab-add':
      if (state.tab === 'inspiration') openInspModal(state.inspCat);
      else if (state.tab === 'graph') openGraphModal();
      else if (state.tab === 'photo') openPhotoModal();
      else if (state.tab === 'write') { if (state.novelId && novel) openChapterModal(state.novelId); }
      break;

    case 'add-novel': openNovelModal(); break;
    case 'add-frag': openFragModal(); break;

    case 'close-modal': closeModal(); break;
    case 'close-mask': closeModal(); break;

    /* 灵感 */
    case 'open-insp-cat': state.inspCat = el.dataset.cat; renderShell(); break;
    case 'back-insp':
      if (state.inspId) {
        if (state.dirty && !(await confirmLeave())) return;
        state.inspId = null;
      } else { state.inspCat = null; }
      state.dirty = false; renderShell(); break;
    case 'open-insp': state.inspId = id; state.dirty = false; renderShell(); break;
    case 'save-insp': await saveInsp(); break;
    case 'del-insp': {
      const tid = id || state.inspId;
      const it = Store.inspirations.find(x => x.id === tid);
      if (it && await confirmDelete('灵感「' + it.title + '」')) {
        Store.inspirations = Store.inspirations.filter(x => x.id !== tid);
        if (state.inspId === tid) state.inspId = null;
        state.dirty = false; renderShell();
        if (await guard(() => Store.saveMeta())) toast('已删除 ✓');
      }
      break;
    }

    /* 片段 */
    case 'open-frag': state.fragId = id; state.dirty = false; renderShell(); break;
    case 'back-frag':
      if (state.dirty && !(await confirmLeave())) return;
      state.fragId = null; state.dirty = false; renderShell(); break;
    case 'save-frag': await saveFrag(); break;
    case 'del-frag': {
      const tid = id || state.fragId;
      const it = Store.fragments.find(x => x.id === tid);
      if (it && await confirmDelete('片段「' + it.title + '」')) {
        Store.fragments = Store.fragments.filter(x => x.id !== tid);
        if (state.fragId === tid) state.fragId = null;
        state.dirty = false; renderShell();
        if (await guard(() => Store.saveMeta())) toast('已删除 ✓');
      }
      break;
    }

    /* 开始写 */
    case 'open-novel': state.novelId = id; renderShell(); break;
    case 'back-novels': state.novelId = null; renderShell(); break;
    case 'edit-novel': openNovelModal(id); break;
    case 'del-novel': {
      const target = id ? Store.novelById(id) : novel;
      if (target && await confirmDelete('小说「' + target.title + '」及其全部章节')) {
        if (await guard(() => Store.deleteNovel(target))) toast('已删除 ✓');
        if (state.novelId === target.id) state.novelId = null;
        renderShell();
      }
      break;
    }
    case 'open-chapter': state.chapterId = id; state.dirty = false; renderShell(); break;
    case 'del-chapter': {
      const ch = novel ? (novel.chapters || []).find(c => c.id === id) : null;
      if (ch && await confirmDelete('章节「' + ch.title + '」')) {
        novel.chapters = novel.chapters.filter(c => c.id !== id);
        if (state.chapterId === id) state.chapterId = null;
        state.dirty = false; renderShell();
        if (await guard(() => Store.saveNovel(novel))) toast('已删除 ✓');
      }
      break;
    }
    case 'back-chapters':
      if (state.dirty && !(await confirmLeave('离开后未保存的内容将丢失，确定离开？'))) return;
      state.chapterId = null; state.dirty = false; renderShell();
      break;
    case 'save-chapter': await saveChapter(); break;

    /* 图谱 */
    case 'open-graph': state.graphId = id; state.dirty = false; renderShell(); break;
    case 'del-graph-id': {
      const gr = Store.graphById(id);
      if (gr && await confirmDelete('图谱「' + gr.title + '」')) {
        if (await guard(() => Store.deleteGraph(gr))) toast('已删除 ✓');
        renderShell();
      }
      break;
    }
    case 'g-del-edge': {
      const g = Store.graphById(state.graphId);
      const eid = el.dataset.eid;
      if (g && await confirmDelete('连线')) {
        g.edges = (g.edges || []).filter(x => x.a + '|' + x.b !== eid);
        lightSaveBtn();
        closeModal();
        drawGraph(g);
      }
      break;
    }
    case 'back-graphs':
      if (state.dirty && !(await confirmLeave())) return;
      state.graphId = null; state.gLinkMode = false; state.gLinkFrom = null; state.dirty = false; renderShell(); break;
    case 'g-open-settings': openGraphModal(state.graphId); break;
    case 'g-add-node': {
      const g = Store.graphById(state.graphId);
      if (g) openNodeModal(g, null);
      break;
    }
    case 'g-link-toggle': {
      const g = Store.graphById(state.graphId);
      if (!g) break;
      state.gLinkMode = !state.gLinkMode;
      state.gLinkFrom = null;
      renderGraphEditor();
      break;
    }
    case 'g-del-node': {
      const g = Store.graphById(state.graphId);
      const nid = el.dataset.nid;
      const nd = g ? g.nodes.find(n => n.id === nid) : null;
      if (nd && await confirmDelete('节点「' + nd.label + '」及其所有连线')) {
        g.nodes = g.nodes.filter(n => n.id !== nid);
        g.edges = (g.edges || []).filter(e => e.a !== nid && e.b !== nid);
        if (state.gLinkFrom === nid) state.gLinkFrom = null;
        lightSaveBtn();
        closeModal();
        drawGraph(g);
      }
      break;
    }
    case 'g-del-graph': {
      const g = Store.graphById(state.graphId);
      if (g && await confirmDelete('整张图谱「' + g.title + '」')) {
        closeModal();
        if (await guard(() => Store.deleteGraph(g))) toast('已删除 ✓');
        state.graphId = null; state.dirty = false; renderShell();
      }
      break;
    }
    case 'save-graph': await saveGraphNow(); break;

    /* 短词 */
    case 'open-word': state.wordId = id; state.dirty = false; renderShell(); break;
    case 'back-words':
      if (state.dirty && !(await confirmLeave())) return;
      state.wordId = null; state.dirty = false; renderShell(); break;
    case 'add-word': openWordModal(); break;
    case 'save-word': await saveWord(); break;
    case 'del-word': {
      const it = Store.words.find(x => x.id === id);
      if (it && await confirmDelete('短词「' + it.title + '」')) {
        Store.words = Store.words.filter(x => x.id !== id);
        if (state.wordId === id) state.wordId = null;
        state.dirty = false; renderShell();
        if (await guard(() => Store.saveMeta())) toast('已删除 ✓');
      }
      break;
    }

    /* 照片墙 */
    case 'photo-page': {
      const pg = parseInt(el.dataset.page, 10);
      if (pg >= 1) { state.photoPage = pg; renderShell(); window.scrollTo(0, 0); }
      break;
    }
    case 'open-photo': {
      const p = Store.photoById(id);
      if (p) openPhotoViewer(p);
      break;
    }
    case 'close-pv': closeModal(); break;
    case 'del-photo': {
      const p = Store.photoById(id);
      if (p && await confirmDelete('照片「' + p.name + '」')) {
        closeModal();
        const ok = await guard(() => Store.deletePhoto(p));
        if (ok) { toast('已删除 ✓'); renderShell(); }
      }
      break;
    }

    case 'logout':
      if (await confirmDialog({ icon: '🚪', title: '退出登录', message: '本机保存的 Token 将被清除，下次登录需重新输入。', okText: '退出登录', okWarn: true })) {
        localStorage.removeItem(LS.user); localStorage.removeItem(LS.repo); localStorage.removeItem(LS.token);
        Object.assign(state, { tab: 'inspiration', novelId: null, chapterId: null, inspCat: null, inspId: null, fragId: null, wordId: null, graphId: null, gLinkMode: false, gLinkFrom: null, photoPage: 1, dirty: false });
        renderLogin();
      }
      break;
  }
});

/* ---------- 保存逻辑 ---------- */
async function saveInsp() {
  const item = Store.inspirations.find(x => x.id === state.inspId);
  if (!item) return;
  const t = document.getElementById('dt-title'), c = document.getElementById('dt-cat'), ct = document.getElementById('dt-content');
  if (t && t.value.trim()) item.title = t.value.trim();
  if (c) item.category = c.value;
  if (ct) item.content = ct.value;
  item.updatedAt = Date.now();
  state.dirty = false;
  const ok = await guard(() => Store.saveMeta());
  const btn = document.querySelector('.save-btn');
  if (btn) {
    btn.textContent = '保存';
    if (ok) { btn.classList.add('off'); btn.disabled = true; }
  }
  toast(ok ? '已保存到 GitHub ✓' : '同步失败，请重试', !ok);
}

async function saveFrag() {
  const item = Store.fragments.find(x => x.id === state.fragId);
  if (!item) return;
  const t = document.getElementById('dt-title'), ct = document.getElementById('dt-content');
  if (t && t.value.trim()) item.title = t.value.trim();
  if (ct) item.content = ct.value;
  item.updatedAt = Date.now();
  state.dirty = false;
  const ok = await guard(() => Store.saveMeta());
  const btn = document.querySelector('.save-btn');
  if (btn) {
    btn.textContent = '保存';
    if (ok) { btn.classList.add('off'); btn.disabled = true; }
  }
  toast(ok ? '已保存到 GitHub ✓' : '同步失败，请重试', !ok);
}

async function saveWord() {
  const item = Store.words.find(x => x.id === state.wordId);
  if (!item) return;
  const t = document.getElementById('dt-title'), ct = document.getElementById('dt-content');
  if (t && t.value.trim()) item.title = t.value.trim();
  if (ct) item.content = ct.value;
  item.updatedAt = Date.now();
  state.dirty = false;
  const ok = await guard(() => Store.saveMeta());
  const btn = document.querySelector('.save-btn');
  if (btn) {
    btn.textContent = '保存';
    if (ok) { btn.classList.add('off'); btn.disabled = true; }
  }
  toast(ok ? '已保存到 GitHub ✓' : '同步失败，请重试', !ok);
}

async function saveChapter() {
  const novel = Store.novelById(state.novelId);
  const ch = novel.chapters.find(c => c.id === state.chapterId);
  if (!ch) return;
  const titleInput = document.getElementById('ch-title');
  const contentEl = document.getElementById('ch-content');
  if (titleInput && titleInput.value.trim()) ch.title = titleInput.value.trim();
  ch.content = contentEl ? contentEl.value : ch.content;
  ch.updatedAt = Date.now();
  novel.updatedAt = Date.now();
  state.dirty = false;
  const ok = await guard(() => Store.saveNovel(novel));
  const btn = document.querySelector('.save-btn');
  if (btn) {
    btn.textContent = '保存';
    if (ok) { btn.classList.add('off'); btn.disabled = true; }
  }
  toast(ok ? '章节已保存到 GitHub ✓' : '本地已保存，同步失败，请重试', !ok);
}

/* 页码下拉跳页（select 的 change 事件不走 click 分发） */
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'pg-jump') {
    const pg = parseInt(e.target.value, 10);
    if (pg >= 1) { state.photoPage = pg; renderShell(); window.scrollTo(0, 0); }
  }
});

/* 有未保存内容时离开页面提醒 */
window.addEventListener('beforeunload', e => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
});
