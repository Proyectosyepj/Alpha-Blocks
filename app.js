'use strict';
/* =========================================================
   ALPHA BLOCKS · app.js
   Migración de Streamlit (Python) → HTML5 / CSS3 / JavaScript ES6
   ========================================================= */

/* ---------- Estado global (equivale a st.session_state) ---------- */
const S = {};
const sv = (k, d) => (k in S ? S[k] : (S[k] = d));
const $ = (s, p = document) => p.querySelector(s);
const SVGNS = 'http://www.w3.org/2000/svg';

/* ---------- Creación de DOM ---------- */
function H(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in (props || {})) {
    const v = props[k];
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}
function SV(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- Formato numérico estilo Python ---------- */
const fmtN = (x, d = 0) => Number(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pyF = x => (Number.isInteger(x) ? x.toFixed(1) : String(+Number(x).toFixed(10)));
const pyRound = (x, d = 0) => { const f = 10 ** d; return Math.round((x + Number.EPSILON) * f) / f; };
const num = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => String(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
const cell = v => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(+v.toFixed(4))) : esc(v ?? ''));

/* ---------- Componentes (equivalentes a st.*) ---------- */
const msg = (kind, html) => H('div', { class: 'alert ' + kind, html: md(html) });
const metric = (label, value, delta, help) =>
  H('div', { class: 'metric', title: help || '' }, H('div', { class: 'm-l' }, label), H('div', { class: 'm-v' }, value), delta ? H('div', { class: 'm-d' }, delta) : null);
const btn = (label, cb, primary) => H('button', { class: 'btn' + (primary ? ' primary' : ''), type: 'button', onclick: cb }, label);
const cols = (w, ...kids) => H('div', { class: 'cols', style: '--g:' + w.map(x => x + 'fr').join(' ') }, ...kids);
const field = (label, input) => H('label', { class: 'field' }, H('span', { class: 'f-l' }, label), input);

function wNumber(label, key, def, step, cb) {
  sv(key, def);
  const i = H('input', { type: 'number', step, value: S[key] });
  i.addEventListener('input', () => { const x = parseFloat(i.value); if (Number.isFinite(x)) { S[key] = x; cb && cb(); } });
  return field(label, i);
}
function wText(label, key, def, cb) {
  sv(key, def);
  const i = H('input', { type: 'text', value: S[key] });
  i.addEventListener('input', () => { S[key] = i.value; cb && cb(); });
  return field(label, i);
}
function wArea(label, key, def, cb) {
  sv(key, def);
  const i = H('textarea', {}, S[key]);
  i.addEventListener('input', () => { S[key] = i.value; cb && cb(); });
  return field(label, i);
}
function wSelect(label, key, opts, idx, cb) {
  sv(key, opts[idx || 0]);
  const s = H('select', {}, opts.map(o => H('option', { value: o }, o)));
  s.value = S[key];
  s.addEventListener('change', () => { S[key] = s.value; cb && cb(); });
  return field(label, s);
}
function wSlider(label, key, min, max, def, step, cb) {
  sv(key, def);
  const val = H('b', {}, S[key]);
  const i = H('input', { type: 'range', min, max, step: step || 1, value: S[key] });
  i.addEventListener('input', () => { S[key] = parseFloat(i.value); val.textContent = S[key]; cb && cb(); });
  return H('div', { class: 'field' }, H('div', { class: 'sl-top' }, H('span', {}, label), val), i);
}
function wRadio(label, key, opts, def, cb) {
  sv(key, def);
  const name = 'rd_' + key + Math.random().toString(36).slice(2, 6);
  const box = H('div', { class: 'radio' });
  opts.forEach(o => {
    const r = H('input', { type: 'radio', name, value: o });
    if (o === S[key]) r.checked = true;
    r.addEventListener('change', () => { S[key] = o; cb && cb(); });
    box.append(H('label', {}, r, H('span', {}, o)));
  });
  return H('div', { class: 'field' }, H('span', { class: 'f-l' }, label), box);
}
function wToggle(label, key, cb) {
  sv(key, false);
  const i = H('input', { type: 'checkbox' }); i.checked = S[key];
  i.addEventListener('change', () => { S[key] = i.checked; cb && cb(); });
  return H('label', { class: 'toggle' }, i, H('span', {}, label));
}

/* ---------- Tabs ---------- */
function tabs(labels) {
  const bar = H('div', { class: 'tabbar' });
  const panes = labels.map(() => H('div', { class: 'pane' }));
  const bs = labels.map((l, i) => H('button', { class: 'tab', type: 'button', onclick: () => go(i) }, l));
  const go = i => { bs.forEach((b, j) => b.classList.toggle('on', i === j)); panes.forEach((p, j) => p.classList.toggle('on', i === j)); };
  bar.append(...bs); go(0);
  return { root: H('div', {}, bar, ...panes), panes };
}

/* ---------- Tablas ---------- */
function dtable(colDefs, rows, opts = {}) {
  const t = H('table', { class: 'tbl' + (opts.onpick ? ' sel' : '') });
  t.append(H('thead', {}, H('tr', {}, colDefs.map(c => H('th', {}, c.label || c.k)))));
  const tb = H('tbody');
  rows.forEach((r, ri) => {
    const tr = H('tr', opts.onpick ? { onclick: () => opts.onpick(ri) } : {});
    if (opts.picked === ri) tr.classList.add('picked');
    colDefs.forEach(c => {
      const td = H('td', { html: cell(r[c.k]) });
      if (opts.style) { const st = opts.style(c.k, r[c.k], r); if (st) td.style.cssText = st; }
      tr.append(td);
    });
    tb.append(tr);
  });
  t.append(tb);
  return H('div', { class: 'tbl-wrap' }, t);
}
/* Editor de tabla (equivale a st.data_editor). rows se modifica en sitio. */
function editor(colDefs, rows, { dynamic = false, onchange, narrow = false } = {}) {
  const wrap = H('div', { class: 'tbl-wrap' });
  const draw = () => {
    wrap.innerHTML = '';
    const t = H('table', { class: 'tbl ed' + (narrow ? ' narrow' : '') });
    t.append(H('thead', {}, H('tr', {}, colDefs.map(c => H('th', {}, c.label || c.k)), dynamic ? H('th', {}, '') : null)));
    const tb = H('tbody');
    rows.forEach((r, ri) => {
      const tr = H('tr');
      colDefs.forEach(c => {
        const isT = c.type === 'text';
        const inp = H('input', { type: isT ? 'text' : 'number', step: c.step || 'any', value: r[c.k] ?? '' });
        inp.addEventListener('input', () => {
          r[c.k] = isT ? inp.value : (inp.value === '' ? null : parseFloat(inp.value));
          onchange && onchange();
        });
        tr.append(H('td', {}, inp));
      });
      if (dynamic) tr.append(H('td', {}, H('button', { class: 'btn mini', type: 'button', title: 'Eliminar fila', onclick: () => { rows.splice(ri, 1); draw(); onchange && onchange(); } }, '🗑')));
      tb.append(tr);
    });
    t.append(tb); wrap.append(t);
    if (dynamic) wrap.append(H('div', { style: 'padding:.4rem' }, H('button', { class: 'btn mini', type: 'button', onclick: () => {
      const n = {}; colDefs.forEach(c => { n[c.k] = c.type === 'text' ? '' : null; }); rows.push(n); draw(); onchange && onchange();
    } }, '➕ Agregar fila')));
  };
  draw();
  return wrap;
}

/* ---------- Tooltip flotante ---------- */
function showTip(ev, html) {
  const t = $('#tip'); t.innerHTML = html; t.style.display = 'block';
  const x = Math.min(ev.clientX + 14, innerWidth - t.offsetWidth - 8), y = Math.min(ev.clientY + 14, innerHeight - t.offsetHeight - 8);
  t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px';
}
const hideTip = () => { $('#tip').style.display = 'none'; };

/* ---------- Gráfico de líneas SVG (ingresos / costos) ---------- */
function niceStep(max, n) {
  const raw = max / n, p = 10 ** Math.floor(Math.log10(raw || 1)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
function lineChart(host, series, o = {}) {
  host.innerHTML = '';
  const W = 760, Hh = 420, ml = 78, mr = 18, mt = 26, mb = 50;
  const xs = series[0].x, xmin = xs[0], xmax = xs[xs.length - 1] || 1;
  let ymax = 0; series.forEach(s => s.y.forEach(v => { if (v > ymax) ymax = v; })); ymax = ymax || 1;
  const ys = niceStep(ymax, 6), ytop = Math.ceil(ymax / ys) * ys;
  const X = v => ml + (v - xmin) / ((xmax - xmin) || 1) * (W - ml - mr), Y = v => Hh - mb - v / ytop * (Hh - mt - mb);
  const svg = SV('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chart' });
  SV('rect', { x: 0, y: 0, width: W, height: Hh, fill: '#fff' }, svg);
  for (let v = 0; v <= ytop + 1e-9; v += ys) {
    SV('line', { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), stroke: '#e5e7eb' }, svg);
    SV('text', { x: ml - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#374151' }, svg).textContent = fmtN(v);
  }
  const xsStep = niceStep(xmax - xmin || 1, 8);
  for (let v = Math.ceil(xmin / xsStep) * xsStep; v <= xmax + 1e-9; v += xsStep) {
    SV('line', { x1: X(v), x2: X(v), y1: mt, y2: Hh - mb, stroke: '#f1f5f9' }, svg);
    SV('text', { x: X(v), y: Hh - mb + 16, 'text-anchor': 'middle', 'font-size': 11, fill: '#374151' }, svg).textContent = fmtN(v);
  }
  SV('line', { x1: ml, x2: ml, y1: mt, y2: Hh - mb, stroke: '#6b7280' }, svg);
  SV('line', { x1: ml, x2: W - mr, y1: Hh - mb, y2: Hh - mb, stroke: '#6b7280' }, svg);
  SV('text', { x: (ml + W - mr) / 2, y: Hh - 8, 'text-anchor': 'middle', 'font-size': 12, fill: '#374151' }, svg).textContent = o.xTitle || '';
  series.forEach(s => SV('polyline', { points: s.x.map((v, i) => X(v) + ',' + Y(s.y[i])).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 3 }, svg));
  if (o.vline != null) {
    SV('line', { x1: X(o.vline), x2: X(o.vline), y1: mt, y2: Hh - mb, stroke: 'blue', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }, svg);
    SV('text', { x: X(o.vline) + 5, y: mt + 12, 'font-size': 12, fill: 'blue' }, svg).textContent = o.vlineText || '';
  }
  series.forEach((s, i) => {
    SV('line', { x1: W - 140, x2: W - 116, y1: mt + 8 + i * 18, y2: mt + 8 + i * 18, stroke: s.color, 'stroke-width': 3 }, svg);
    SV('text', { x: W - 110, y: mt + 12 + i * 18, 'font-size': 12, fill: '#111' }, svg).textContent = s.name;
  });
  const cross = SV('line', { y1: mt, y2: Hh - mb, stroke: '#9ca3af', 'stroke-dasharray': '3 3', visibility: 'hidden' }, svg);
  const cap = SV('rect', { x: ml, y: mt, width: W - ml - mr, height: Hh - mt - mb, fill: 'transparent' }, svg);
  cap.addEventListener('mousemove', ev => {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W, v = xmin + (px - ml) / (W - ml - mr) * (xmax - xmin);
    let k = 0, best = 1e18; xs.forEach((xv, i) => { const d = Math.abs(xv - v); if (d < best) { best = d; k = i; } });
    cross.setAttribute('x1', X(xs[k])); cross.setAttribute('x2', X(xs[k])); cross.setAttribute('visibility', 'visible');
    showTip(ev, `<b>Unidades: ${fmtN(xs[k])}</b>` + series.map(s => `<br><span style="color:${s.color}">●</span> ${s.name}: $${fmtN(s.y[k], 2)}`).join(''));
  });
  cap.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); hideTip(); });
  host.append(svg);
}

/* ---------- Splash Screen (pixel-art con blocks) ---------- */
function splash() {
  return new Promise(resolve => {
    const fuente = {
      A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
      L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
      P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
      H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
      B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
      O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
      C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
      K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
      S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110']
    };
    const palabra = 'ALPHA BLOCKS';
    let columna = 0; const celdas = [];
    for (const letra of palabra) {
      if (letra === ' ') { columna += 3; continue; }
      fuente[letra].forEach((fila, r) => [...fila].forEach((bit, c) => { if (bit === '1') celdas.push([columna + c, r]); }));
      columna += 6;
    }
    const totalCols = Math.max(...celdas.map(c => c[0])) + 1;
    const ancho = innerWidth < 700 ? innerWidth * 0.92 : innerWidth * 0.75;
    const cs = Math.max(3, (ancho - 2 * (totalCols - 1)) / totalCols);
    const word = H('div', { class: 'abword', style: `grid-template-columns:repeat(${totalCols},${cs}px);grid-template-rows:repeat(7,${cs}px)` });
    celdas.forEach(([c, r]) => word.append(H('i', { class: 'abk', style: `grid-column:${c + 1};grid-row:${r + 1};animation-delay:${((c / Math.max(totalCols - 1, 1)) * 2.6 + r * 0.01).toFixed(3)}s` })));
    const box = H('div', { class: 'absplash' }, word, H('div', { class: 'absub' }, 'Equipo Cacahuate'));
    $('#splash').append(box);
    setTimeout(() => { box.style.opacity = 0; setTimeout(() => { box.remove(); resolve(); }, 400); }, 5000);
  });
}
/* =========================================================
   Generador PDF mínimo (sustituye a FPDF): A4, Helvetica, celdas
   ========================================================= */
const HW = {
  r: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
  b: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]
};
class MiniPDF {
  constructor() {
    this.W = 210; this.Hh = 297; this.lm = 10; this.tm = 10; this.rm = 10; this.bm = 15; this.k = 72 / 25.4;
    this.pages = []; this.x = 10; this.y = 10; this.style = ''; this.size = 12; this.tc = [0, 0, 0]; this.fc = [255, 255, 255];
    this.auto = true; this.inFooter = false;
  }
  header() {} footer() {}
  pageNo() { return this.pages.length; }
  setAutoPageBreak(auto, margin) { this.auto = auto; this.bm = margin; }
  setFont(_f, style, size) { this.style = style || ''; if (size) this.size = size; }
  setTextColor(r, g, b) { this.tc = [r, g, b]; }
  setFillColor(r, g, b) { this.fc = [r, g, b]; }
  setY(y) { this.y = y < 0 ? this.Hh + y : y; this.x = this.lm; }
  ln(h) { this.x = this.lm; this.y += h; }
  addPage() {
    const keep = { s: this.style, z: this.size, t: this.tc.slice(), f: this.fc.slice() };
    if (this.pages.length) { this.inFooter = true; this.footer(); this.inFooter = false; }
    this.pages.push(''); this.x = this.lm; this.y = this.tm;
    this.header();
    this.style = keep.s; this.size = keep.z; this.tc = keep.t; this.fc = keep.f;
    this.x = this.lm;
  }
  strW(t) {
    const tab = this.style === 'B' ? HW.b : HW.r; let w = 0;
    for (const ch of t) { const c = ch.charCodeAt(0); w += (c >= 32 && c <= 126) ? tab[c - 32] : 556; }
    return w / 1000 * this.size / this.k;
  }
  cell(w, h = 0, txt = '', border = 0, ln = 0, align = 'L', fill = false) {
    const k = this.k, f = n => (+n.toFixed(2));
    if (!this.inFooter && this.auto && this.y + h > this.Hh - this.bm) { const x = this.x; this.addPage(); this.x = x; }
    if (w === 0) w = this.W - this.rm - this.x;
    let s = '';
    const rg = c => c.map(v => f(v / 255)).join(' ');
    if (fill) s += `q ${rg(this.fc)} rg ${f(this.x * k)} ${f((this.Hh - (this.y + h)) * k)} ${f(w * k)} ${f(h * k)} re f Q\n`;
    if (border) s += `q 0 0 0 RG 0.57 w ${f(this.x * k)} ${f((this.Hh - (this.y + h)) * k)} ${f(w * k)} ${f(h * k)} re S Q\n`;
    if (txt !== '') {
      const tw = this.strW(txt);
      const dx = align === 'C' ? (w - tw) / 2 : align === 'R' ? w - 1 - tw : 1;
      const base = this.y + 0.5 * h + 0.3 * (this.size / k);
      const F = this.style === 'B' ? 'F2' : this.style === 'I' ? 'F3' : 'F1';
      const t = String(txt).replace(/[\\()]/g, '\\$&');
      s += `q ${rg(this.tc)} rg BT /${F} ${this.size} Tf ${f((this.x + dx) * k)} ${f((this.Hh - base) * k)} Td (${t}) Tj ET Q\n`;
    }
    this.pages[this.pages.length - 1] += s;
    if (ln > 0) { this.y += h; if (ln === 1) this.x = this.lm; } else this.x += w;
  }
  output() {
    this.inFooter = true; this.footer(); this.inFooter = false;
    const n = this.pages.length, offs = []; let pdf = '%PDF-1.3\n';
    const add = (id, body) => { offs[id] = pdf.length; pdf += `${id} 0 obj\n${body}\nendobj\n`; };
    add(1, '<</Type /Catalog /Pages 2 0 R>>');
    add(2, `<</Type /Pages /Kids [${this.pages.map((_, i) => (6 + 2 * i) + ' 0 R').join(' ')}] /Count ${n}>>`);
    add(3, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>');
    add(4, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>');
    add(5, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding>>');
    this.pages.forEach((c, i) => {
      add(6 + 2 * i, `<</Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources <</Font <</F1 3 0 R /F2 4 0 R /F3 5 0 R>>>> /Contents ${7 + 2 * i} 0 R>>`);
      add(7 + 2 * i, `<</Length ${c.length}>>\nstream\n${c}endstream`);
    });
    const total = 6 + 2 * n, xo = pdf.length;
    pdf += `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let id = 1; id < total; id++) pdf += String(offs[id]).padStart(10, '0') + ' 00000 n \n';
    pdf += `trailer\n<</Size ${total} /Root 1 0 R>>\nstartxref\n${xo}\n%%EOF`;
    const u = new Uint8Array(pdf.length); for (let i = 0; i < pdf.length; i++) u[i] = pdf.charCodeAt(i) & 255;
    return u;
  }
}
class PDFReport extends MiniPDF {
  header() {
    this.setFont('helvetica', 'B', 12); this.setTextColor(31, 78, 121);
    this.cell(0, 8, 'REPORTE TECNICO Y EJECUTIVO - SHA', 0, 1, 'C');
    this.setFont('helvetica', 'I', 9);
    this.cell(0, 6, "Planta de Bloques de Concreto 'Cacahuate'", 0, 1, 'C');
    this.ln(2);
  }
  footer() {
    this.setY(-15); this.setFont('helvetica', 'I', 8);
    this.cell(0, 10, `Pagina ${this.pageNo()}`, 0, 0, 'C');
  }
}
/* textwrap.wrap equivalente */
function wrapTxt(s, width) {
  const words = s.split(/\s+/).filter(Boolean), out = []; let cur = '';
  for (let w of words) {
    while (w.length > width) { if (cur) { out.push(cur); cur = ''; } out.push(w.slice(0, width)); w = w.slice(width); }
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= width) cur += ' ' + w; else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}
/* =========================================================
   MÓDULO 1 · SIMULADOR COMPLETO SHA (Reporte PDF)
   ========================================================= */
const LETRAS = ['A', 'E', 'I', 'O', 'U'];
const VALOR_LETRA = { A: 4, E: 3, I: 2, O: 1, U: 0 };
const prioMuther = acum => (acum <= 0.15 ? 'A' : acum <= 0.35 ? 'E' : acum <= 0.65 ? 'I' : acum <= 0.90 ? 'O' : 'U');

const FLUJOS_BASE = () => [
  { origen: '13. Almacén de Arena', destino: '09. Nave / Mezcladora', intensidad_flujo: 11.5, distancia: 35.0 },
  { origen: '14. Almacén de Grava', destino: '09. Nave / Mezcladora', intensidad_flujo: 7.5, distancia: 28.0 },
  { origen: '15. Almacén de Cemento', destino: '09. Nave / Mezcladora', intensidad_flujo: 2.3, distancia: 32.0 },
  { origen: '09. Nave / Mezcladora', destino: '09b. Máquina QT4-16', intensidad_flujo: 23.0, distancia: 8.0 },
  { origen: '09b. Máquina QT4-16', destino: '09a. Fraguado Bajo Techo', intensidad_flujo: 22.8, distancia: 10.0 },
  { origen: '09a. Fraguado Bajo Techo', destino: '07. Curado y Secado al Sol', intensidad_flujo: 22.8, distancia: 18.0 },
  { origen: '07. Curado y Secado al Sol', destino: '08. Producto No Conforme', intensidad_flujo: 0.5, distancia: 15.0 },
  { origen: '07. Curado y Secado al Sol', destino: '06. Producto Terminado', intensidad_flujo: 22.3, distancia: 30.0 },
  { origen: '06. Producto Terminado', destino: '16. Despacho a Camiones', intensidad_flujo: 22.3, distancia: 20.0 }
];
const REL_BASE = () => [
  { 'Departamento 1': 'Almacenes', 'Departamento 2': 'Nave / QT4-16', 'Grado Cercanía': 'A', Motivo: 'Flujo pesado' },
  { 'Departamento 1': 'Nave / QT4-16', 'Departamento 2': 'Área de Fraguado', 'Grado Cercanía': 'A', Motivo: 'Bloque fresco' },
  { 'Departamento 1': 'Área de Curado', 'Departamento 2': 'Producto Terminado', 'Grado Cercanía': 'A', Motivo: 'Transición continua' },
  { 'Departamento 1': 'Nave / QT4-16', 'Departamento 2': 'Oficinas y Servicios', 'Grado Cercanía': 'X', Motivo: 'Norma STPS-011' },
  { 'Departamento 1': 'Almacén de EPP', 'Departamento 2': 'Nave / QT4-16', 'Grado Cercanía': 'E', Motivo: 'Entrega de EPP' },
  { 'Departamento 1': 'Almacén de EPP', 'Departamento 2': 'Almacenes', 'Grado Cercanía': 'I', Motivo: 'Acceso a EPP' },
  { 'Departamento 1': 'Almacén de Montacargas', 'Departamento 2': 'Producto Terminado', 'Grado Cercanía': 'A', Motivo: 'Traslado de tarimas' },
  { 'Departamento 1': 'Almacén de Montacargas', 'Departamento 2': 'Área de Curado', 'Grado Cercanía': 'E', Motivo: 'Traslado de tarimas' },
  { 'Departamento 1': 'Laboratorio', 'Departamento 2': 'Área de Curado', 'Grado Cercanía': 'E', Motivo: 'Muestreo de calidad' }
];
const DI_BASE = () => [
  { Movimiento: 'Almacenes -> Máquina', 'Intensidad (t)': 21.3, 'Distancia (m)': 35.0 },
  { Movimiento: 'QT4-16 -> Fraguado', 'Intensidad (t)': 22.8, 'Distancia (m)': 10.0 }
];
const PERT_ACTS = [
  { id: 'A', nombre: 'A. Terreno', dur: 3, pred: [] }, { id: 'B', nombre: 'B. Cimentación', dur: 2, pred: ['A'] },
  { id: 'C', nombre: 'C. Construcción', dur: 4, pred: ['A'] }, { id: 'D', nombre: 'D. Montaje', dur: 2, pred: ['B', 'C'] }
];
/* Ruta crítica (CPM): pasada hacia adelante y hacia atrás */
function cpm(acts) {
  const es = {}, ef = {}, ls = {}, lf = {};
  acts.forEach(a => { es[a.id] = Math.max(0, ...a.pred.map(p => ef[p])); ef[a.id] = es[a.id] + a.dur; });
  const T = Math.max(...Object.values(ef));
  [...acts].reverse().forEach(a => {
    const suc = acts.filter(b => b.pred.includes(a.id));
    lf[a.id] = suc.length ? Math.min(...suc.map(b => ls[b.id])) : T; ls[a.id] = lf[a.id] - a.dur;
  });
  return { es, ef, ls, lf, T, crit: acts.filter(a => Math.abs(ls[a.id] - es[a.id]) < 1e-9).map(a => a.id) };
}
const prodDiaria = cb => Math.trunc((((420 - 6.9361) / cb) + 1) * 5);

function appSha2(root) {
  root.append(H('p', { html: '<b>Diseño de Instalaciones | Análisis de Flujo y Manejo de Materiales</b>' }),
    H('p', { class: 'caption' }, 'Caso de Estudio: Terreno de 141.5 × 26 m (3,679 m²), producción con máquina QT4-16, y patios de curado al sol.'));
  const T = tabs(['1. P-Q-R-S-T & 7 R', '2. Flujo y T.W. Ampliado', '3. Selección de Equipos', '4. Matriz de Relaciones', '5. Espacio y Pasillos',
    '6. Gráfico D × I Extendido', '7. Evaluación Multicriterio', '8. KPIs Industriales & PERT', '9. Finanzas & What-If', '🗂️ Datos del Reporte', '📄 Reporteador Ejecutivo (PDF)']);
  root.append(T.root);
  const [t1, t2, t3, t4, t5, t6, t7, t8, t10, tD, t9] = T.panes;

  /* ---------- Bloque 1 ---------- */
  const succ = H('div');
  const upd1 = () => {
    const d = prodDiaria(S.cb_sha), m = d * 26; S.produccion_mensual = m;
    succ.replaceChildren(msg('success', `**Producción Proyectada:** ${fmtN(m)} bloques/mes (${fmtN(d)} bloques/día | Aprox. ${pyF(pyRound(d * 13.2 / 1000, 1))} t/día)`));
  };
  t1.append(H('h2', {}, 'Bloque 1: Caracterización P-Q-R-S-T - Bloques Cacahuate'),
    cols([1, 1],
      H('div', {},
        wText('P - Producto / Materiales', 'p_sha', 'Bloque hueco de concreto 15x20x40 cm (13.2 kg), Arena, Grava, Cemento'),
        wArea('R - Recorrido / Ruta Básica', 'r_sha', 'Almacenes MP -> Bandas Transportadoras -> Tolva/Mezclado -> Vibroprensa QT4-16 -> Fraguado -> Curado al sol -> Almacén PT -> Despacho'),
        wSelect('Diseño de Unidad de Carga y Estibado', 'uc_sha', ['Tarima Estandarizada (Bloques curados apilados - Máx 1.8 a 2.0 m)', 'A granel (Arena y Grava en Tolvas/Minicargador)', 'Sacos de Cemento sobre Tarimas'], 0)),
      H('div', {},
        wSlider('Tiempo de espera de mezcla (Cuello de botella en min)', 'cb_sha', 0.5, 2.5, 1.20, 0.05, upd1), succ,
        wText('T - Tiempo / Frecuencia', 't_sha', 'Jornada de 7 horas, 26 días/mes. Ciclo: 6.93 min'),
        wSelect('Tecnología de Control de Inventario (S)', 's_sha', ['Control visual y registro manual (Bitácoras de producción)', 'Etiquetas de código de barras en tarimas PT', 'Sistema ERP con Terminales Portátiles'], 0))),
    wText('S - Servicios de Apoyo', 'sup_sha', 'Bandas transportadoras (35m, 28m, 32m), Montacargas (2.5-3t), Minicargador, Cisterna'));
  upd1();

  /* ---------- Bloque 2 ---------- */
  S.rows_flujos = S.rows_flujos || FLUJOS_BASE();
  const res2 = H('div');
  t2.append(H('h2', {}, 'Bloque 2: Mapeo de Flujos y Trabajo de Transporte Detallado (T.W.)'),
    editor([{ k: 'origen', type: 'text' }, { k: 'destino', type: 'text' }, { k: 'intensidad_flujo', type: 'num' }, { k: 'distancia', type: 'num' }], S.rows_flujos, { dynamic: true }),
    btn('🚀 Calcular Trabajo de Transporte y Prioridades', () => {
      res2.innerHTML = '';
      if (!S.rows_flujos.length) return;
      let total = 0; const out = [];
      S.rows_flujos.forEach(r => {
        const i = num(r.intensidad_flujo), d = num(r.distancia), tw = i * d; total += tw;
        out.push({ Origen: r.origen, Destino: r.destino, 'Intensidad (I)': i, 'Distancia (D)': d, 'T.W.': tw });
      });
      out.sort((a, b) => b['T.W.'] - a['T.W.']);
      let acum = 0;
      out.forEach(r => { const prop = total > 0 ? r['T.W.'] / total : 0; acum += prop; r['Prioridad Muther'] = prioMuther(acum); r['% del Total'] = pyRound(prop * 100, 2); });
      S.df_flujos_resultado = out; S.trabajo_total_val = total;
      res2.append(msg('success', '¡Análisis de Trabajo de Transporte en la Bloquera completado!'),
        metric('Trabajo de Transporte Total (T.W.)', `${fmtN(total, 2)} U-m (Toneladas x Metro)`),
        dtable(['Origen', 'Destino', 'Intensidad (I)', 'Distancia (D)', 'T.W.', 'Prioridad Muther', '% del Total'].map(k => ({ k })), out));
    }, true), res2);

  /* ---------- Bloque 3 ---------- */
  const res3 = H('div');
  const opcionCol = (tit, L, d) => H('div', {}, H('p', { html: `<b>${tit}</b>` }),
    wNumber(`Inversión Inicial ${L} ($)`, 'inv' + L.toLowerCase() + '_sha', d[0], d[4]), wNumber(`Costo Fijo / Op. Anual ${L} ($)`, 'cf' + L.toLowerCase() + '_sha', d[1], d[5]),
    wNumber(`Costo Var. ${L} ($/T.W.)`, 'cv' + L.toLowerCase() + '_sha', d[2], d[6]), wNumber(`Ahorro Anual Base ${L} ($)`, 'ah' + L.toLowerCase() + '_sha', d[3], d[7]));
  t3.append(H('h2', {}, 'Bloque 3: Selección de Equipo de Acarreo y Retorno de Inversión'),
    cols([1, 1, 1],
      opcionCol('Opción A (Carretillas / Mano de Obra)', 'A', [25000.0, 584000.0, 1.2, 150000.0, 1000.0, 5000.0, 0.1, 5000.0]),
      opcionCol('Opción B (Minicargador + Montacargas)', 'B', [450000.0, 219000.0, 0.45, 180000.0, 10000.0, 5000.0, 0.05, 5000.0]),
      opcionCol('Opción C (Bandas y Sistema Mixto)', 'C', [733459.0, 91400.0, 0.12, 250000.0, 5000.0, 1000.0, 0.01, 5000.0])),
    wNumber('Volumen Total Estimado de T.W. Anual', 'vol_sha', 220000.0, 5000.0),
    btn('📊 Calcular Costos y Periodo de Recuperación Realista', () => {
      const g = k => S[k];
      const costo = (cf, cv) => cf + cv * g('vol_sha'), pb = (inv, ah) => (ah > 0 ? inv / ah : 99.0);
      const pa = pb(g('inva_sha'), g('aha_sha')), pbb = pb(g('invb_sha'), g('ahb_sha')), pc = pb(g('invc_sha'), g('ahc_sha'));
      const rows = [
        { Alternativa: 'Opción A (Manual / Carretillas)', 'Inversión ($)': g('inva_sha'), 'Costo Op. Anual ($)': costo(g('cfa_sha'), g('cva_sha')), Payback: `${pyF(pyRound(pa * 52, 1))} Semanas` },
        { Alternativa: 'Opción B (Minicargador/Combustión)', 'Inversión ($)': g('invb_sha'), 'Costo Op. Anual ($)': costo(g('cfb_sha'), g('cvb_sha')), Payback: `${pyF(pyRound(pbb, 2))} Años` },
        { Alternativa: 'Opción C (Bandas y Sistema Mixto)', 'Inversión ($)': g('invc_sha'), 'Costo Op. Anual ($)': costo(g('cfc_sha'), g('cvc_sha')), Payback: `${pyF(pyRound(pc, 2))} Años` }
      ];
      S.df_costos_resultado = rows; res3.innerHTML = '';
      res3.append(dtable(['Alternativa', 'Inversión ($)', 'Costo Op. Anual ($)', 'Payback'].map(k => ({ k })), rows));
    }), res3);

  /* ---------- Bloque 4 ---------- */
  S.rows_rel = S.rows_rel || REL_BASE();
  const res4 = H('div');
  t4.append(H('h2', {}, 'Bloque 4: Matriz de Relaciones Extendida (Cacahuate)'),
    editor(['Departamento 1', 'Departamento 2', 'Grado Cercanía', 'Motivo'].map(k => ({ k, type: 'text' })), S.rows_rel, { dynamic: true }),
    btn('🔍 Evaluar Matriz de Relaciones', () => { S.df_relaciones_resultado = S.rows_rel.map(r => ({ ...r })); res4.replaceChildren(msg('success', '¡Procesada!')); }), res4);

  /* ---------- Bloque 5 ---------- */
  const res5 = H('div');
  t5.append(H('h2', {}, 'Bloque 5: Dimensionamiento de Carriles y Pasillos'),
    cols([1, 1],
      H('div', {}, wNumber('Ancho del vehículo de diseño (m)', 'ac_sha', 2.60, 0.10), wNumber('Holgura lateral de seguridad (m)', 'ma_sha', 0.95, 0.05)),
      H('div', {}, wSelect('Equipo', 'te_sha', ['Camión Torton Pesado', 'Montacargas 3 Toneladas', 'Tránsito Peatonal'], 0), wSelect('Vía', 'nv_sha', ['Vía única', 'Doble vía'], 0))),
    btn('📐 Calcular Ancho de Carril/Pasillo', () => {
      const factor = S.te_sha.includes('Peatonal') ? 0.4 : (S.te_sha.includes('Montacargas') ? 0.8 : 0.0);
      const ancho = (S.ac_sha * (S.nv_sha.includes('Doble') ? 2 : 1)) + (S.ma_sha * 2) + factor;
      res5.replaceChildren(metric('Ancho Mínimo de Carril Recomendado', `${ancho.toFixed(2)} m`));
    }), res5);

  /* ---------- Bloque 6 ---------- */
  S.rows_di = S.rows_di || DI_BASE();
  const res6 = H('div');
  t6.append(H('h2', {}, 'Bloque 6: Gráfico Distancia - Intensidad (D × I)'),
    editor([{ k: 'Movimiento', type: 'text' }, { k: 'Intensidad (t)', type: 'num' }, { k: 'Distancia (m)', type: 'num' }], S.rows_di, { dynamic: true }),
    btn('📈 Generar Clasificación', () => { res6.replaceChildren(dtable(['Movimiento', 'Intensidad (t)', 'Distancia (m)'].map(k => ({ k })), S.rows_di)); }), res6);

  /* ---------- Bloque 7 ---------- */
  const res7 = H('div');
  const planCol = (tit, L, idx) => H('div', {}, H('p', { html: `<b>${tit}</b>` }),
    wSelect(`Costo (${L})`, 'c' + L.toLowerCase() + '1_sha', LETRAS, idx[0]), wSelect(`Espacio (${L})`, 'e' + L.toLowerCase() + '1_sha', LETRAS, idx[1]),
    wSelect(`Mantenimiento (${L})`, 'f' + L.toLowerCase() + '1_sha', LETRAS, idx[2]), wSelect(`Seguridad (${L})`, 's' + L.toLowerCase() + '1_sha', LETRAS, idx[3]));
  t7.append(H('h2', {}, 'Bloque 7: Matriz de Ponderación de Factores (Muther)'),
    cols([1, 1, 1, 1], wNumber('Costo / Inversión (%)', 'p1_sha', 40, 5), wNumber('Uso de Espacio (%)', 'p2_sha', 20, 5), wNumber('Mantenimiento (%)', 'p3_sha', 20, 5), wNumber('Seguridad STPS (%)', 'p4_sha', 20, 5)),
    H('h3', {}, 'Calificación Cualitativa por Plan'),
    cols([1, 1, 1], planCol('Opción A (Manual)', 'A', [0, 2, 0, 4]), planCol('Opción B (Minicargador)', 'B', [2, 1, 2, 2]), planCol('Opción C (Bandas)', 'C', [4, 0, 1, 0])),
    btn('🏁 Calcular Puntuación Global', () => {
      const sc = L => (VALOR_LETRA[S['c' + L + '1_sha']] * S.p1_sha + VALOR_LETRA[S['e' + L + '1_sha']] * S.p2_sha + VALOR_LETRA[S['f' + L + '1_sha']] * S.p3_sha + VALOR_LETRA[S['s' + L + '1_sha']] * S.p4_sha) / 100;
      const rows = ['a', 'b', 'c'].map(L => ({ Sistema: 'Opción ' + L.toUpperCase(), Puntuación: pyRound(sc(L), 2) }));
      S.df_eval_multicriterio = rows; res7.replaceChildren(dtable([{ k: 'Sistema' }, { k: 'Puntuación' }], rows));
    }), res7);

  /* ---------- Bloque 8 ---------- */
  const res8 = H('div'), cp = cpm(PERT_ACTS);
  t8.append(H('h2', {}, 'Bloque 8: Indicadores Clave (KPIs) y Red PERT'),
    cols([1, 1],
      H('div', {}, H('h3', {}, '1. Tablero de KPIs'),
        wNumber('Bloques/año', 'u_sha', 538824.0, 5000.0), wNumber('Costo operativo ($)', 'ct_sha', 691436.0, 10000.0), wNumber('Horas disponibles', 'hd_sha', 2184.0, 100.0),
        wNumber('Horas reales', 'hr_sha', 2010.0, 50.0), wNumber('Mermas/año', 'dl_sha', 10500.0, 100.0),
        btn('📊 Calcular KPIs', () => {
          const u = S.u_sha, cpu = u > 0 ? S.ct_sha / u : 0, ut = S.hd_sha > 0 ? (S.hr_sha / S.hd_sha) * 100 : 0, pd = u > 0 ? (S.dl_sha / u) * 100 : 0;
          res8.replaceChildren(H('div', { class: 'mrow' }, metric('Costo Promedio / Bloque', `$${cpu.toFixed(2)}`), metric('% Utilización', `${ut.toFixed(1)}%`), metric('Mermas', `${pd.toFixed(2)}%`), metric('Eq. Mensual', '13,755 bloques')));
        }), res8),
      H('div', {}, H('h3', {}, '2. Cronograma PERT'),
        dtable(['Actividad', 'Duración', 'Pred.'].map(k => ({ k })), PERT_ACTS.map(a => ({ Actividad: a.nombre, Duración: a.dur, 'Pred.': a.pred.length ? a.pred.join(', ') : '-' }))),
        msg('info', `⏱️ **Duración total:** ${cp.T} unidades de tiempo · 🔴 **Ruta crítica:** ${cp.crit.join(' → ')}`))));

  /* ---------- Bloque 9 (Finanzas) ---------- */
  const mets = H('div'), chart = H('div', { class: 'sheet' });
  const upd10 = () => {
    const cvA = S.cv_whatif_sha * (1 + S.vcv_sha / 100), pvA = S.pv_whatif_sha * (1 + S.vp_sha / 100), mc = pvA - cvA;
    let peU = 0, peP = 0; if (mc > 0) { peU = S.cf_whatif_sha / mc; peP = peU * pvA; }
    mets.replaceChildren(metric('Punto Equilibrio (U)', `${fmtN(Math.trunc(peU))} bloques`), metric('Punto Equilibrio ($)', `$${fmtN(peP, 2)}`));
    const prod = S.produccion_mensual ?? 44902, rango = []; for (let u = 0; u < Math.trunc(prod * 1.2); u += 2000) rango.push(u);
    lineChart(chart, [
      { name: 'Ingresos', color: 'green', x: rango, y: rango.map(u => u * pvA) },
      { name: 'Costos', color: 'red', x: rango, y: rango.map(u => S.cf_whatif_sha + u * cvA) }
    ], { xTitle: 'Unidades', vline: (peU > 0 && peU < rango[rango.length - 1]) ? peU : null, vlineText: 'Punto Equilibrio' });
  };
  t10.append(H('h2', {}, 'Bloque 9: Finanzas, Punto de Equilibrio y What-If'),
    cols([1, 2],
      H('div', {}, wNumber('Costos Fijos ($)', 'cf_whatif_sha', 144835.17, 1000.0, upd10), wNumber('Costo Variable ($)', 'cv_whatif_sha', 10.47, 0.50, upd10), wNumber('Precio Venta ($)', 'pv_whatif_sha', 21.00, 1.00, upd10),
        wSlider('Incremento CV %', 'vcv_sha', -20, 50, 0, 1, upd10), wSlider('Ajuste Precio %', 'vp_sha', -20, 50, 0, 1, upd10), mets),
      chart));
  upd10();
  T.root.querySelectorAll('.tab')[8].addEventListener('click', upd10);

  /* ---------- Datos del Reporte ---------- */
  appDatosReporte(tD);

  /* ---------- Reporteador PDF ---------- */
  t9.append(H('h2', {}, '📄 Generador de Reporte Ejecutivo en PDF'),
    H('p', { class: 'caption' }, 'El reporte incluye un resumen de cada ejercicio (Bloques 1 al 9) con los valores que tengas capturados.'),
    btn('💾 Descargar Reporte Completo en PDF', () => {
      const bytes = (typeof generarReporteCompleto === 'function' ? generarReporteCompleto() : generarPdfSha()), url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = H('a', { href: url, download: 'Reporte_SHA_Bloquera_Cacahuate.pdf' }); document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, true));
}

/* ---------- Generación del reporte (equivale a generar_pdf_sha) ---------- */
const _t = x => {
  let s = String(x);
  for (const [a, b] of [['→', '->'], ['–', '-'], ['—', '-'], ['≈', '~'], ['≥', '>='], ['≤', '<='], ['’', "'"], ['“', '"'], ['”', '"']]) s = s.split(a).join(b);
  return [...s].map(c => (c.charCodeAt(0) > 255 ? '?' : c)).join('');
};
const _ss = (k, d) => (k in S ? S[k] : d);
function _seccion(pdf, titulo) {
  pdf.ln(3); pdf.setFont('helvetica', 'B', 10); pdf.setTextColor(31, 78, 121);
  pdf.cell(0, 6, _t(titulo), 0, 1, 'L'); pdf.setFont('helvetica', '', 8); pdf.setTextColor(0, 0, 0);
}
function _linea(pdf, texto, negrita = false) {
  pdf.setFont('helvetica', negrita ? 'B' : '', 8);
  const fr = wrapTxt(_t(texto), 105); (fr.length ? fr : ['']).forEach(f => pdf.cell(0, 4, f, 0, 1, 'L'));
  pdf.setFont('helvetica', '', 8);
}
function _tabla(pdf, rows, columnas, anchos, enc) {
  pdf.setFont('helvetica', 'B', 7); pdf.setFillColor(220, 230, 241);
  columnas.forEach((c, i) => pdf.cell(anchos[i], 5, _t((enc || columnas)[i]).slice(0, Math.trunc(anchos[i] / 1.5)), 1, 0, 'C', true));
  pdf.ln(5); pdf.setFont('helvetica', '', 7);
  rows.forEach(f => { columnas.forEach((c, i) => { const v = f[c]; pdf.cell(anchos[i], 5, _t(typeof v === 'number' ? fmtN(v, 2) : String(v ?? '')).slice(0, Math.trunc(anchos[i] / 1.4)), 1, 0, 'L'); }); pdf.ln(5); });
  pdf.setFont('helvetica', '', 8);
}
function generarPdfSha() {
  const pdf = new PDFReport(); pdf.setAutoPageBreak(true, 15); pdf.addPage(); pdf.setTextColor(0, 0, 0);

  /* Bloque 1 */
  _seccion(pdf, 'Bloque 1. Caracterizacion P-Q-R-S-T');
  const cb = num(_ss('cb_sha', 1.20), 1.20) || 1.20, prodD = prodDiaria(cb), prodM = prodD * 26;
  _linea(pdf, `- P (Producto): ${_ss('p_sha', 'Bloque hueco de concreto 15x20x40 cm')}`);
  _linea(pdf, `- R (Recorrido): ${_ss('r_sha', '')}`);
  _linea(pdf, `- Unidad de carga: ${_ss('uc_sha', '')}`);
  _linea(pdf, `- T (Tiempo): ${_ss('t_sha', '')}`);
  _linea(pdf, `- S (Servicios): ${_ss('sup_sha', '')} | Control de inventario: ${_ss('s_sha', '')}`);
  _linea(pdf, `- Cuello de botella (espera de mezcla): ${cb.toFixed(2)} min`);
  _linea(pdf, `- Produccion proyectada: ${fmtN(prodD)} bloques/dia | ${fmtN(prodM)} bloques/mes (26 dias) | ${pyF(pyRound(prodD * 13.2 / 1000, 1))} t/dia`);

  /* Bloque 2 */
  _seccion(pdf, 'Bloque 2. Mapeo de flujos y Trabajo de Transporte (T.W.)');
  const df2 = (S.rows_flujos || FLUJOS_BASE()), f2 = []; let totalTw = 0;
  df2.forEach(r => { const i = num(r.intensidad_flujo), d = num(r.distancia); totalTw += i * d; f2.push({ Origen: r.origen ?? '', Destino: r.destino ?? '', I: i, D: d, TW: i * d }); });
  if (f2.length) {
    f2.sort((a, b) => b.TW - a.TW);
    let acum = 0; f2.forEach(r => { const prop = totalTw > 0 ? r.TW / totalTw : 0; acum += prop; r['Prior.'] = prioMuther(acum); r['%'] = pyRound(prop * 100, 2); });
    _tabla(pdf, f2, ['Origen', 'Destino', 'I', 'D', 'TW', 'Prior.', '%'], [48, 48, 14, 14, 20, 14, 14], ['Origen', 'Destino', 'I (t)', 'D (m)', 'T.W.', 'Prior.', '% Total']);
    _linea(pdf, `- Trabajo de Transporte total: ${fmtN(totalTw, 2)} t x m. Mayor carga: ${f2[0].Origen} -> ${f2[0].Destino} (${pyF(f2[0]['%'])}%).`);
  } else _linea(pdf, '- Sin rutas capturadas.');

  /* Bloque 3 */
  _seccion(pdf, 'Bloque 3. Seleccion de equipo de acarreo y retorno de inversion');
  const vol = num(_ss('vol_sha', 220000.0));
  const ops = [
    ['Opcion A (Manual / Carretillas)', num(_ss('inva_sha', 25000.0)), num(_ss('cfa_sha', 584000.0)), num(_ss('cva_sha', 1.2)), num(_ss('aha_sha', 150000.0))],
    ['Opcion B (Minicargador + Montacargas)', num(_ss('invb_sha', 450000.0)), num(_ss('cfb_sha', 219000.0)), num(_ss('cvb_sha', 0.45)), num(_ss('ahb_sha', 180000.0))],
    ['Opcion C (Bandas y Sistema Mixto)', num(_ss('invc_sha', 733459.0)), num(_ss('cfc_sha', 91400.0)), num(_ss('cvc_sha', 0.12)), num(_ss('ahc_sha', 250000.0))]
  ];
  const f3 = ops.map(([nom, inv, cf, cv, ah]) => {
    const costo = cf + cv * vol, pb = ah > 0 ? inv / ah : 99.0;
    return { Alternativa: nom, Inversion: inv, Costo: costo, Payback: nom.startsWith('Opcion A') ? `${pyF(pyRound(pb * 52, 1))} semanas` : `${pyF(pyRound(pb, 2))} anos`, _pb: pb };
  });
  _tabla(pdf, f3, ['Alternativa', 'Inversion', 'Costo', 'Payback'], [74, 34, 40, 34], ['Alternativa', 'Inversion ($)', 'Costo op. anual ($)', 'Recuperacion']);
  const minC = f3.reduce((a, b) => (b.Costo < a.Costo ? b : a)), minP = f3.reduce((a, b) => (b._pb < a._pb ? b : a));
  _linea(pdf, `- Volumen de T.W. anual considerado: ${fmtN(vol)}.`);
  _linea(pdf, `- Menor costo operativo anual: ${minC.Alternativa} ($${fmtN(minC.Costo, 2)}).`);
  _linea(pdf, `- Recuperacion mas rapida de la inversion: ${minP.Alternativa}.`);

  /* Bloque 4 */
  _seccion(pdf, 'Bloque 4. Matriz de relaciones');
  const cols4 = ['Departamento 1', 'Departamento 2', 'Grado Cercanía', 'Motivo'], df4 = (S.rows_rel || REL_BASE()).map(r => { const o = {}; cols4.forEach(c => { o[c] = r[c] ?? ''; }); return o; });
  if (df4.length) {
    _tabla(pdf, df4, cols4, [48, 48, 24, 60], ['Departamento 1', 'Departamento 2', 'Grado', 'Motivo']);
    const conteo = {}; df4.forEach(r => { const g = String(r['Grado Cercanía']).toUpperCase(); conteo[g] = (conteo[g] || 0) + 1; });
    _linea(pdf, '- Resumen por grado: ' + Object.keys(conteo).sort().map(k => `${k}: ${conteo[k]}`).join(', ') + '.');
    if ('X' in conteo) _linea(pdf, '- Las relaciones X exigen separar fisicamente las areas por ruido y polvo (NOM-011-STPS-2001 y NOM-010-STPS-2014).');
  } else _linea(pdf, '- Sin relaciones capturadas.');

  /* Bloque 5 */
  _seccion(pdf, 'Bloque 5. Dimensionamiento de carriles y pasillos');
  const anchoV = num(_ss('ac_sha', 2.60), 2.60), margenV = num(_ss('ma_sha', 0.95), 0.95), equipoV = String(_ss('te_sha', 'Camion Torton Pesado')), viasV = String(_ss('nv_sha', 'Via unica'));
  const factorV = equipoV.includes('Peatonal') ? 0.4 : (equipoV.includes('Montacargas') ? 0.8 : 0.0);
  const anchoP = (anchoV * (viasV.includes('Doble') ? 2 : 1)) + (margenV * 2) + factorV;
  _linea(pdf, `- Equipo: ${equipoV} | ${viasV}`);
  _linea(pdf, `- Ancho del vehiculo de diseno: ${anchoV.toFixed(2)} m | Holgura lateral: ${margenV.toFixed(2)} m`);
  _linea(pdf, `- Ancho minimo de carril/pasillo recomendado: ${anchoP.toFixed(2)} m`, true);

  /* Bloque 6 */
  _seccion(pdf, 'Bloque 6. Grafico Distancia - Intensidad (D x I)');
  const df6 = (S.rows_di || DI_BASE()).map(r => ({ ...r, 'D x I': num(r['Intensidad (t)']) * num(r['Distancia (m)']) }));
  if (df6.length) {
    df6.sort((a, b) => b['D x I'] - a['D x I']);
    _tabla(pdf, df6, ['Movimiento', 'Intensidad (t)', 'Distancia (m)', 'D x I'], [70, 36, 36, 40]);
    _linea(pdf, `- Movimiento mas exigente: ${df6[0].Movimiento} (D x I = ${fmtN(df6[0]['D x I'], 2)}).`);
  } else _linea(pdf, '- Sin movimientos capturados.');

  /* Bloque 7 */
  _seccion(pdf, 'Bloque 7. Evaluacion multicriterio (ponderacion de factores)');
  const pesos = [num(_ss('p1_sha', 40)), num(_ss('p2_sha', 20)), num(_ss('p3_sha', 20)), num(_ss('p4_sha', 20))];
  const planSel = {
    'Opcion A (Manual)': [['ca1_sha', 'A'], ['ea1_sha', 'I'], ['fa1_sha', 'A'], ['sa1_sha', 'U']],
    'Opcion B (Minicargador)': [['cb1_sha', 'I'], ['eb1_sha', 'E'], ['fb1_sha', 'I'], ['sb1_sha', 'I']],
    'Opcion C (Bandas)': [['cc1_sha', 'U'], ['ec1_sha', 'A'], ['fc1_sha', 'E'], ['sc1_sha', 'A']]
  };
  _linea(pdf, `- Ponderaciones: Costo ${pesos[0].toFixed(0)}% | Espacio ${pesos[1].toFixed(0)}% | Mantenimiento ${pesos[2].toFixed(0)}% | Seguridad ${pesos[3].toFixed(0)}%`);
  const punt = {};
  for (const [nomP, crit] of Object.entries(planSel)) {
    const letras = crit.map(([k, d]) => String(_ss(k, d)));
    punt[nomP] = letras.reduce((s, l, i) => s + (VALOR_LETRA[l] ?? 0) * pesos[i], 0) / 100;
    _linea(pdf, `- ${nomP}: calificaciones ${letras.join('/')} -> puntuacion ${punt[nomP].toFixed(2)}`);
  }
  const mejor = Object.keys(punt).reduce((a, b) => (punt[b] > punt[a] ? b : a));
  _linea(pdf, `- Mejor alternativa: ${mejor} con ${punt[mejor].toFixed(2)} puntos.`, true);

  /* Bloque 8 */
  _seccion(pdf, 'Bloque 8. Indicadores clave (KPIs) y red PERT');
  const unid = num(_ss('u_sha', 538824.0)), costoOp = num(_ss('ct_sha', 691436.0)), hDisp = num(_ss('hd_sha', 2184.0)), hReal = num(_ss('hr_sha', 2010.0)), mermas = num(_ss('dl_sha', 10500.0));
  _linea(pdf, `- Costo promedio por bloque: $${(unid > 0 ? costoOp / unid : 0).toFixed(2)}`);
  _linea(pdf, `- Utilizacion de equipo: ${(hDisp > 0 ? hReal / hDisp * 100 : 0).toFixed(1)}%`);
  _linea(pdf, `- Mermas: ${(unid > 0 ? mermas / unid * 100 : 0).toFixed(2)}% de la produccion anual`);
  const cp = cpm(PERT_ACTS);
  _linea(pdf, `- Cronograma PERT (Terreno, Cimentacion, Construccion, Montaje): duracion total ${cp.T} unidades de tiempo; ruta critica ${cp.crit.join(' - ')}.`);

  /* Bloque 9 */
  _seccion(pdf, 'Bloque 9. Finanzas, punto de equilibrio y What-If');
  const cf = num(_ss('cf_whatif_sha', 144835.17), 144835.17), cv = num(_ss('cv_whatif_sha', 10.47), 10.47), pv = num(_ss('pv_whatif_sha', 21.00), 21.00);
  const varCv = num(_ss('vcv_sha', 0)), varPv = num(_ss('vp_sha', 0)), cvAj = cv * (1 + varCv / 100), pvAj = pv * (1 + varPv / 100), mc = pvAj - cvAj;
  const sg = v => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(0);
  _linea(pdf, `- Costos Fijos Mensuales: $${fmtN(cf, 2)} | Costo Variable Unitario: $${fmtN(cv, 2)} | Precio de Venta: $${fmtN(pv, 2)}`);
  _linea(pdf, `- Escenario What-If: CV ${sg(varCv)}% ($${fmtN(cvAj, 2)}) | Precio ${sg(varPv)}% ($${fmtN(pvAj, 2)})`);
  if (mc > 0) {
    const peU = cf / mc, utilidad = prodM * mc - cf;
    _linea(pdf, `- Margen de contribucion unitario: $${fmtN(mc, 2)}`);
    _linea(pdf, `- Punto de equilibrio: ${fmtN(Math.trunc(peU))} bloques/mes ($${fmtN(peU * pvAj, 2)} en ventas)`);
    _linea(pdf, `- Utilidad mensual estimada con ${fmtN(prodM)} bloques: $${fmtN(utilidad, 2)}`, true);
    _linea(pdf, utilidad > 0 ? '- Conclusiones: El proyecto demuestra viabilidad financiera solida.' : '- Conclusiones: En este escenario el proyecto no cubre sus costos.');
  } else _linea(pdf, '- Con este escenario el margen de contribucion es negativo: no existe punto de equilibrio.');

  pdf.ln(4);
  _linea(pdf, 'Reporte generado automaticamente por ALPHA BLOCKS - Equipo Cacahuate.');
  return pdf.output();
}
/* =========================================================
   MÓDULO 2 · MATRIZ SHA INTERACTIVA (Muther) + BLOQUÍN
   ========================================================= */
const MX_ESTACIONES = ['01. Almacenes de MP', '02. Nave / QT4-16', '03. Área de Fraguado', '04. Curado al Sol', '05. Producto Terminado', '06. Patio de Maniobra', '07. Caseta de Control', '08. Oficinas y Serv.', '09. Almacén de EPP', '10. Almacén de Montacargas', '11. Laboratorio'];
const MX_COLORES = {
  A: { color: '#FF2E93', desc: 'A - Absolutamente Necesario' }, E: { color: '#FFC93C', desc: 'E - Especialmente Importante' },
  I: { color: '#00E676', desc: 'I - Importante' }, O: { color: '#29B6F6', desc: 'O - Ordinario' },
  U: { color: '#E0E0E0', desc: 'U - Sin Importancia (No vinculante)' }, X: { color: '#D32F2F', desc: 'X - Indeseable / Peligro' }
};
const MX_MOTIVOS = {
  '1': 'Flujo pesado de agregados y bloques.', '2': 'Bloque fresco (Minimizar trayectos).', '3': 'Secuencia continua de maduración.',
  '4': 'Norma STPS (Ruido QT4-16 y Polvos).', '5': 'Control de acceso de camiones.', '6': 'Respuesta rápida a paros de máquina.',
  '7': 'Entrega de EPP al personal antes de ingresar a la nave.', '8': 'Traslado de tarimas con montacargas (curado, producto terminado y muelle).',
  '9': 'Muestreo y ensayo de calidad de bloques en curado.', '-': 'Sin interacción directa.'
};
const MX_DESC = [
  'Aquí se guardan arena, grava y cemento en tres almacenes separados, con boca hacia el patio para descargar en reversa.',
  'Es el corazón de la planta: la máquina QT4-16 mezcla, vibra y prensa los bloques (unos 1,727 al día).',
  'El bloque recién prensado reposa unas 24 horas bajo techo para fraguar sin deformarse.',
  'Los bloques maduran al sol y se riegan; aquí caben unos 16 días de producción.',
  'Estiba lista para el montacargas y el camión de reparto (unos 10 días de producción).',
  'Espacio de 26 x 15 m para que los camiones den reversa y descarguen la materia prima.',
  'Vigila entradas y salidas y abre la barrera al camión de carga.',
  'Administración, sanitarios, vestidores y comedor: debe quedar lejos del ruido y el polvo de la nave.',
  'Guarda y entrega los cascos, botas, chalecos y guantes; conviene que esté cerca de la nave y del acceso del personal.',
  'Resguarda los montacargas cuando no trabajan; debe quedar junto al curado y al producto terminado, que son las zonas que atienden.',
  'Revisa muestras de bloques en curado (dimensiones, peso y resistencia en prensa); conviene que esté junto al curado.'
];
const G = 'Grado (A,E,I,O,U,X)', CM = 'Código Motivo';

const BLOQUIN_SVG = `
<svg id="pj" viewBox="0 0 160 190">
 <defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d1d5db"/><stop offset="1" stop-color="#9ca3af"/></linearGradient></defs>
 <ellipse cx="80" cy="185" rx="54" ry="5" fill="rgba(0,0,0,.18)"/>
 <rect x="44" y="150" width="24" height="28" rx="6" fill="#4b5563"/>
 <rect x="92" y="150" width="24" height="28" rx="6" fill="#4b5563"/>
 <rect x="38" y="172" width="36" height="11" rx="5" fill="#1f2937"/>
 <rect x="86" y="172" width="36" height="11" rx="5" fill="#1f2937"/>
 <rect x="18" y="40" width="124" height="116" rx="9" fill="url(#gr)" stroke="#4b5563" stroke-width="3"/>
 <circle cx="30" cy="142" r="1.6" fill="#6b7280"/><circle cx="46" cy="148" r="1.3" fill="#6b7280"/><circle cx="118" cy="144" r="1.6" fill="#6b7280"/><circle cx="132" cy="136" r="1.3" fill="#6b7280"/><circle cx="80" cy="150" r="1.4" fill="#6b7280"/>
 <rect x="36" y="62" width="40" height="54" rx="8" fill="#374151"/>
 <rect x="84" y="62" width="40" height="54" rx="8" fill="#374151"/>
 <circle cx="56" cy="92" r="13" fill="#fff"/><circle id="pupI" cx="56" cy="92" r="6" fill="#111"/>
 <circle cx="104" cy="92" r="13" fill="#fff"/><circle id="pupD" cx="104" cy="92" r="6" fill="#111"/>
 <path id="boca" d="M60 134 Q80 148 100 134" fill="none" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
 <path d="M24 44 Q80 -8 136 44 Z" fill="#facc15" stroke="#a16207" stroke-width="3"/>
 <rect x="16" y="40" width="128" height="9" rx="4" fill="#eab308" stroke="#a16207" stroke-width="2"/>
 <rect x="2" y="86" width="18" height="12" rx="6" fill="#9ca3af" stroke="#4b5563" stroke-width="2"/>
 <g id="brazoD"><rect x="140" y="86" width="18" height="12" rx="6" fill="#9ca3af" stroke="#4b5563" stroke-width="2"/></g>
</svg>`;

let mxMouseHandler = null, mxTimer = null;

/* Construye la matriz de diamante + personaje (equivale a generar_matriz_personaje) */
function construirMatriz(host, relRows, soloCriticos) {
  const N = MX_ESTACIONES.length, pares = {};
  relRows.forEach(row => {
    try {
      const a = parseInt(row['Área 1']), b = parseInt(row['Área 2']);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return;
      let g = String(row[G] ?? '').toUpperCase().trim(); const m = String(row[CM] ?? '').trim();
      if (a === b || Math.min(a, b) < 0 || Math.max(a, b) >= N) return;
      g = (g && 'AEIOUX'.includes(g[0])) ? g[0] : 'U';
      pares[Math.min(a, b) + '-' + Math.max(a, b)] = [g, m];
    } catch (e) { /* fila inválida: se ignora */ }
  });
  if (mxMouseHandler) document.removeEventListener('mousemove', mxMouseHandler);
  clearInterval(mxTimer);

  host.innerHTML = `<div class="mxsheet"><div id="izq">${BLOQUIN_SVG}<div id="bub"><div id="nom">Bloquín explica</div><div id="txt"></div></div></div><div id="der"><svg id="mx" viewBox="0 0 600 690"></svg></div></div>`;
  const EST = MX_ESTACIONES, DESC = MX_DESC, PARES = pares, MOT = MX_MOTIVOS, SOLO = !!soloCriticos, COL = MX_COLORES;
  const D = 62, TOP = 34, OX = 218, LX = 208, svg = $('#mx', host);
  const el = (t, a, p) => SV(t, a, p || svg);
  const nom = k => EST[k].replace(/^\d+\.\s*/, '');
  const nGrado = g => { const d = (COL[g] || COL.U).desc; return d.indexOf(' - ') >= 0 ? d.split(' - ')[1] : d; };
  const SIGNIF = { A: 'deben quedar pegadas, una junto a la otra', E: 'deben quedar muy cerca', I: 'conviene que estén cerca', O: 'pueden quedar a una distancia normal, sin urgencia', U: 'no importa dónde queden entre sí', X: 'deben quedar lo más lejos posible, porque juntarlas es peligroso o molesto' };

  const celdas = [], labels = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const par = PARES[i + '-' + j] || ['U', '-'], g = par[0], m = par[1];
      const apagada = SOLO && g !== 'A' && g !== 'X';
      const color = apagada ? '#F5F5F5' : (COL[g] || COL.U).color;
      const cx = OX + (j - i) * D / 2, cy = TOP + (i + j) * D / 2, h = D / 2;
      const grp = el('g', {});
      const top = el('path', { d: `M${cx},${cy - h} L${cx + h},${cy} L${cx - h},${cy} Z`, fill: color, class: 'tri' }, grp);
      const bot = el('path', { d: `M${cx - h},${cy} L${cx + h},${cy} L${cx},${cy + h} Z`, fill: color, class: 'tri' }, grp);
      el('path', { d: `M${cx},${cy - h} L${cx + h},${cy} L${cx},${cy + h} L${cx - h},${cy} Z`, class: 'borde' }, grp);
      el('line', { x1: cx - h, y1: cy, x2: cx + h, y2: cy, stroke: '#424242', 'stroke-width': .8, 'pointer-events': 'none' }, grp);
      if (!apagada) {
        const claro = (g === 'E' || g === 'U');
        el('text', { x: cx, y: cy - h * 0.28, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: claro ? '#111' : '#fff', 'pointer-events': 'none' }, grp).textContent = g;
        el('text', { x: cx, y: cy + h * 0.62, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: claro ? '#111' : '#fff', 'pointer-events': 'none' }, grp).textContent = m;
      }
      const c = { i, j, g, m, apagada, cx, cy, grp }; celdas.push(c);
      const act = parte => () => hablarTri(parte, c);
      top.addEventListener('mouseenter', act('top')); top.addEventListener('click', act('top'));
      bot.addEventListener('mouseenter', act('bot')); bot.addEventListener('click', act('bot'));
    }
  }
  /* Guías diagonales */
  const gl = el('g', { 'pointer-events': 'none' });
  const lineI = el('line', { stroke: '#111', 'stroke-width': 3, 'stroke-dasharray': '7 5', visibility: 'hidden' }, gl);
  const lineJ = el('line', { stroke: '#111', 'stroke-width': 3, 'stroke-dasharray': '7 5', visibility: 'hidden' }, gl);
  /* Etiquetas de áreas */
  for (let k = 0; k < N; k++) {
    const ky = TOP + k * D;
    el('circle', { cx: OX - 6, cy: ky, r: 4, fill: '#2c3e50' });
    const t = el('text', { x: LX, y: ky + 4, 'text-anchor': 'end', class: 'est' }); t.textContent = EST[k]; labels.push(t);
    const fn = () => hablarEstacion(k); t.addEventListener('mouseenter', fn); t.addEventListener('click', fn);
  }
  function limpiar() {
    lineI.setAttribute('visibility', 'hidden'); lineJ.setAttribute('visibility', 'hidden');
    labels.forEach(t => t.classList.remove('on'));
    celdas.forEach(c => { c.grp.classList.remove('rel'); c.grp.classList.remove('act'); });
  }
  function guias(c) {
    limpiar();
    lineI.setAttribute('x1', OX - 6); lineI.setAttribute('y1', TOP + c.i * D); lineI.setAttribute('x2', c.cx); lineI.setAttribute('y2', c.cy);
    lineJ.setAttribute('x1', OX - 6); lineJ.setAttribute('y1', TOP + c.j * D); lineJ.setAttribute('x2', c.cx); lineJ.setAttribute('y2', c.cy);
    lineI.setAttribute('visibility', 'visible'); lineJ.setAttribute('visibility', 'visible');
    labels[c.i].classList.add('on'); labels[c.j].classList.add('on'); c.grp.classList.add('act');
  }

  /* Personaje */
  const pj = $('#pj', host), boca = $('#boca', host), txt = $('#txt', host), nomEl = $('#nom', host);
  const SONRISA = 'M60 134 Q80 148 100 134', ABIERTA = 'M60 128 Q80 160 100 128 Z';
  let tok = 0, ultima = '';
  function decir(texto, titulo) {
    const my = ++tok; clearInterval(mxTimer);
    nomEl.textContent = titulo || 'Bloquín explica'; txt.textContent = '';
    pj.classList.remove('bota'); void pj.getBoundingClientRect(); pj.classList.add('bota'); pj.classList.add('habla');
    boca.setAttribute('fill', '#1f2937');
    let k = 0;
    mxTimer = setInterval(() => {
      if (my !== tok) { clearInterval(mxTimer); return; }
      k += 2; txt.textContent = texto.slice(0, k);
      boca.setAttribute('d', (k / 2) % 2 ? ABIERTA : SONRISA);
      if (k >= texto.length) { clearInterval(mxTimer); boca.setAttribute('d', SONRISA); boca.setAttribute('fill', 'none'); pj.classList.remove('habla'); }
    }, 22);
  }
  function hablarTri(parte, c) {
    const clave = parte + c.i + '-' + c.j; if (clave === ultima) return; ultima = clave;
    guias(c);
    const A = nom(c.i), B = nom(c.j);
    if (c.apagada) { decir('Este rombo está apagado porque activaste el filtro de rutas críticas. Entre «' + A + '» y «' + B + '» la relación no es A ni X. Desactiva el filtro para ver su letra y su motivo.', 'Rombo apagado'); return; }
    if (parte === 'top') {
      decir('¡Estás tocando la MITAD DE ARRIBA del rombo! Aquí va la LETRA DE PROXIMIDAD. Entre «' + A + '» y «' + B + '» es una «' + c.g + '»: ' + nGrado(c.g) + '. Significa que ' + SIGNIF[c.g] + '.', 'Triángulo superior · Letra');
    } else {
      let t;
      if (c.m === '-' || !(c.m in MOT)) {
        t = '¡Esta es la MITAD DE ABAJO! Aquí va el CÓDIGO DEL MOTIVO. Entre «' + A + '» y «' + B + '» hay un guion (-): nadie anotó una razón porque no hay interacción directa que justificar.';
      } else {
        t = '¡Esta es la MITAD DE ABAJO! Aquí va el CÓDIGO DEL MOTIVO: el ' + c.m + '. Quiere decir: «' + MOT[c.m] + '» Es la razón por la que ' + (c.g === 'X' ? '«' + A + '» y «' + B + '» deben quedar separadas.' : 'se pide esa cercanía entre «' + A + '» y «' + B + '».');
      }
      decir(t, 'Triángulo inferior · Motivo');
    }
  }
  function hablarEstacion(k) {
    const clave = 'est' + k; if (clave === ultima) return; ultima = clave;
    limpiar(); labels[k].classList.add('on');
    celdas.forEach(c => { if (c.i === k || c.j === k) c.grp.classList.add('rel'); });
    decir('«' + nom(k) + '»: ' + DESC[k] + ' Mira cómo se resaltan los rombos que la conectan con las demás áreas: cada uno es una relación de cercanía.', 'Área tocada');
  }
  /* Pupilas que siguen el cursor */
  const pupI = $('#pupI', host), pupD = $('#pupD', host);
  mxMouseHandler = e => {
    const r = pj.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
    const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(5, d / 40);
    const tr = 'translate(' + (dx / d * m) + ',' + (dy / d * m) + ')';
    pupI.setAttribute('transform', tr); pupD.setAttribute('transform', tr);
  };
  document.addEventListener('mousemove', mxMouseHandler);
  decir('¡Hola! Soy Bloquín, el block de la planta Cacahuate. Pasa el cursor o toca los rombos de la matriz y te explico cada parte: el triángulo de arriba (la letra), el de abajo (el motivo) y las áreas que une.', 'Bloquín te saluda');
}

function appTablRel(root, sb) {
  root.append(H('h1', {}, '🔷 Matriz Interactiva de Relaciones (Muther SHA)'),
    H('p', {}, 'Herramienta dinámica para planificar la distribución del terreno de ', H('b', {}, '3,679 m²'), ' de la Bloquera Cacahuate.'));
  if (!S.relaciones) {
    const R = (a, b, g, m) => ({ 'Área 1': a, 'Área 2': b, [G]: g, [CM]: m });
    S.relaciones = [R(0, 1, 'A', '1'), R(1, 2, 'A', '2'), R(2, 3, 'A', '3'), R(3, 4, 'A', '3'), R(4, 5, 'A', '1'), R(5, 6, 'E', '5'), R(1, 8, 'E', '7'), R(1, 7, 'X', '4'), R(0, 7, 'X', '4'),
      R(0, 8, 'I', '7'), R(3, 9, 'E', '8'), R(4, 9, 'A', '8'), R(3, 10, 'E', '9')];
  }
  const host = H('div');
  let tmr = null;
  const redibujar = () => { clearTimeout(tmr); tmr = setTimeout(() => construirMatriz(host, S.relaciones, S.filtro_critico), 250); };
  const dic = H('div', { class: 'dict' }); Object.entries(MX_MOTIVOS).forEach(([k, v]) => dic.append(H('p', { html: `<b>${k}</b>: ${esc(v)}` })));
  const panel = H('div', {},
    H('h3', {}, '🎛️ Panel de Control'),
    wToggle('🚨 Mostrar solo rutas críticas (A y X)', 'filtro_critico', () => construirMatriz(host, S.relaciones, S.filtro_critico)),
    H('p', { html: '<b>Edita las relaciones en vivo:</b>' }),
    editor([{ k: 'Área 1', type: 'int', step: 1 }, { k: 'Área 2', type: 'int', step: 1 }, { k: G, type: 'text' }, { k: CM, type: 'text' }], S.relaciones, { dynamic: true, narrow: true, onchange: redibujar }),
    H('hr'), H('h3', {}, '📘 Diccionario de Motivos'), dic);
  root.append(cols([2.4, 1.3], host, panel));
  construirMatriz(host, S.relaciones, S.filtro_critico);
  return () => { if (mxMouseHandler) document.removeEventListener('mousemove', mxMouseHandler); mxMouseHandler = null; clearInterval(mxTimer); clearTimeout(tmr); };
}
/* =========================================================
   MÓDULO 3 · DIAGRAMA DE RELACIONES (Red SHA interactiva)
   ========================================================= */
const RD_NODOS = [
  { id: 'E1', x: 130, y: 170, label: ['Almacenes MP', '(Arena, Grava, Cemento)'], color: '#5D4037', tc: '#FFFFFF' },
  { id: 'E2', x: 400, y: 170, label: ['Nave de Producción', '(Máquina QT4-16)'], color: '#D32F2F', tc: '#FFFFFF' },
  { id: 'E3', x: 660, y: 170, label: ['Área de Curado', 'y Secado al sol'], color: '#FBC02D', tc: '#111111' },
  { id: 'E4', x: 660, y: 350, label: ['Producto Terminado', 'y Despacho'], color: '#388E3C', tc: '#FFFFFF' },
  { id: 'E5', x: 130, y: 350, label: ['Patio de Maniobras'], color: '#616161', tc: '#FFFFFF' },
  { id: 'E6', x: 130, y: 560, label: ['Caseta de Control'], color: '#1976D2', tc: '#FFFFFF' },
  { id: 'E7', x: 400, y: 560, label: ['Oficinas Administrativas'], color: '#8E24AA', tc: '#FFFFFF' },
  { id: 'E8', x: 660, y: 560, label: ['Servicios al Personal'], color: '#00ACC1', tc: '#FFFFFF' },
  { id: 'E9', x: 400, y: 52, label: ['Almacén de EPP', '(Equipo de Protección)'], color: '#F57C00', tc: '#FFFFFF' },
  { id: 'E10', x: 860, y: 350, label: ['Almacén de', 'Montacargas'], color: '#455A64', tc: '#FFFFFF' },
  { id: 'E11', x: 860, y: 170, label: ['Laboratorio', '(Control de Calidad)'], color: '#00897B', tc: '#FFFFFF' }
];
/* (origen, destino, grado, color, grosor, estilo, posición de la etiqueta) */
const RD_REL = [
  ['E1', 'E2', 'A', '#FF2E93', 5.0, 'solid', 0.5], ['E2', 'E3', 'A', '#FF2E93', 5.0, 'solid', 0.5], ['E3', 'E4', 'A', '#FF2E93', 5.0, 'solid', 0.5],
  ['E4', 'E5', 'A', '#FF2E93', 5.0, 'solid', 0.68], ['E5', 'E1', 'E', '#FFC93C', 3.5, 'solid', 0.5], ['E6', 'E5', 'E', '#FFC93C', 3.5, 'solid', 0.5],
  ['E2', 'E9', 'E', '#FFC93C', 3.5, 'solid', 0.5], ['E7', 'E8', 'I', '#00E676', 2.0, 'solid', 0.5], ['E6', 'E7', 'I', '#00E676', 2.0, 'solid', 0.5],
  ['E7', 'E2', 'X (Ruido/Polvo)', '#FF3333', 2.5, 'dashed', 0.3], ['E8', 'E2', 'X (Ruido/Polvo)', '#FF3333', 2.5, 'dashed', 0.3], ['E7', 'E1', 'X (Polvo MP)', '#FF3333', 2.5, 'dashed', 0.45],
  ['E10', 'E4', 'A', '#FF2E93', 5.0, 'solid', 0.5], ['E10', 'E3', 'E', '#FFC93C', 3.5, 'solid', 0.5],
  ['E3', 'E11', 'E', '#FFC93C', 3.5, 'solid', 0.5], ['E9', 'E1', 'I', '#00E676', 2.0, 'solid', 0.5]
];
const RD_ARISTAS = RD_REL.map(([de, a, grado, color, grosor, estilo, lt]) => ({
  de, a, g: grado[0], txt: grado, motivo: grado.includes('(') ? grado.slice(grado.indexOf('(') + 1, grado.indexOf(')')) : '', color, ancho: grosor, estilo, lt
}));
const RD_INFO = {
  A: { n: 'ABSOLUTAMENTE NECESARIO', c: '#FF2E93', t: 'Las dos áreas deben quedar contiguas: entre ellas fluye el material de forma continua y crítica.' },
  E: { n: 'ESPECIALMENTE IMPORTANTE', c: '#E0A800', t: 'Las áreas deben quedar muy cerca una de otra para responder rápido y acortar recorridos.' },
  I: { n: 'IMPORTANTE', c: '#00A854', t: 'Conviene que estén próximas: facilita la coordinación y el servicio entre ellas.' }
};

/* Dibuja la red sobre un <svg>. interactivo=false → versión estática (cajas redondeadas). */
function dibujarRed(svg, interactivo, hooks) {
  svg.innerHTML = '';
  const RX = 84, RY = 36, porId = {}; RD_NODOS.forEach(n => { porId[n.id] = n; });
  const borde = (n, m) => {
    const dx = m.x - n.x, dy = m.y - n.y;
    if (interactivo) { const k = 1 / Math.sqrt((dx / RX) ** 2 + (dy / RY) ** 2); return { x: n.x + dx * k, y: n.y + dy * k }; }
    const k = 1 / Math.max(Math.abs(dx) / RX, Math.abs(dy) / RY); return { x: n.x + dx * k, y: n.y + dy * k };
  };
  const defs = SV('defs', {}, svg);
  [...new Set(RD_ARISTAS.map(a => a.color))].forEach(c => {
    const m = SV('marker', { id: 'm' + (interactivo ? 'i' : 's') + c.slice(1), markerUnits: 'userSpaceOnUse', markerWidth: 16, markerHeight: 16, refX: 14, refY: 8, orient: 'auto' }, defs);
    SV('path', { d: 'M0,1 L15,8 L0,15 z', fill: c }, m);
  });
  const edgeEls = [];
  RD_ARISTAS.forEach(a => {
    const A = porId[a.de], B = porId[a.a], p1 = borde(A, B), p2 = borde(B, A);
    const g = SV('g', { class: 'edge' }, svg); g.style.color = a.color;
    SV('path', { class: 'line', d: `M${p1.x},${p1.y} L${p2.x},${p2.y}`, stroke: a.color, 'stroke-width': a.ancho, fill: 'none', 'stroke-dasharray': a.estilo === 'dashed' ? '9 6' : 'none', 'marker-end': `url(#m${interactivo ? 'i' : 's'}${a.color.slice(1)})` }, g);
    const lx = p1.x + (p2.x - p1.x) * a.lt, ly = p1.y + (p2.y - p1.y) * a.lt, w = a.txt.length * 7 + 14;
    SV('rect', { x: lx - w / 2, y: ly - 10, width: w, height: 20, rx: 6, fill: '#121212', 'fill-opacity': .9 }, g);
    SV('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', fill: a.color, 'font-size': 12, 'font-weight': 700 }, g).textContent = a.txt;
    edgeEls.push(g);
  });
  const nodeEls = {};
  RD_NODOS.forEach(n => {
    const g = SV('g', { class: 'node', transform: `translate(${n.x},${n.y})` }, svg), s = SV('g', { class: 'in' }, g);
    if (interactivo) SV('ellipse', { cx: 0, cy: 0, rx: RX, ry: RY, fill: n.color }, s);
    else SV('rect', { x: -RX, y: -RY, width: RX * 2, height: RY * 2, rx: 14, fill: n.color, stroke: '#fff', 'stroke-width': 1.5 }, s);
    n.label.forEach((l, i) => {
      const y = n.label.length === 1 ? 4 : (i === 0 ? -4 : 12);
      SV('text', { x: 0, y, 'text-anchor': 'middle', fill: n.tc, 'font-size': 12, 'font-weight': 700 }, s).textContent = l;
    });
    if (interactivo) g.addEventListener('click', () => hooks.tocar(n.id));
    nodeEls[n.id] = { g, s };
  });
  return { edgeEls, nodeEls, porId };
}

function appDiagRel(root) {
  root.append(H('h1', {}, '🧱 Diagrama de Relaciones (SHA) - Empresa Cacahuate'),
    H('p', { html: 'Visualización en red para la planta de fabricación de <b>bloques huecos de concreto</b>, basada en la metodología de Muther y el layout estructurado.' }));

  /* --- Gráfico interactivo --- */
  const panel = H('div', { id: 'rdpanel' }, H('div', { id: 'rdtxt' }), H('button', { id: 'rdreset', type: 'button' }, '↺ Reiniciar'));
  const svg = SV('svg', { viewBox: '0 0 960 620', class: 'rdsvg', id: 'rdsvg' });
  const ptxt = $('#rdtxt', panel);
  let sel1 = null, sel2 = null, ocupado = false, R = null;
  const nombre = id => R.porId[id].label.join(' ');
  const mostrar = (html, clase) => { ptxt.innerHTML = html; panel.className = clase || ''; panel.id = 'rdpanel'; };
  const limpiarVista = () => { Object.values(R.nodeEls).forEach(o => o.g.classList.remove('sel')); R.edgeEls.forEach(e => { e.classList.remove('dim'); e.classList.remove('hl'); }); };
  const reiniciar = () => {
    sel1 = null; sel2 = null; limpiarVista();
    mostrar('&#128070; Toca un <b>óvalo</b> (área de la planta) y luego toca <b>otro</b> para conocer la relación entre ambos.', '');
  };
  const marcar = idx => R.edgeEls.forEach((e, i) => { if (idx >= 0) { if (i === idx) e.classList.add('hl'); else e.classList.add('dim'); } });
  const vibrar = ids => {
    ocupado = true; ids.forEach(id => R.nodeEls[id].s.classList.add('shake'));
    setTimeout(() => { ids.forEach(id => R.nodeEls[id].s.classList.remove('shake')); ocupado = false; }, 1000);
  };
  const evaluar = (a, b) => {
    const d = RD_ARISTAS.findIndex(e => e.de === a && e.a === b), r = RD_ARISTAS.findIndex(e => e.de === b && e.a === a);
    const idx = d >= 0 ? d : r, e = idx >= 0 ? RD_ARISTAS[idx] : null;
    marcar(idx);
    if (!e || e.g === 'X') {
      vibrar([a, b]);
      const motivo = e ? ('Los une una flecha de <b>indeseable (X)</b>: ' + (e.motivo || 'riesgo') + '. Deben mantenerse separadas.') : 'No existe ninguna flecha que una estas dos áreas: no tienen relación directa.';
      mostrar('<span class="badge" style="background:#D32F2F">&#9940; INCOMPATIBLE</span><b>' + nombre(a) + '</b> &#8596; <b>' + nombre(b) + '</b><br>' + motivo, 'bad');
    } else {
      const Rl = RD_INFO[e.g];
      const sentido = d >= 0 ? ('La flecha va en este sentido: ' + nombre(a) + ' &#8594; ' + nombre(b) + '.') : ('La flecha apunta en sentido contrario (' + nombre(b) + ' &#8594; ' + nombre(a) + '); la relación es la misma.');
      mostrar('<span class="badge" style="background:' + Rl.c + '">' + e.g + ' · ' + Rl.n + '</span><b>' + nombre(a) + '</b> &#8594; <b>' + nombre(b) + '</b><br>' + Rl.t + '<br><span style="opacity:.75">' + sentido + '</span>', 'ok');
    }
  };
  const alTocar = id => {
    if (ocupado) return;
    if (sel2 !== null) reiniciar();
    if (sel1 === null) { sel1 = id; R.nodeEls[id].g.classList.add('sel'); mostrar('&#128993; Origen: <b>' + nombre(id) + '</b>. Ahora toca <b>otro óvalo</b> para ver su relación.', ''); return; }
    if (sel1 === id) { reiniciar(); return; }
    sel2 = id; R.nodeEls[id].g.classList.add('sel'); evaluar(sel1, sel2);
  };
  R = dibujarRed(svg, true, { tocar: alTocar });
  $('#rdreset', panel).addEventListener('click', () => { if (!ocupado) reiniciar(); });
  reiniciar();

  /* --- Versión estática (equivale al expander Graphviz) --- */
  const svgEst = SV('svg', { viewBox: '0 0 960 620', class: 'rdsvg' });
  dibujarRed(svgEst, false);
  const estatica = H('details', {}, H('summary', {}, 'Ver versión estática (Graphviz)'), H('div', { class: 'rdwrap', style: 'margin-top:.6rem' }, svgEst));

  /* --- Leyenda --- */
  const leyenda = H('div', { class: 'legend' },
    H('h3', {}, '🎨 Código Normado Muther'),
    H('ul', {}, ...[['#FF2E93', '█████ A', 'Absolutamente Necesario'], ['#FFC93C', '█████ E', 'Especialmente Importante'], ['#00E676', '█████ I', 'Importante'],
      ['#808080', '─── O', 'Ordinaria Importancia'], ['#FF3333', '- - - X', 'Indeseable (Incompatible)']]
      .map(([c, s, d]) => H('li', { html: `<span style="color:${c};font-weight:bold">${s}</span>: ${d}` }))),
    msg('info', "💡 **Análisis de la Bloquera:** Las relaciones 'A' garantizan un flujo lineal continuo desde los almacenes independientes de arena, grava y cemento hacia la nave, y de ahí al curado. Las líneas rojas discontinuas ('X') mantienen obligatoriamente separadas las oficinas y los servicios al personal de la máquina QT4-16 para cumplir las normativas contra ruido y polvo."));

  root.append(cols([3, 1], H('div', {}, H('div', { class: 'rdwrap' }, panel, svg), estatica), leyenda));
}
/* =========================================================
   MÓDULOS 4 y 5 · PATIO DEDICADO (ABC) y PATIO ALEATORIO
   ========================================================= */

/* ---- MT19937 + np.random.choice(replace=False) de NumPy (misma dispersión que el original) ---- */
class MT19937 {
  constructor(seed) {
    this.mt = new Uint32Array(624); this.i = 624; this.mt[0] = seed >>> 0;
    for (let k = 1; k < 624; k++) { const p = this.mt[k - 1] ^ (this.mt[k - 1] >>> 30); this.mt[k] = (Math.imul(1812433253, p) + k) >>> 0; }
  }
  twist() {
    for (let k = 0; k < 624; k++) {
      const y = (this.mt[k] & 0x80000000) | (this.mt[(k + 1) % 624] & 0x7fffffff);
      let v = this.mt[(k + 397) % 624] ^ (y >>> 1); if (y & 1) v ^= 0x9908b0df; this.mt[k] = v >>> 0;
    }
    this.i = 0;
  }
  next() {
    if (this.i >= 624) this.twist();
    let y = this.mt[this.i++];
    y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18;
    return y >>> 0;
  }
  interval(max) {
    if (max === 0) return 0;
    let mask = max; mask |= mask >>> 1; mask |= mask >>> 2; mask |= mask >>> 4; mask |= mask >>> 8; mask |= mask >>> 16;
    let v; do { v = (this.next() & mask) >>> 0; } while (v > max);
    return v;
  }
}
function choiceSinReemplazo(n, size, seed) {
  const rng = new MT19937(seed), a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i >= 1; i--) { const j = rng.interval(i); if (i !== j) { const t = a[i]; a[i] = a[j]; a[j] = t; } }
  return a.slice(0, size);
}

/* ---- Escalas de color ---- */
const YLORRD = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'];
const ZONAS = ['#f0f0f0', '#a8e6cf', '#ffd3b6', '#ff8b94'];
function escala(stops, t) {
  t = Math.min(1, Math.max(0, t)); const p = t * (stops.length - 1), i = Math.min(Math.floor(p), stops.length - 2), f = p - i;
  const h2 = s => [1, 3, 5].map(k => parseInt(s.slice(k, k + 2), 16)), a = h2(stops[i]), b = h2(stops[i + 1]);
  return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',') + ')';
}
const zeros = (r, c, v = 0) => Array.from({ length: r }, () => Array(c).fill(v));
const flat = m => m.flat();

/* ---- Mapa de calor SVG (sustituye a px.imshow) ---- */
function heatmap(host, o) {
  host.innerHTML = '';
  const cs = Math.max(20, Math.min(40, Math.floor(640 / o.cols))), ml = 62, mr = o.cbar ? 96 : 22, mt = 66, mb = 56;
  const W = ml + o.cols * cs + mr, Hh = mt + o.rows * cs + mb;
  const svg = SV('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chart' });
  SV('rect', { x: 0, y: 0, width: W, height: Hh, fill: '#fff' }, svg);
  SV('text', { x: W / 2, y: 26, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#1f2937' }, svg).textContent = o.title;
  const defs = SV('defs', {}, svg);
  const mk = SV('marker', { id: 'hmarr', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto', markerUnits: 'userSpaceOnUse' }, defs);
  SV('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#000' }, mk);
  const X = c => ml + c * cs, Y = r => mt + r * cs, fs = Math.max(9, Math.min(12, cs * 0.34));
  for (let r = 0; r < o.rows; r++) {
    for (let c = 0; c < o.cols; c++) {
      const rect = SV('rect', { x: X(c), y: Y(r), width: cs, height: cs, fill: o.color(o.z[r][c]), stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1 }, svg);
      rect.addEventListener('mousemove', ev => showTip(ev, o.tip(r, c))); rect.addEventListener('mouseleave', hideTip);
      const t = o.text(r, c);
      if (t !== '') SV('text', { x: X(c) + cs / 2, y: Y(r) + cs / 2 + fs * 0.35, 'text-anchor': 'middle', 'font-size': fs, fill: '#000', 'pointer-events': 'none' }, svg).textContent = t;
    }
  }
  (o.borders || []).forEach(([r, c]) => SV('rect', { x: X(c), y: Y(r), width: cs, height: cs, fill: 'none', stroke: '#1d4ed8', 'stroke-width': 3, 'pointer-events': 'none' }, svg));
  const sx = o.cols > 14 ? 2 : 1;
  for (let c = 0; c < o.cols; c += sx) SV('text', { x: X(c) + cs / 2, y: Y(o.rows) + 16, 'text-anchor': 'middle', 'font-size': 11, fill: '#374151' }, svg).textContent = c;
  const sy = o.rows > 14 ? 2 : 1;
  for (let r = 0; r < o.rows; r += sy) SV('text', { x: ml - 8, y: Y(r) + cs / 2 + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#374151' }, svg).textContent = r;
  SV('text', { x: ml + o.cols * cs / 2, y: Hh - 10, 'text-anchor': 'middle', 'font-size': 12, fill: '#374151' }, svg).textContent = o.xlabel;
  const yl = SV('text', { x: 14, y: mt + o.rows * cs / 2, 'text-anchor': 'middle', 'font-size': 12, fill: '#374151', transform: `rotate(-90 14 ${mt + o.rows * cs / 2})` }, svg); yl.textContent = o.ylabel;
  /* Zona de carga: estrella azul + anotación con flecha */
  const px = X(o.star.c) + cs / 2, py = Y(o.star.r) + cs / 2;
  const bw = 124, bh = 26, bx = px + o.callout.ax + Math.sign(o.callout.ax) * bw / 2, by = py + o.callout.ay;
  SV('line', { x1: bx - Math.sign(o.callout.ax) * bw / 2, y1: by, x2: px + Math.sign(o.callout.ax) * 12, y2: py + (o.callout.ay ? 5 : 0), stroke: '#000', 'stroke-width': 2, 'marker-end': 'url(#hmarr)' }, svg);
  const pts = []; for (let k = 0; k < 10; k++) { const rr = k % 2 ? 4.8 : 11, a = -Math.PI / 2 + k * Math.PI / 5; pts.push((px + rr * Math.cos(a)).toFixed(1) + ',' + (py + rr * Math.sin(a)).toFixed(1)); }
  SV('polygon', { points: pts.join(' '), fill: 'blue', stroke: '#fff', 'stroke-width': 1.5, 'pointer-events': 'none' }, svg);
  SV('rect', { x: bx - bw / 2, y: by - bh / 2, width: bw, height: bh, fill: '#fff', 'fill-opacity': .95, stroke: '#000', 'stroke-width': 1.5, rx: 2 }, svg);
  SV('text', { x: bx, y: by + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#000' }, svg).textContent = '🚛 Zona de Carga';
  /* Barra de color */
  if (o.cbar) {
    const gx = ml + o.cols * cs + 22, gh = o.rows * cs, id = 'hmgr', lg = SV('linearGradient', { id, x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
    for (let k = 0; k <= 8; k++) SV('stop', { offset: k / 8, 'stop-color': escala(YLORRD, k / 8) }, lg);
    SV('rect', { x: gx, y: mt, width: 14, height: gh, fill: `url(#${id})`, stroke: '#9ca3af' }, svg);
    for (let k = 0; k <= 4; k++) {
      const v = o.cbar.min + (o.cbar.max - o.cbar.min) * k / 4;
      SV('text', { x: gx + 20, y: mt + gh - gh * k / 4 + 4, 'font-size': 11, fill: '#374151' }, svg).textContent = Math.round(v);
    }
    SV('text', { x: gx + 8, y: mt - 10, 'text-anchor': 'middle', 'font-size': 11, fill: '#374151' }, svg).textContent = o.cbar.label;
  }
  host.append(svg);
}

/* =========================================================
   MÓDULO 5 · ALMACÉN ALEATORIO (CAÓTICO)
   ========================================================= */
function appAlmAleatorio(root, sb) {
  root.append(H('h1', {}, '🎲 Algoritmo: Patio de Producto Terminado (Almacenamiento Aleatorio)'),
    H('p', { html: md('En este método, los bloques curados se acomodan dinámicamente según la disponibilidad de espacio en el **Área 6 (Producto Terminado)**. Ahorra espacio total en la bloquera, pero dispersa las tarimas de alta rotación, aumentando el recorrido del montacargas hacia el camión Foton.') }));
  sb.append(H('h3', {}, '📐 Dimensiones del Patio (Cuadrículas)'),
    wSlider('Filas de estibas', 'filas_al', 5, 20, 10, 1, dibujar), wSlider('Columnas (Profundidad)', 'col_al', 5, 20, 12, 1, dibujar));

  const nombres = ['Bloque Hueco 15x20x40 (Principal)', 'Bloque Hueco 10x20x40 (Divisorio)', 'Bloque Mitad 15x20x20', 'Adoquín Gris', 'Bloques de Merma/Defectuosos'];
  const V = 'Viajes/Mes (T_j)', Sj = 'Tarimas Promedio (S_j)';
  if (!S.skus_al) S.skus_al = nombres.map((p, i) => ({ Producto: p, [V]: [850, 420, 150, 80, 20][i], [Sj]: [25, 15, 8, 5, 3][i] }));
  const skus = S.skus_al, radioBox = H('div'), chart = H('div'), msgs = H('div'), mets = H('div'), chartSheet = H('div', { class: 'sheet' });
  sv('sel_aleat', '(Ver todos)');
  const radio = () => {
    const opts = ['(Ver todos)', ...skus.map(s => String(s.Producto))];
    if (!opts.includes(S.sel_aleat)) S.sel_aleat = '(Ver todos)';
    radioBox.replaceChildren(wRadio('🖱️ Elige un tipo de block para iluminarlo en el mapa:', 'sel_aleat', opts, S.sel_aleat, dibujar));
  };
  const colTabla = H('div', {}, H('h3', {}, '📋 Inventario y Demanda'),
    msg('info', '💡 *El Bloque Hueco 15x20x40 tiene la mayor demanda (viajes) y ocupa más tarimas.*'),
    editor([{ k: 'Producto', type: 'text' }, { k: V, type: 'int', step: 1 }, { k: Sj, type: 'int', step: 1 }], skus, { onchange: () => { radio(); dibujar(); } }), radioBox);
  const colGraf = H('div', {}, H('h3', {}, '🔥 Mapa de Calor: Dispersión del Inventario'), msgs, chartSheet, mets);
  chartSheet.append(chart);
  root.append(cols([1, 2.2], colTabla, colGraf));

  function dibujar() {
    const filas = S.filas_al, columnas = S.col_al, numCeldas = filas * columnas;
    const dist = Array.from({ length: filas }, (_, i) => Array.from({ length: columnas }, (_, j) => i + j));
    const frec = zeros(filas, columnas), nom = zeros(filas, columnas, 'Espacio Vacío');
    const total = skus.reduce((s, r) => s + Math.trunc(num(r[Sj])), 0);
    msgs.innerHTML = ''; mets.innerHTML = '';
    if (total > numCeldas) {
      chartSheet.style.display = 'none';
      msgs.append(msg('error', `⚠️ El patio es muy pequeño (${numCeldas} celdas) para el inventario requerido (${total} celdas). ¡Aumenta el tamaño en la barra lateral!`)); return;
    }
    chartSheet.style.display = '';
    const pos = choiceSinReemplazo(numCeldas, total, 42);
    let idx = 0, acum = 0;
    pos.forEach(p => {
      const r = Math.floor(p / columnas), c = p % columnas, s = skus[idx];
      frec[r][c] = num(s[V]); nom[r][c] = s.Producto;
      acum++; if (acum >= num(s[Sj])) { idx = Math.min(idx + 1, nombres.length - 1, skus.length - 1); acum = 0; }
    });
    let tw = 0; for (let i = 0; i < filas; i++) for (let j = 0; j < columnas; j++) tw += frec[i][j] * dist[i][j];

    const sel = S.sel_aleat === '(Ver todos)' ? null : S.sel_aleat;
    const mask = (r, c) => nom[r][c] === sel;
    let borders = [], title = 'Ubicación aleatoria de tarimas en el patio', zf = frec, zmin = Math.min(...flat(frec)), zmax = Math.max(...flat(frec));
    let texto = (r, c) => String(Math.round(frec[r][c]));
    if (sel !== null) {
      const cel = []; for (let r = 0; r < filas; r++) for (let c = 0; c < columnas; c++) if (mask(r, c)) cel.push([r, c]);
      if (cel.length) {
        const ds = cel.map(([r, c]) => dist[r][c]);
        msgs.append(msg('success', `💡 **${sel}** · ${cel.length} tarimas repartidas al azar · distancia promedio al camión: ${(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1)} m · máxima: ${Math.max(...ds).toFixed(0)} m. Por estar dispersas, el montacargas recorre más.`));
      } else msgs.append(msg('warning', 'Este tipo de block no tiene tarimas ubicadas en el patio.'));
      const frecSel = cel.length ? Math.max(...cel.map(([r, c]) => frec[r][c])) : 1.0;
      zf = frec.map((fila, r) => fila.map((v, c) => (mask(r, c) ? v : 0)));
      zmin = 0; zmax = Math.max(frecSel * 1.6, 1.0); borders = cel; title = `💡 Iluminado: ${sel}`;
      texto = (r, c) => (mask(r, c) ? String(Math.round(frec[r][c])) : '');
    }
    heatmap(chart, {
      rows: filas, cols: columnas, z: zf, title, xlabel: 'Columnas (Profundidad del Patio)', ylabel: 'Filas (Ancho del Patio)',
      color: z => escala(YLORRD, (z - zmin) / ((zmax - zmin) || 1)), text: texto, borders,
      tip: (r, c) => `<b>${esc(nom[r][c])}</b><br>Distancia al camión: ${dist[r][c]} metros<br>Viajes al mes: ${frec[r][c]}`,
      star: { r: 0, c: 0 }, callout: { ax: 60, ay: 0 }, cbar: { min: zmin, max: zmax, label: 'Viajes/Mes' }
    });
    mets.append(H('div', { class: 'mrow' },
      metric('🚜 Trabajo de Transporte Total (T.W.)', `${fmtN(tw, 0)} Viajes × Metro`, null, 'Mide el esfuerzo total del montacargas. Menor es mejor.'),
      metric('📦 Ocupación del Patio', `${total} / ${numCeldas} celdas`, `${((total / numCeldas) * 100).toFixed(1)}% de capacidad`)));
  }
  radio(); dibujar();
}

/* =========================================================
   MÓDULO 4 · ALMACÉN DEDICADO (ZONIFICACIÓN ABC)
   ========================================================= */
function appAlmDedicado(root, sb) {
  root.append(H('h1', {}, '📌 Algoritmo: Patio Dedicado (Zonificación ABC con Criterio Tj/Sj)'),
    H('p', { html: md('En este método, cada tipo de bloque tiene **una zona fija asignada** en el patio (Área 6). Los bloques con el índice **T<sub>j</sub> / S<sub>j</sub> más alto** (alta rotación vs espacio) se clasifican como **Zona A** y se colocan más cerca del camión. Los de rotación media son **Zona B** y los de baja rotación **Zona C**.') }));
  const UBIC = ['Esquina Superior Izquierda (0,0)', 'Centro del Patio', 'Esquina Inferior Derecha'];
  sb.append(H('h3', {}, '📐 Configuración del Patio'),
    wSlider('Filas de estibas', 'filas_ded', 5, 20, 10, 1, dibujar), wSlider('Columnas (Profundidad)', 'col_ded', 5, 20, 12, 1, dibujar),
    H('h3', {}, '🚛 Ubicación de Zona de Carga'), wSelect('Selecciona dónde estaciona el camión:', 'ubicacion_carga', UBIC, 0, dibujar));

  /* Tabla ABC (ordenada por índice descendente) */
  const nombres = ['Bloque Hueco 15x20x40 (Principal)', 'Bloque Hueco 10x20x40 (Divisorio)', 'Bloque Mitad 15x20x20', 'Adoquín Gris', 'Celosía Decorativa'];
  const viajes = [850, 400, 150, 200, 50], inv = [35, 25, 5, 15, 8];
  const df = nombres.map((p, i) => ({ Producto: p, vj: viajes[i], sj: inv[i], idx: pyRound(viajes[i] / inv[i], 2) })).sort((a, b) => b.idx - a.idx);
  df.forEach((r, i) => { r.abc = i === 0 ? 'A (Alta Prioridad)' : (i <= 2 ? 'B (Media Prioridad)' : 'C (Baja Prioridad)'); });
  const filasTabla = () => df.map(r => ({ Producto: r.Producto, 'Viajes/Mes (T_j)': r.vj, 'Tarimas Máximas (S_j)': r.sj, 'Índice (T_j / S_j)': pyF(r.idx), 'Clasificación ABC': r.abc }));
  const colorABC = (k, v) => (k !== 'Clasificación ABC' ? '' : `background-color:${v === 'A (Alta Prioridad)' ? '#ffcccc' : v === 'B (Media Prioridad)' ? '#ffffcc' : v === 'C (Baja Prioridad)' ? '#ccffcc' : 'white'};color:#111`);
  if (!('sel_abc' in S)) S.sel_abc = null;
  const tablaBox = H('div'), msgs = H('div'), chart = H('div'), mets = H('div'), sheet = H('div', { class: 'sheet' });
  const tabla = () => tablaBox.replaceChildren(
    dtable(['Producto', 'Viajes/Mes (T_j)', 'Tarimas Máximas (S_j)', 'Índice (T_j / S_j)', 'Clasificación ABC'].map(k => ({ k })), filasTabla(),
      { style: colorABC, picked: S.sel_abc, onpick: i => { S.sel_abc = (S.sel_abc === i ? null : i); tabla(); dibujar(); } }),
    H('p', { class: 'caption' }, '👆 Toca una fila de la tabla para iluminar ese tipo de block en el patio.'));
  sheet.append(chart);
  root.append(cols([1.2, 2],
    H('div', {}, H('h3', {}, '📋 Análisis ABC y Prioridad'), msg('info', '💡 *El análisis ABC divide los bloques en 3 zonas (Rojo, Amarillo, Verde) dependiendo de su índice.*'), tablaBox),
    H('div', {}, H('h3', {}, '🔥 Mapa de Zonas ABC'), msgs, sheet, mets)));
  tabla();

  function dibujar() {
    const filas = S.filas_ded, columnas = S.col_ded, numCeldas = filas * columnas;
    let mr, mc;
    if (S.ubicacion_carga === UBIC[0]) { mr = 0; mc = 0; } else if (S.ubicacion_carga === UBIC[1]) { mr = Math.floor(filas / 2); mc = Math.floor(columnas / 2); } else { mr = filas - 1; mc = columnas - 1; }
    const dist = Array.from({ length: filas }, (_, i) => Array.from({ length: columnas }, (_, j) => Math.abs(i - mr) + Math.abs(j - mc)));
    const posiciones = []; for (let i = 0; i < filas; i++) for (let j = 0; j < columnas; j++) posiciones.push([i, j]);
    posiciones.sort((a, b) => dist[a[0]][a[1]] - dist[b[0]][b[1]]);       // orden estable, igual que sorted() de Python
    const frec = zeros(filas, columnas), nom = zeros(filas, columnas, 'Espacio Libre'), zona = zeros(filas, columnas, 0);
    let ip = 0;
    df.forEach(row => {
      let vz = 1; if (row.abc.includes('A')) vz = 3; else if (row.abc.includes('B')) vz = 2;   // misma comprobación que el original
      for (let k = 0; k < Math.trunc(row.sj); k++) if (ip < numCeldas) { const [r, c] = posiciones[ip]; frec[r][c] = row.vj; nom[r][c] = row.Producto; zona[r][c] = vz; ip++; }
    });
    let tw = 0; for (let i = 0; i < filas; i++) for (let j = 0; j < columnas; j++) tw += frec[i][j] * dist[i][j];

    msgs.innerHTML = ''; mets.innerHTML = '';
    const selIdx = S.sel_abc, sel = selIdx !== null ? df[selIdx].Producto : null, mask = (r, c) => nom[r][c] === sel;
    let borders = [], title = 'Los bloques se agrupan en anillos alrededor del camión', zf = zona, zmin = Math.min(...flat(zona)), zmax = Math.max(...flat(zona));
    if (sel !== null) {
      const cel = []; for (let r = 0; r < filas; r++) for (let c = 0; c < columnas; c++) if (mask(r, c)) cel.push([r, c]);
      const fs = df[selIdx], interp = { A: 'alta rotación frente a su espacio: se coloca en el anillo más cercano al camión (rojo).', B: 'rotación media: ocupa el segundo anillo alrededor del camión (naranja).', C: 'baja rotación: va a las celdas más lejanas, donde estorba menos (verde).' }[fs.abc[0]];
      if (cel.length) {
        const ds = cel.map(([r, c]) => dist[r][c]);
        msgs.append(msg('success', `💡 **${sel}** · Zona ${fs.abc} · Índice T/S = ${pyF(fs.idx)} · ${cel.length} tarimas · distancia promedio al camión: ${(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1)} m. Se interpreta así: ${interp}`));
      } else msgs.append(msg('warning', 'Este tipo de block no cabe en el patio con el tamaño actual. Aumenta filas o columnas en la barra lateral.'));
      zf = zona.map((fila, r) => fila.map((v, c) => (mask(r, c) ? v : 0))); zmin = 0; zmax = 3; borders = cel; title = `💡 Iluminado: ${sel}`;
    }
    heatmap(chart, {
      rows: filas, cols: columnas, z: zf, title, xlabel: 'Columnas (Profundidad)', ylabel: 'Filas (Ancho)',
      color: z => ZONAS[Math.max(0, Math.min(3, Math.round(((z - zmin) / ((zmax - zmin) || 1)) * 3)))],
      text: (r, c) => (zona[r][c] > 0 && (sel === null || mask(r, c)) ? String(Math.round(frec[r][c])) : ''), borders,
      tip: (r, c) => `<b>${esc(nom[r][c])}</b><br>Distancia al camión: ${dist[r][c]} metros<br>Viajes al mes: ${frec[r][c]}`,
      star: { r: mr, c: mc }, callout: { ax: mc < Math.floor(columnas / 2) ? 60 : -60, ay: -30 }, cbar: null
    });
    mets.append(H('div', { class: 'mrow' }, metric('🚜 Trabajo de Transporte (T.W.)', `${fmtN(tw, 0)} V-m`), metric('📦 Capacidad Usada', `${ip} / ${numCeldas} celdas`)));
  }
  dibujar();
}
/* =========================================================
   MÓDULO 6 · SIMULACIÓN ANIMADA HTML5 (Canvas 500 × 890)
   ========================================================= */
function iniciarSimulacion(canvas, getSpeed, onStatus) {
  const ctx = canvas.getContext('2d');
  let speed = getSpeed(), raf = 0, vivo = true;

  const zonas = [
    { id: 16, nombre: 'Patio Maniobra (Descarga MP)', x: 100, y: 20, w: 300, h: 70, color: '#cbd5e1' },
    { id: 13, nombre: 'Almacenes MP (Tolvas Arena/Grava/Cem)', x: 160, y: 95, w: 180, h: 55, color: '#b45309' },
    { id: 9, nombre: 'Máquina Mezcladora y Vibradora (QT4-16)', x: 160, y: 155, w: 180, h: 100, color: '#fca5a5' },
    { id: 7, nombre: 'Área de Fraguado y Curado al Sol', x: 160, y: 260, w: 180, h: 160, color: '#fde047' },
    { id: 6, nombre: 'Área de Producto Terminado (PT)', x: 160, y: 425, w: 180, h: 115, color: '#86efac' },
    { id: 5, nombre: 'Estacionamiento y Logística', x: 160, y: 545, w: 180, h: 55, color: '#94a3b8' },
    { id: 3, nombre: 'Oficinas Administrativas y Serv.', x: 160, y: 605, w: 180, h: 75, color: '#93c5fd' },
    { id: 1, nombre: 'Caseta de Control de Accesos', x: 220, y: 685, w: 60, h: 55, color: '#fdba74' }
  ];

  /* Banderas de coordinación entre los actores del proceso */
  const flags = { grisListo: false, atencion: false, clienteDeVuelta: false, clienteActivo: false, ptCount: 0 };
  const INTERVALO_CLIENTE = 20000;   // un cliente cada 20 segundos
  let proximoCliente = performance.now() + INTERVALO_CLIENTE;

  /* Camión de reparto */
  const rutaCamion = [
    { x: 600, y: 855, accion: 'mover', icono: '🚚', titulo: 'Transporte Externo', desc: 'Camión circulando por la carretera bidireccional inferior (hacia la derecha).' },
    { x: 600, y: 815, accion: 'mover', icono: '🚚', titulo: 'Transporte Externo', desc: 'Incorporándose al carril superior (sentido derecha a izquierda).' },
    { x: 375, y: 815, accion: 'mover', icono: '👮', titulo: 'Caseta de Control', desc: 'Autoriza la entrada del transporte pesado abriendo la barrera de seguridad.' },
    { x: 375, y: 50, accion: 'mover', icono: '🚚', titulo: 'Transporte de Materia Prima', desc: 'Ascendiendo por el carril derecho de la planta hacia el patio trasero.' },
    { x: 250, y: 50, accion: 'descargar', icono: '📦', titulo: 'Patio de Maniobras', desc: 'Descarga de agregados pétreos (arena y grava) para almacenamiento.' },
    { x: 125, y: 50, accion: 'mover', icono: '🚚', titulo: 'Logística Interna', desc: 'Desplazándose hacia el carril izquierdo de la planta.' },
    { x: 125, y: 480, accion: 'cargar', icono: '🏗️', titulo: 'Transporte de Block Terminado', desc: 'Cargando tarimas de producto terminado en el área de PT.' },
    { x: 125, y: 815, accion: 'mover', icono: '🚚', titulo: 'Salida de Planta', desc: 'Dirigiéndose hacia la caseta para control de salida y báscula.' },
    { x: -100, y: 815, accion: 'mover', icono: '🌐', titulo: 'Distribución Comercial', desc: 'Camión saliendo a ruta de entrega y distribución final.' }
  ];
  /* Tráfico de la carretera */
  const rutaTraficoSuperior = [{ x: 600, y: 810, accion: 'mover' }, { x: -100, y: 810, accion: 'mover' }];
  const rutaTraficoInferior = [{ x: -100, y: 855, accion: 'mover' }, { x: 600, y: 855, accion: 'mover' }];
  /* Materia prima: la mueven TRABAJADORES */
  const rutaArena = [{ x: 180, y: 115, accion: 'cargar' }, { x: 250, y: 190, accion: 'descargar' }];
  const rutaGrava = [{ x: 250, y: 115, accion: 'cargar' }, { x: 250, y: 190, accion: 'descargar' }];
  const rutaCemento = [{ x: 320, y: 115, accion: 'cargar' }, { x: 250, y: 190, accion: 'descargar' }];
  /* Mezcladora: el MONTACARGAS lleva el block recién prensado (gris) al curado */
  const rutaMontacargas = [
    { x: 222, y: 235, accion: 'cargar', espera_hasta: () => !flags.grisListo },
    { x: 222, y: 290, accion: 'descargar', alllegar: () => { flags.grisListo = true; } },
    { x: 222, y: 235, accion: 'mover' }
  ];
  /* Curado: una PERSONA recibe el block gris, lo cura (pasa a blanco) y lo lleva a PT */
  const rutaCuradoSecado = [
    { x: 262, y: 305, accion: 'esperar', espera_hasta: () => flags.grisListo, alllegar: v => { flags.grisListo = false; v.carga = '⬛'; v.espera = 40; } },
    { x: 262, y: 345, accion: 'mover', alllegar: v => { v.espera = 150; } },
    { x: 262, y: 347, accion: 'mover', alllegar: v => { v.carga = '⬜'; v.espera = 40; } },
    { x: 262, y: 480, accion: 'descargar', alllegar: () => { flags.ptCount = Math.min(flags.ptCount + 1, 24); } },
    { x: 262, y: 305, accion: 'mover' }
  ];
  const rutaOficinasPersonal = [{ x: 180, y: 640, accion: 'esperar' }, { x: 320, y: 640, accion: 'esperar' }];
  /* CLIENTE: auto particular que llega cada 20 s */
  const rutaClienteAuto = [
    { x: 540, y: 810, accion: 'mover' },
    { x: 190, y: 810, accion: 'mover' },
    { x: 190, y: 718, accion: 'mover', alllegar: () => {
      const p = entidades.find(e => e.id === 'CLp');
      p.visible = true; p.idx = 0; p.x = 168; p.y = 718; p.espera = 25; flags.clienteDeVuelta = false;
    } },
    { x: 190, y: 718, accion: 'mover', espera_hasta: () => flags.clienteDeVuelta, alllegar: v => { v.espera = 25; } },
    { x: 190, y: 810, accion: 'mover' },
    { x: -60, y: 810, accion: 'mover', alllegar: v => { v.visible = false; flags.clienteActivo = false; } }
  ];
  const rutaClientePersona = [
    { x: 168, y: 718, accion: 'mover' },
    { x: 168, y: 692, accion: 'mover' },
    { x: 205, y: 658, accion: 'esperar', alllegar: v => { flags.atencion = true; v.espera = Math.round(400 / speed) + 60; } },
    { x: 205, y: 658, accion: 'mover', alllegar: () => { flags.atencion = false; } },
    { x: 168, y: 692, accion: 'mover' },
    { x: 168, y: 718, accion: 'mover', alllegar: v => { v.visible = false; flags.clienteDeVuelta = true; } }
  ];

  const entidades = [
    { id: 'T1', tipo: 'Auto', icono: '🚗', ruta: rutaTraficoSuperior, idx: 0, x: 400, y: 810, espera: 0, carga: '', velMult: 1.6 },
    { id: 'T2', tipo: 'Auto', icono: '🚙', ruta: rutaTraficoSuperior, idx: 0, x: 200, y: 810, espera: 0, carga: '', velMult: 1.3 },
    { id: 'T3', tipo: 'Auto', icono: '🚕', ruta: rutaTraficoInferior, idx: 0, x: 0, y: 855, espera: 0, carga: '', velMult: 1.4 },
    { id: 'T4', tipo: 'Auto', icono: '🚐', ruta: rutaTraficoInferior, idx: 0, x: 300, y: 855, espera: 0, carga: '', velMult: 1.2 },
    { id: 'C1', tipo: 'Camión Bloquero', icono: '🚚', ruta: rutaCamion, idx: 0, x: 600, y: 855, espera: 0, carga: '🪨', velMult: 1 },
    { id: 'A1', tipo: 'Trabajador', icono: '👷', ruta: rutaArena, idx: 0, x: 180, y: 115, espera: 0, carga: '🟡', cargaBase: '🟡', velMult: 0.8 },
    { id: 'G1', tipo: 'Trabajador', icono: '👷', ruta: rutaGrava, idx: 0, x: 250, y: 115, espera: 0, carga: '🪨', cargaBase: '🪨', velMult: 0.8 },
    { id: 'Cem', tipo: 'Trabajador', icono: '👷', ruta: rutaCemento, idx: 0, x: 320, y: 115, espera: 0, carga: '⚪', cargaBase: '⚪', velMult: 0.8 },
    { id: 'M2', tipo: 'Montacargas', icono: '', dibujo: 'montacargas', ruta: rutaMontacargas, idx: 0, x: 222, y: 235, espera: 0, carga: '', velMult: 0.8 },
    { id: 'O1', tipo: 'Operario de curado', icono: '🧑‍🏭', ruta: rutaCuradoSecado, idx: 0, x: 262, y: 305, espera: 0, carga: '', velMult: 0.7 },
    { id: 'Of1', tipo: 'Oficinista', icono: '🧑‍💼', ruta: rutaOficinasPersonal, idx: 0, x: 180, y: 640, espera: 0, carga: '📄', velMult: 0.5 },
    { id: 'Of2', tipo: 'Gerente', icono: '👩‍💼', ruta: rutaOficinasPersonal, idx: 0, x: 320, y: 640, espera: 0, carga: '📋', velMult: 0.4 },
    { id: 'CLa', tipo: 'Cliente (auto)', icono: '🚘', ruta: rutaClienteAuto, idx: 0, x: 540, y: 810, espera: 0, carga: '', velMult: 1.2, visible: false },
    { id: 'CLp', tipo: 'Cliente', icono: '🧑', ruta: rutaClientePersona, idx: 0, x: 168, y: 718, espera: 0, carga: '', velMult: 0.6, visible: false, etiqueta: 'Cliente' }
  ];

  function lanzarCliente() {
    flags.clienteActivo = true; flags.atencion = false; flags.clienteDeVuelta = false;
    proximoCliente = performance.now() + INTERVALO_CLIENTE;
    const auto = entidades.find(e => e.id === 'CLa');
    auto.visible = true; auto.idx = 0; auto.x = 540; auto.y = 810; auto.espera = 0;
    const p = entidades.find(e => e.id === 'CLp');
    p.visible = false; p.idx = 0; p.x = 168; p.y = 718; p.espera = 0;
  }

  function drawBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 780, 500, 110);
    ctx.fillStyle = '#facc15'; for (let i = 10; i < 500; i += 35) ctx.fillRect(i, 830, 18, 3);
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(100, 0, 50, 780); ctx.fillRect(350, 0, 50, 780);
    zonas.forEach(z => {
      ctx.fillStyle = z.color; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(z.nombre, z.x + (z.w / 2), z.y + (z.h / 2));
    });
    ctx.fillStyle = 'rgba(22, 163, 74, 0.5)'; ctx.fillRect(245, 95, 10, 330);
    /* Block gris recién prensado esperando en la entrada del curado */
    if (flags.grisListo) {
      ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1;
      ctx.fillRect(236, 296, 14, 10); ctx.strokeRect(236, 296, 14, 10);
    }
    /* Blocks blancos (curados) acumulados en producto terminado */
    for (let i = 0; i < flags.ptCount; i++) {
      const bx = 172 + (i % 12) * 13, by = 530 - Math.floor(i / 12) * 11;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
      ctx.fillRect(bx, by, 11, 8); ctx.strokeRect(bx, by, 11, 8);
    }
  }

  function drawCasetaAndBarrier() {
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('👮', 250, 715);
    const camion = entidades.find(e => e.id === 'C1');
    const distToControl = Math.abs(camion.y - 750);
    const barreraAbierta = (camion.x < 150 || camion.x > 350) && distToControl < 90;
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4;
    ctx.beginPath();
    if (barreraAbierta && camion.x < 150) { ctx.moveTo(150, 760); ctx.lineTo(150, 710); } else { ctx.moveTo(150, 760); ctx.lineTo(100, 760); }
    ctx.stroke();
    ctx.beginPath();
    if (barreraAbierta && camion.x > 350) { ctx.moveTo(350, 760); ctx.lineTo(350, 710); } else { ctx.moveTo(350, 760); ctx.lineTo(400, 760); }
    ctx.stroke();
  }

  function update() {
    speed = getSpeed();
    const ahora = performance.now();
    if (!flags.clienteActivo && ahora >= proximoCliente) lanzarCliente();
    entidades.forEach(v => {
      if (v.visible === false) return;
      /* El oficinista se acerca al cliente mientras lo atiende */
      if (v.id === 'Of1' && flags.atencion) {
        const tx = 232, ty = 654, ddx = tx - v.x, ddy = ty - v.y, dd = Math.sqrt(ddx * ddx + ddy * ddy), sp = speed * 0.9;
        if (dd > sp) { v.x += (ddx / dd) * sp; v.y += (ddy / dd) * sp; } else { v.x = tx; v.y = ty; }
        return;
      }
      if (v.espera > 0) { v.espera--; return; }
      const target = v.ruta[v.idx], dx = target.x - v.x, dy = target.y - v.y, dist = Math.sqrt(dx * dx + dy * dy), currentSpeed = speed * v.velMult;
      if (dist < currentSpeed) {
        v.x = target.x; v.y = target.y;
        /* Espera hasta que se cumpla la condición del punto (coordinación entre actores) */
        if (target.espera_hasta && !target.espera_hasta()) return;
        if (target.accion === 'descargar') { v.espera = 50; v.carga = ''; }
        else if (target.accion === 'cargar') {
          v.espera = 50;
          if (v.tipo === 'Camión Bloquero') { v.carga = '🧱'; flags.ptCount = 0; }
          else if (v.id === 'M2') v.carga = '⬛';
          else if (v.cargaBase) v.carga = v.cargaBase;
        } else if (target.accion === 'esperar') v.espera = 25;
        if (target.alllegar) target.alllegar(v);
        if (v.id === 'C1' && onStatus) onStatus({ icono: target.icono, titulo: target.titulo, desc: target.desc });
        v.idx++;
        if (v.idx >= v.ruta.length) {
          v.idx = 0; v.x = v.ruta[0].x; v.y = v.ruta[0].y;
          if (v.tipo === 'Camión Bloquero') v.carga = '🪨';
        }
      } else { v.x += (dx / dist) * currentSpeed; v.y += (dy / dist) * currentSpeed; }
    });
  }

  function dibujarMontacargas(v) {
    const x = v.x, y = v.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 12, 17, 4, 0, 0, Math.PI * 2); ctx.fill();
    /* mástil y horquillas */
    ctx.fillStyle = '#374151'; ctx.fillRect(x + 11, y - 14, 3, 24); ctx.fillRect(x + 11, y + 7, 13, 3);
    /* cuerpo */
    ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.5;
    ctx.fillRect(x - 13, y - 6, 24, 13); ctx.strokeRect(x - 13, y - 6, 24, 13);
    /* cabina y techo */
    ctx.fillStyle = '#fde68a'; ctx.fillRect(x - 9, y - 13, 11, 8); ctx.strokeRect(x - 9, y - 13, 11, 8);
    ctx.fillStyle = '#7c2d12'; ctx.fillRect(x - 11, y - 15, 15, 3);
    /* ruedas */
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.arc(x - 7, y + 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, y + 8, 4, 0, Math.PI * 2); ctx.fill();
    /* carga sobre las horquillas */
    if (v.carga !== '') {
      ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1;
      ctx.fillRect(x + 14, y - 2, 11, 8); ctx.strokeRect(x + 14, y - 2, 11, 8);
    }
  }

  function drawEntities() {
    entidades.forEach(v => {
      if (v.visible === false) return;
      if (v.dibujo === 'montacargas') { dibujarMontacargas(v); return; }
      ctx.beginPath(); ctx.arc(v.x, v.y, 14, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000000';
      ctx.fillText(v.icono, v.x, v.y + 1);
      if (v.carga !== '') { ctx.font = '11px sans-serif'; ctx.fillText(v.carga, v.x + 13, v.y - 12); }
      if (v.etiqueta) {
        ctx.font = 'bold 9px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
        ctx.strokeText(v.etiqueta, v.x, v.y + 24); ctx.fillStyle = '#0f172a'; ctx.fillText(v.etiqueta, v.x, v.y + 24);
      }
    });
  }

  function drawAtencion() {
    const of1 = entidades.find(e => e.id === 'Of1');
    if (flags.atencion && Math.abs(of1.x - 232) < 3 && Math.abs(of1.y - 654) < 3) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
      ctx.fillRect(176, 614, 86, 20); ctx.strokeRect(176, 614, 86, 20);
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧾 Pedido presencial', 219, 625);
    }
  }

  function drawHUD() {
    let l1, l2;
    if (flags.clienteActivo) { l1 = '🚗 Cliente en planta'; l2 = 'pedido presencial'; }
    else { const s = Math.max(0, Math.ceil((proximoCliente - performance.now()) / 1000)); l1 = '🚗 Próximo cliente'; l2 = 'en ' + s + ' s'; }
    ctx.fillStyle = 'rgba(15,23,42,0.88)'; ctx.fillRect(4, 4, 92, 34);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px sans-serif'; ctx.fillText(l1, 50, 15);
    ctx.font = '10px sans-serif'; ctx.fillText(l2, 50, 28);
  }

  function loop() {
    if (!vivo) return;
    update(); drawBackground(); drawCasetaAndBarrier(); drawEntities(); drawAtencion(); drawHUD();
    raf = requestAnimationFrame(loop);
  }
  loop();
  return () => { vivo = false; cancelAnimationFrame(raf); };
}

function appEjemSim(root, sb) {
  root.append(H('h1', {}, '🧱 Simulación animada de flujo de producción empresa de block cacahuate'),
    H('p', {}, "Representación del layout con entrada en 'U', carretera externa bidireccional, caseta interactiva, flujo administrativo y convergencia de las 3 materias primas (Arena, Grava y Cemento)."));
  const live = H('div', { class: 'live alert info' }, '⏳ Iniciando simulación…');
  sb.append(H('h3', {}, '🎛️ Controles de Simulación'), wSlider('Velocidad de Simulación', 'velocidad', 1, 5, 2, 1),
    H('hr'), H('h3', {}, '🔍 Estado y Proceso en Vivo'), live,
    H('div', { class: 'alert success', html: `
      <h3>🏭 Guía de Procesos de la Bloquera:</h3>
      <ul>
        <li><b>🚚 Transporte de Materia Prima:</b> Ingreso de agregados (arena, grava y cemento) a través de la garita y patio de maniobras.</li>
        <li><b>⚙️ Máquina Mezcladora y Vibradora (QT4-16):</b> Integra y moldea los componentes para fabricar el block fresco.</li>
        <li><b>☀️ Área de Fraguado y Secado:</b> Transforma el block fresco (<code>⬛</code>) en block de alta resistencia (<code>⬜</code>).</li>
        <li><b>📦 Área de Producto Terminado:</b> Almacenamiento y carga directa al camión de distribución.</li>
        <li><b>🧑‍💼 Oficinas y Caseta:</b> Control administrativo, facturación, remisiones y vigilancia de accesos.</li>
        <li><b>🚗 Cliente:</b> Cada 20 segundos llega un cliente particular, se estaciona junto a la caseta, baja del auto y entra a las oficinas, donde un oficinista lo atiende. En la bloquera se pueden hacer <b>pedidos de manera presencial</b>; después el cliente regresa a su auto y se retira por la carretera.</li>
      </ul>` }));
  const canvas = H('canvas', { id: 'simCanvas', width: 500, height: 890 });
  root.append(H('div', { class: 'simwrap' }, H('div', { id: 'canvas-container' }, canvas)));
  const stop = iniciarSimulacion(canvas, () => S.velocidad, st => { live.innerHTML = `<b>${st.icono} ${esc(st.titulo)}</b><br>${esc(st.desc)}`; });
  return stop;
}
/* =========================================================
   NAVEGACIÓN (barra lateral derecha / drawer móvil) Y ARRANQUE
   ========================================================= */
const OPCIONES = [
  '1. Simulador Completo SHA (Reporte PDF)',
  '2. Matriz SHA Interactiva (Tablero)',
  '3. Diagrama de Relaciones',
  '4. Almacén Dedicado (ABC)',
  '5. Almacén Aleatorio (Caótico)',
  '6. Simulación Animada HTML5'
];
const MODULOS = [appSha2, appTablRel, appDiagRel, appAlmDedicado, appAlmAleatorio, appEjemSim];
let moduloActual = -1, limpiarModulo = null;

function abrirMenu(abrir) {
  $('#sidebar').classList.toggle('open', abrir);
  $('#backdrop').classList.toggle('on', abrir);
}

function irA(i) {
  if (typeof limpiarModulo === 'function') limpiarModulo();
  limpiarModulo = null; hideTip();
  moduloActual = i;
  const vista = $('#view'), sb = $('#sbControls');
  vista.innerHTML = ''; sb.innerHTML = '';
  document.querySelectorAll('.nav-item').forEach((n, k) => n.classList.toggle('on', k === i));
  limpiarModulo = MODULOS[i](vista, sb) || null;
  window.scrollTo({ top: 0 });
  abrirMenu(false);
}

function iniciarApp() {
  const nav = $('#nav');
  OPCIONES.forEach((o, i) => nav.append(H('div', { class: 'nav-item', role: 'button', tabindex: 0, onclick: () => irA(i),
    onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irA(i); } } }, H('span', { class: 'dot' }), H('span', {}, o))));
  $('#menuBtn').addEventListener('click', () => abrirMenu(true));
  $('#closeBtn').addEventListener('click', () => abrirMenu(false));
  $('#backdrop').addEventListener('click', () => abrirMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') abrirMenu(false); });
  irA(0);
}

document.addEventListener('DOMContentLoaded', () => {
  $('#app').style.visibility = 'hidden';
  iniciarApp();
  splash().then(() => { $('#app').style.visibility = 'visible'; });
});