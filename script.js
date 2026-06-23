
var issues = [], tab = 'all', loggedIn = false;
var BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';

function show(id) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active') });
    document.getElementById(id).classList.add('active');
}
function fillDemo() {
    document.getElementById('lu').value = 'admin';
    document.getElementById('lp').value = 'admin123';
    document.getElementById('lerr').classList.remove('show');
}
function doLogin() {
    var u = document.getElementById('lu').value.trim();
    var p = document.getElementById('lp').value.trim();
    if (u === 'admin' && p === 'admin123') { loggedIn = true; show('pg-dash'); loadIssues(); }
    else { document.getElementById('lerr').classList.add('show'); document.getElementById('lp').value = ''; }
}
function doLogout() {
    loggedIn = false; issues = []; tab = 'all';
    document.getElementById('si').value = '';
    document.querySelectorAll('.tb').forEach(function (b) { b.classList.remove('active') });
    document.getElementById('tb-all').classList.add('active');
    show('pg-login');
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !loggedIn) doLogin();
    if (e.key === 'Escape') closeModal();
});
async function apiFetch(url) {
    try {
        var r = await fetch(url);
        if (r.ok) return r.json();
        throw new Error('fail');
    } catch (e) {
        var r2 = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(url));
        return r2.json();
    }
}
async function loadIssues() {
    setGrid('<div class="ldr"><div class="spin"></div><p class="ltxt">Loading issues...</p></div>');
    try {
        var j = await apiFetch(BASE + '/issues');
        issues = j.data || [];
        document.getElementById('ca').textContent = issues.length;
        document.getElementById('co').textContent = issues.filter(function (i) { return i.status === 'open' }).length;
        document.getElementById('cc').textContent = issues.filter(function (i) { return i.status === 'closed' }).length;
        renderList(filtered());
        updateSub();
    } catch (e) {
        setGrid('<div class="empty"><p style="color:#ef4444">Failed to load. Check internet connection.</p></div>');
    }
}
async function doSearch() {
    var q = document.getElementById('si').value.trim();
    if (!q) { loadIssues(); return; }
    setGrid('<div class="ldr"><div class="spin"></div><p class="ltxt">Searching...</p></div>');
    try {
        var j = await apiFetch(BASE + '/issues/search?q=' + encodeURIComponent(q));
        var res = j.data || [];
        renderList(res);
        document.getElementById('ds').textContent = res.length + ' result(s) for "' + q + '"';
    } catch (e) {
        setGrid('<div class="empty"><p style="color:#ef4444">Search failed.</p></div>');
    }
}
function sw(t) {
    tab = t;
    document.getElementById('si').value = '';
    document.querySelectorAll('.tb').forEach(function (b) { b.classList.remove('active') });
    document.getElementById('tb-' + t).classList.add('active');
    renderList(filtered());
    updateSub();
}
function filtered() {
    if (tab === 'all') return issues;
    return issues.filter(function (i) { return i.status === tab });
}
function updateSub() {
    var l = filtered();
    var name = tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1);
    document.getElementById('ds').textContent = l.length + ' issue' + (l.length !== 1 ? 's' : '') + ' · ' + name;
}
function setGrid(html) { document.getElementById('grid').innerHTML = html; }
function renderList(list) {
    if (!list || !list.length) {
        setGrid('<div class="empty"><p style="font-size:36px;margin-bottom:8px">🔍</p><p>No issues found.</p></div>');
        return;
    }
    var html = '';
    for (var idx = 0; idx < list.length; idx++) { html += buildCard(list[idx], idx); }
    setGrid(html);
}

    function buildCard(i, idx) {
        var lblHtml = '';
        if (i.labels && i.labels.length) {
            for (var k = 0; k < i.labels.length; k++) { lblHtml += buildLabel(i.labels[k]); }
            lblHtml = '<div class="clbls">' + lblHtml + '</div>';
        }

    var init = (i.author || 'U').substring(0, 2).toUpperCase();
    var delay = Math.min(idx * 25, 400);
    return '<div class="card ' + i.status + '" style="animation-delay:' + delay + 'ms" onclick="openModal(' + i.id + ')">'
        + '<div class="ctop"><span class="cnum">#' + i.id + '</span><span class="sb ' + i.status + '">' + (i.status === 'open' ? '● Open' : '● Closed') + '</span></div>'
        + '<div class="ctitle">' + esc(i.title) + '</div>'
        + '<div class="cdesc">' + esc(i.description) + '</div>'
        + lblHtml
        + '<div class="cinfo">' 
        + '<div class="cr"><span class="crk">Priority</span><span class="pr pr-' + i.priority + '">' + i.priority + '</span></div>'
        + '<div class="cr"><span class="crk">Author</span>' + esc(i.author) + '</div>'
        + '<div class="cr"><span class="crk">Category</span><span class="sb ' + i.status + '" style="font-size:10px">' + i.status + '</span></div>'
        + '</div>'
        + '<div class="cfoot">'
        + '<div class="cauth"><div class="ava">' + init + '</div>' + esc(i.author) + '</div>'
        + '<span class="cdate">' + fmtDate(i.createdAt) + '</span>'
        + '</div>'
        + '</div>';
}
function buildLabel(l) {
    var lc = l.toLowerCase();
    var cls = 'lb-ot';
    if (lc.includes('bug')) cls = 'lb-bug';
    else if (lc.includes('enhancement')) cls = 'lb-en';
    else if (lc.includes('documentation')) cls = 'lb-doc';
    else if (lc.includes('good first')) cls = 'lb-gd';
    else if (lc.includes('help')) cls = 'lb-hp';
    return '<span class="lb ' + cls + '">' + esc(l) + '</span>';
}
async function openModal(id) {
    document.getElementById('ov').classList.add('show');
    document.getElementById('mc').innerHTML = '<div class="ldr"><div class="spin"></div></div>';
    try {
        var j = await apiFetch(BASE + '/issue/' + id);
        var i = j.data;
        var lblHtml = '';
        if (i.labels && i.labels.length) {
            for (var k = 0; k < i.labels.length; k++) { lblHtml += buildLabel(i.labels[k]); }
            lblHtml = '<div class="mlbs">' + lblHtml + '</div>';
        }
        document.getElementById('mc').innerHTML =
            '<div class="mh">'
            + '<div class="mr1">'
            + '<div class="mbd"><span class="ms ' + i.status + '">' + (i.status === 'open' ? '● Opened' : '● Closed') + '</span>'
            + '<span class="mm">Opened by <b>' + esc(i.author) + '</b> · ' + fmtDate(i.createdAt) + '</span></div>'
            + '<button class="mcl" onclick="closeModal()">✕</button>'
            + '</div>'
            + lblHtml
            + '<div class="mti">' + esc(i.title) + '</div>'
            + '</div>'
            + '<div class="mb">'
            + '<div class="mdc">' + esc(i.description) + '</div>'
            + '<div class="mg">'
            + '<div class="mf"><div class="mfl">Assignee</div><div class="mfv">' + (i.assignee ? esc(i.assignee) : '—') + '</div></div>'
            + '<div class="mf"><div class="mfl">Priority</div><div class="mfv"><span class="pr pr-' + i.priority + '">' + i.priority + '</span></div></div>'
            + '<div class="mf"><div class="mfl">Author</div><div class="mfv">' + esc(i.author) + '</div></div>'
            + '<div class="mf"><div class="mfl">Status</div><div class="mfv"><span class="sb ' + i.status + '">' + (i.status === 'open' ? '● Open' : '● Closed') + '</span></div></div>'
            + '<div class="mf"><div class="mfl">Created</div><div class="mfv">' + fmtDate(i.createdAt) + '</div></div>'
            + '<div class="mf"><div class="mfl">Updated</div><div class="mfv">' + fmtDate(i.updatedAt) + '</div></div>'
            + '</div></div>';
    } catch (e) {
        document.getElementById('mc').innerHTML = '<p style="padding:30px;text-align:center;color:#ef4444">Failed to load.</p>';
    }
}
function closeModal() { document.getElementById('ov').classList.remove('show'); }
document.getElementById('ov').addEventListener('click', function (e) {
    if (e.target === document.getElementById('ov')) closeModal();
});
function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
document.getElementById('si').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') { this.value = ''; loadIssues(); }
});

