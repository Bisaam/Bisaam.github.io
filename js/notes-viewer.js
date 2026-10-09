(function () {
  var data = window.NOTES;
  var tree = document.getElementById('nbTree');
  if (!data || !tree) return;

  var pvTitle = document.getElementById('nbTitle');
  var pvPath = document.getElementById('nbPath');
  var pvBody = document.getElementById('nbContent');
  var countEl = document.getElementById('nbCount');

  var parentOf = {};
  Object.keys(data.children).forEach(function (p) {
    data.children[p].forEach(function (c) { parentOf[c] = p; });
  });
  if (countEl) countEl.textContent = Object.keys(data.nodes).length + ' notes';

  function pathNames(id) {
    var p = [], cur = id;
    while (cur) { p.unshift(data.nodes[cur].name); cur = parentOf[cur]; }
    return p;
  }

  var rowById = {};
  function render(id, depth, parentEl) {
    var node = data.nodes[id];
    var hasKids = !!data.children[id];
    var row = document.createElement('div');
    row.className = 'nb__row' + (hasKids ? ' nb__row--dir' : '');
    row.style.paddingLeft = (10 + depth * 15) + 'px';
    row.dataset.id = id;

    var chev = document.createElement('span');
    chev.className = 'nb__chev';
    chev.textContent = hasKids ? '▸' : '';

    var icon = document.createElement('span');
    icon.className = 'nb__icon';
    icon.textContent = hasKids ? '■' : '·';

    var label = document.createElement('span');
    label.className = 'nb__label';
    label.textContent = node.name;

    row.appendChild(chev);
    row.appendChild(icon);
    row.appendChild(label);
    parentEl.appendChild(row);
    rowById[id] = row;

    if (hasKids) {
      var wrap = document.createElement('div');
      wrap.className = 'nb__kids';
      wrap.style.display = 'none';
      data.children[id].forEach(function (c) { render(c, depth + 1, wrap); });
      parentEl.appendChild(wrap);
      row._kids = wrap;
    }
  }
  data.roots.forEach(function (r) { render(r, 0, tree); });

  function setOpen(row, open) {
    if (!row._kids) return;
    row._kids.style.display = open ? '' : 'none';
    row.querySelector('.nb__chev').textContent = open ? '▾' : '▸';
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function renderBody(txt) {
    var h = esc(txt);
    h = h.replace(/●+/g, function (m) { return '<span class="nb-redact">' + m + '</span>'; });
    h = h.replace(/\[[^\]]*(?:redacted|kept private)[^\]]*\]/g, function (m) { return '<span class="nb-redact">' + m + '</span>'; });
    h = h.replace(/⧉[^\n]*/g, function (m) { return '<span class="nb-omit">' + m + '</span>'; });
    return h;
  }

  var selected = null;
  function select(id) {
    if (selected) selected.classList.remove('nb__row--sel');
    var row = rowById[id];
    row.classList.add('nb__row--sel');
    selected = row;

    var node = data.nodes[id];
    pvTitle.textContent = node.name;
    var names = pathNames(id); names.pop();
    pvPath.textContent = names.length ? '~/notes  ›  ' + names.join('  ›  ') : '~/notes';

    var body = (node.body || '').trim();
    if (body) {
      pvBody.innerHTML = renderBody(body);
      pvBody.classList.remove('nb__content--empty');
    } else {
      pvBody.textContent = 'This is a section — open it in the tree to browse the notes inside.';
      pvBody.classList.add('nb__content--empty');
    }
  }

  tree.addEventListener('click', function (e) {
    var row = e.target.closest('.nb__row');
    if (!row) return;
    var id = row.dataset.id;
    if (e.target.classList.contains('nb__chev') && row._kids) {
      setOpen(row, row._kids.style.display === 'none');
      return;
    }
    if (row._kids && row._kids.style.display === 'none') setOpen(row, true);
    select(id);
    if (window.matchMedia('(max-width: 760px)').matches) {
      document.getElementById('nbPreview').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Open the roots, then expand to and select a nice first note (the Blue recon panel if present).
  data.roots.forEach(function (r) { setOpen(rowById[r], true); });
  var LANDING = '52';
  var start = data.nodes[LANDING] ? LANDING : data.roots[0];
  var chain = [], cur = start;
  while (cur) { chain.unshift(cur); cur = parentOf[cur]; }
  chain.forEach(function (nid) { if (rowById[nid] && rowById[nid]._kids) setOpen(rowById[nid], true); });
  select(start);
  // Scroll only the tree panel (scrollIntoView would also scroll the page on load).
  var sr = rowById[start];
  if (sr) tree.scrollTop += sr.getBoundingClientRect().top - tree.getBoundingClientRect().top - tree.clientHeight / 3;
})();
