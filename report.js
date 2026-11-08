'use strict';
/* =========================================================
   ALPHA BLOCKS · report.js
   Reporte técnico completo (S.H.A. + S.L.P.) en PDF.
   Reutiliza MiniPDF, el estado S y las funciones de app.js.
   ========================================================= */
const RP_AZ = [31, 78, 121], RP_CL = [220, 230, 241], RP_GR = [105, 113, 124], RP_RJ = [200, 40, 40], RP_LN = [190, 197, 206];
const rpT = x => {
  let s = String(x ?? '');
  for (const [a, b] of [['→', '->'], ['–', '-'], ['—', '-'], ['≈', '~'], ['≥', '>='], ['≤', '<='], ['’', "'"], ['“', '"'], ['”', '"'], ['•', '-'], ['≡', '='], ['↔', '<->']]) s = s.split(a).join(b);
  return [...s].map(c => (c.charCodeAt(0) > 255 ? '?' : c)).join('');
};
const rpRG = c => c.map(v => +(v / 255).toFixed(3)).join(' ');
const rpF = n => +Number(n).toFixed(2);
const rpHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rpN = (v, d) => (v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v))) ? 'pendiente' :
  (typeof v === 'number' ? fmtN(v, d !== undefined ? d : (Number.isInteger(v) ? 0 : 2)) : rpT(v));
const gd = (k, d) => { const x = parseFloat(_ss(k, d)); return Number.isFinite(x) ? x : d; };
const rpClase = tw => (tw >= 1800 ? 'A' : tw >= 400 ? 'E' : tw >= 200 ? 'I' : 'O');

/* ---------------- Datos documentados del proyecto (Unidad 2) ---------------- */
const RP_MATS = [
  ['MP-01', 'Cemento', 'Materia prima', 'Sólido pulverulento', 'kg'], ['MP-02', 'Arena', 'Materia prima', 'Sólido granular', 'kg'],
  ['MP-03', 'Gravilla', 'Materia prima', 'Sólido granular', 'kg'], ['MP-04', 'Agua', 'Materia prima', 'Líquido', 'L'],
  ['PP-01', 'Mezcla de concreto semiseca', 'Producto en proceso', 'Mezcla semiseca', 'kg'], ['PP-02', 'Bloque recién moldeado', 'Producto en proceso', 'Sólido moldeado', 'piezas'],
  ['BH-152040-2C', 'Bloque hueco de concreto 15×20×40 cm', 'Producto terminado', 'Sólido', 'piezas']];
const RP_EQ = [
  ['EQ-01', 'Máquina QT4-16', '1', 'Máquina para fabricar bloques', 'Mezclado, moldeado y compactación'],
  ['EQ-02', 'Banda transportadora', '2', 'Longitud de 13 m', 'Transporte de materiales sólidos'],
  ['EQ-03', 'Banda transportadora', '1', 'Longitud de 7 m', 'Transporte de materiales sólidos'],
  ['EQ-04', 'Manguera', '20 m', 'Conducto flexible', 'Suministro de agua'],
  ['EQ-05', 'Vehículo FOTON Aumark S5', '2', 'Vehículo de reparto', 'Distribución del producto terminado'],
  ['EQ-06', 'Patín hidráulico Uline H-6710', '2', 'Capacidad 5,500 lb; horquillas 122 × 53 cm', 'Desplazamiento de tarimas y cargas'],
  ['EQ-07', 'Montacargas industrial diésel', '3', 'Capacidad anunciada 3,000 kg (variante seleccionada)', 'Elevación, carga, descarga y traslado de tarimas'],
  ['EQ-08', 'Palas', '9', 'Herramientas manuales', 'Manipulación de materiales'],
  ['EQ-09', 'Tarima de madera reforzada', 'según operación', '1.20 × 1.00 m; capacidad dinámica nominal 2,000 kg; 100 bloques', 'Agrupación, almacenamiento y transporte de cargas unitarias'],
  ['EQ-10', 'Estante móvil de curado', '65', 'Acero a medida 1.70 × 1.20 × 2.40 m; 8 niveles × 3 tableros; 120 bloques', 'Sostener tableros con bloques frescos en traslado y curado'],
  ['EQ-11', 'Estibador semieléctrico Uline H-5440', '3', 'Elevación eléctrica hasta 3.48 m; horquillas 1.07 m', 'Elevar tableros de 5 bloques frescos a las guías del estante']];
const RP_7R = [
  ['Material correcto', 'Utilizar los materiales requeridos en cada operación.', 'Códigos internos MP-01 a MP-04 para verificar el material antes del mezclado.'],
  ['Cantidad adecuada', 'Suministrar las cantidades necesarias.', 'Dosificación por bloque y registros de dosificación (7,450 bloques/día).'],
  ['Condición requerida', 'Conservar características físicas y de calidad.', 'Cemento protegido de la humedad; manipulación cuidadosa de bloques frescos.'],
  ['Secuencia y orientación correcta', 'Mantener el orden de las operaciones y la estabilidad.', 'Secuencia almacén-suministro-mezclado-moldeado-curado-producto terminado.'],
  ['Lugar correcto', 'Ubicar cada material en el área que corresponde.', 'Almacenes separados de cemento, arena y gravilla con bandas hacia la mezcladora.'],
  ['Tiempo oportuno', 'Disponer del material cuando el proceso lo requiere.', 'Abastecimiento coordinado con la QT4-16 (mezclado de 28 s; ciclo de referencia de la Unidad 1).'],
  ['Costo óptimo', 'Manejo eficiente con el menor costo total.', 'Evaluación de bandas, energía, mantenimiento y recorridos (Req. 17 y 18).']];
const RP_RATIO = { cem: 1.0, are: 4.56, gra: 4.56, agu: 0.30 };   // kg o L por bloque (dosificación provisional de la Hoja de ruta)

function rpDatos() {
  const prod = gd('d2_prod', 7450), peso = gd('d2_peso', 13.2), tar = gd('d2_tarima', 100), dias = gd('d2_dias', 26);
  const kgC = prod * RP_RATIO.cem, kgA = prod * RP_RATIO.are, kgG = prod * RP_RATIO.gra, lAg = prod * RP_RATIO.agu, kgB = prod * peso;
  const R = (n, cod, de, a, mat, dist, t, cuant, metodo, nota) => ({ n, cod, de, a, mat, dist, t, cuant, metodo, nota, tw: (cuant && t != null) ? t * dist : null });
  const rutas = [
    R(1, 'M01', 'Almacén de cemento', 'Dosificación / mezcladora', 'Cemento (sacos 50 kg)', 13, kgC / 1000, true, 'Banda transportadora recta', '1 saco de 50 kg cada 25 s'),
    R(2, 'M02', 'Almacén de grava', 'Tolva / mezcladora', 'Grava (cubetas de 20 kg)', 13, kgG / 1000, true, 'Banda transportadora recta', 'Dosificación provisional'),
    R(3, 'M03', 'Almacén de arena', 'Tolva / mezcladora', 'Arena (cubetas de 20 kg)', 7, kgA / 1000, true, 'Banda transportadora recta', 'Dosificación provisional'),
    R(4, 'M04', 'Cisterna / depósito', 'Mezcladora', 'Agua de mezclado', 12, lAg / 1000, false, 'Tubería / manguera con medición', 'Distancia por confirmar'),
    R(5, 'M05', 'Mezcladora', 'Máquina QT4-16', 'Mezcla de concreto', 2, (kgC + kgA + kgG + lAg) / 1000, false, 'Descarga a tolva de moldeo', 'Distancia por confirmar'),
    R(6, 'M06', 'Máquina QT4-16', 'Curado y secado', 'Bloques recién fabricados', 19.5, kgB / 1000, true, 'Tableros, estibador y estante móvil', 'Traslado delicado; evitar apilar bloques frescos'),
    R(7, 'M07', 'Curado y secado', 'Inspección de calidad', 'Bloques en curado', 13.75, null, false, 'Traslado por lotes liberados', 'Flujo diferido por tiempo de curado'),
    R(8, 'M08', 'Curado y secado', 'Laboratorio de calidad', 'Muestras de bloques', 13.75, null, false, 'Muestreo y traslado controlado', 'Cantidad según plan de muestreo (por definir)'),
    R(9, 'M09', 'Inspección / curado', 'Producto terminado', 'Bloques aprobados', 24.25, kgB / 1000, true, 'Montacargas y tarimas', 'Producción menos rechazos (sin tasa medida)'),
    R(10, 'M10', 'Producción / inspección', 'Material no conforme', 'Bloques no conformes', 9.75, null, false, 'Traslado segregado', 'Sin tasa de rechazo medida'),
    R(11, 'M11', 'Producto terminado', 'Preparación de pedidos', 'Tarimas de bloques', 18.75, kgB / 1000, true, 'Montacargas', 'Según pedidos'),
    R(12, 'M12', 'Preparación de pedidos', 'Muelle de carga', 'Tarimas de bloques', 18.75, kgB / 1000, true, 'Montacargas', 'Capacidad prevista 100 bloques/tarima')];
  const twTot = rutas.reduce((s, r) => s + (r.tw || 0), 0);
  return { prod, peso, tar, dias, kgC, kgA, kgG, lAg, kgB, mensual: prod * dias, anual: prod * dias * 12, rutas, twTot, tarDia: prod / tar };
}

/* ---------------- Código 39 ---------------- */
const RP_C39 = { '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn',
  N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '*': 'nwnnwnwnn' };

/* =========================================================
   Clase PDF del reporte
   ========================================================= */
class RP extends MiniPDF {
  constructor(tocPrev) { super(); this.setAutoPageBreak(true, 16); this.tm = 16; this.toc = []; this.tocPrev = tocPrev; }
  header() {
    if (this.pages.length < 2) return;
    this.txt(10, 9, 'ALPHA BLOCKS - Equipo Cacahuate | Reporte técnico S.H.A. / S.L.P.', { s: 8, st: 'I', c: RP_GR });
    this.line(10, 11, 200, 11, 0.3, RP_LN);
  }
  footer() { if (this.pages.length < 2) return; this.txt(105, 290, 'Página ' + this.pageNo(), { s: 8, st: 'I', al: 'C', c: RP_GR }); }
  /* ---- primitivas ---- */
  txt(x, y, t, o = {}) {
    const s = o.s || 9, st = o.st || '', c = o.c || [0, 0, 0], k = this.k, ks = this.style, kz = this.size, str = rpT(t);
    this.style = st; this.size = s; const tw = this.strW(str); this.style = ks; this.size = kz;
    const dx = o.al === 'C' ? -tw / 2 : o.al === 'R' ? -tw : 0, F = st === 'B' ? 'F2' : st === 'I' ? 'F3' : 'F1', e = str.replace(/[\\()]/g, '\\$&');
    this.pages[this.pages.length - 1] += `q ${rpRG(c)} rg BT /${F} ${s} Tf ${rpF((x + dx) * k)} ${rpF((this.Hh - y) * k)} Td (${e}) Tj ET Q\n`;
  }
  line(x1, y1, x2, y2, w = 0.4, c = [0, 0, 0], dash) {
    const k = this.k;
    this.pages[this.pages.length - 1] += `q ${rpRG(c)} RG ${w} w ${dash ? '[2 1.5] 0 d ' : ''}${rpF(x1 * k)} ${rpF((this.Hh - y1) * k)} m ${rpF(x2 * k)} ${rpF((this.Hh - y2) * k)} l S Q\n`;
  }
  box(x, y, w, h, fill, stroke, lw) {
    const k = this.k, op = fill && stroke ? 'B' : fill ? 'f' : 'S';
    this.pages[this.pages.length - 1] += `q ${fill ? rpRG(fill) + ' rg ' : ''}${stroke ? rpRG(stroke) + ' RG ' : ''}${lw || 0.4} w ${rpF(x * k)} ${rpF((this.Hh - y - h) * k)} ${rpF(w * k)} ${rpF(h * k)} re ${op} Q\n`;
  }
  poly(pts, fill, stroke, lw) {
    const k = this.k, op = fill && stroke ? 'B' : fill ? 'f' : 'S';
    const d = pts.map(([x, y], i) => `${rpF(x * k)} ${rpF((this.Hh - y) * k)} ${i ? 'l' : 'm'}`).join(' ') + ' h';
    this.pages[this.pages.length - 1] += `q ${fill ? rpRG(fill) + ' rg ' : ''}${stroke ? rpRG(stroke) + ' RG ' : ''}${lw || 0.4} w ${d} ${op} Q\n`;
  }
  polyline(pts, c, w) {
    const k = this.k, d = pts.map(([x, y], i) => `${rpF(x * k)} ${rpF((this.Hh - y) * k)} ${i ? 'l' : 'm'}`).join(' ');
    this.pages[this.pages.length - 1] += `q ${rpRG(c)} RG ${w || 0.6} w ${d} S Q\n`;
  }
  arrow(x1, y1, x2, y2, c = [0, 0, 0], w = 0.5, dash) {
    this.line(x1, y1, x2, y2, w, c, dash);
    const a = Math.atan2(y2 - y1, x2 - x1), L = 2.3;
    this.poly([[x2, y2], [x2 - L * Math.cos(a - 0.45), y2 - L * Math.sin(a - 0.45)], [x2 - L * Math.cos(a + 0.45), y2 - L * Math.sin(a + 0.45)]], c);
  }
  wrap(t, w, s, st) {
    const ks = this.style, kz = this.size; this.style = st || ''; this.size = s; const out = [];
    for (const par of rpT(t).split('\n')) {
      let cur = '';
      for (const word of par.split(/\s+/).filter(Boolean)) { const test = cur ? cur + ' ' + word : word; if (!cur || this.strW(test) <= w) cur = test; else { out.push(cur); cur = word; } }
      out.push(cur);
    }
    this.style = ks; this.size = kz; return out;
  }
  boxText(x, y, w, h, t, s, st, c) {
    const ls = this.wrap(t, w - 2, s, st), lh = s * 0.42;
    ls.forEach((l, j) => this.txt(x + w / 2, y + h / 2 - (ls.length - 1) * lh / 2 + j * lh + s * 0.116, l, { s, st, c, al: 'C' }));
  }
  ensure(h) { if (this.y + h > this.Hh - 16) this.addPage(); }
  /* ---- estructura ---- */
  H1(t, need) {
    this.ensure(need || 60); this.y += 3; this.box(10, this.y, 190, 8, RP_AZ);
    this.txt(13, this.y + 5.6, t, { s: 11, st: 'B', c: [255, 255, 255] }); this.toc.push([t, this.pageNo()]); this.y += 11;
  }
  H2(t) { this.ensure(40); this.y += 2; this.txt(10, this.y + 4, t, { s: 10, st: 'B', c: RP_AZ }); this.line(10, this.y + 5.5, 200, this.y + 5.5, 0.3, RP_AZ); this.y += 8; }
  P(t, o = {}) {
    const s = o.s || 9, ind = o.ind || 0;
    this.wrap(t, 189 - ind, s, o.st || '').forEach(l => { this.ensure(5); this.txt(10 + ind, this.y + 3.4, l, { s, st: o.st || '', c: o.c }); this.y += s * 0.47; });
    this.y += 1.2;
  }
  B(t) { this.P('- ' + t, { ind: 3 }); }
  NOTA(t) { this.P(t, { s: 7.5, st: 'I', c: RP_GR }); }
  FIN(finalidad, interp) { if (finalidad) this.P('Finalidad: ' + finalidad); if (interp) this.P('Interpretación: ' + interp); }
  TB(cols, rows, o = {}) {
    const sum = cols.reduce((a, c) => a + c.w, 0), W = cols.map(c => c.w * 190 / sum), fs = o.fs || 7.2, lh = fs * 0.42;
    const draw = (r, head, zebra, bold) => {
      const lines = r.map((v, i) => this.wrap(head ? String(v) : (typeof v === 'number' ? rpN(v, cols[i].d) : String(v ?? '')), W[i] - 2, fs, head || bold ? 'B' : ''));
      const h = Math.max(...lines.map(l => l.length)) * lh + 2.4;
      if (this.y + h > this.Hh - 16) { this.addPage(); if (!head) draw(cols.map(c => c.h), true); }
      let x = 10;
      lines.forEach((ls, i) => {
        this.box(x, this.y, W[i], h, head ? RP_CL : (zebra ? [247, 249, 252] : [255, 255, 255]), RP_LN, 0.25);
        const al = head ? 'C' : (cols[i].al || 'L');
        ls.forEach((l, j) => this.txt(al === 'C' ? x + W[i] / 2 : al === 'R' ? x + W[i] - 1 : x + 1, this.y + 2.7 + j * lh, l, { s: fs, st: head || bold ? 'B' : '', al }));
        x += W[i];
      });
      this.y += h;
    };
    this.ensure(16); draw(cols.map(c => c.h), true);
    rows.forEach((r, i) => draw(r, false, i % 2, o.totalLast && i === rows.length - 1));
    this.y += 2.5;
  }
  HB(items, o = {}) {
    const rowH = 5.6, lw = 72, bw = 90, max = Math.max(...items.map(i => i.v), 1e-9);
    this.ensure(items.length * rowH + 10);
    if (o.title) { this.txt(10, this.y + 3.5, o.title, { s: 8.5, st: 'B' }); this.y += 6; }
    items.forEach(it => {
      this.txt(10, this.y + 3.9, it.l, { s: 7.3 }); const w = Math.max(0.3, it.v / max * bw);
      this.box(10 + lw, this.y + 0.8, w, rowH - 1.8, it.c || RP_AZ);
      this.txt(10 + lw + w + 1.5, this.y + 3.9, rpN(it.v, o.d ?? 2) + (o.u ? ' ' + o.u : ''), { s: 7.3 }); this.y += rowH;
    });
    this.y += 2;
  }
  PAR(items, title, unit) {
    const H = 52, x0 = 24, W = 160; this.ensure(H + 24);
    this.txt(10, this.y + 3.5, title, { s: 8.5, st: 'B' }); this.y += 7;
    const tot = items.reduce((a, b) => a + b.v, 0) || 1, top = this.y, bot = top + H, max = Math.max(...items.map(i => i.v)), slot = W / items.length, bw = Math.min(slot * 0.7, 16);
    for (let k = 0; k <= 4; k++) {
      const yy = bot - H * k / 4; this.line(x0, yy, x0 + W, yy, 0.2, [225, 228, 232]);
      this.txt(x0 - 1.5, yy + 1, rpN(max * k / 4, max > 20 ? 0 : 1), { s: 6.5, al: 'R' }); this.txt(x0 + W + 1.5, yy + 1, (k * 25) + '%', { s: 6.5 });
    }
    let cum = 0; const pts = [];
    items.forEach((it, i) => {
      const bx = x0 + i * slot + (slot - bw) / 2, bh = it.v / max * H; cum += it.v;
      this.box(bx, bot - bh, bw, bh, RP_AZ); pts.push([bx + bw / 2, bot - H * cum / tot]);
      this.txt(bx + bw / 2, bot + 3.3, (it.s || it.l).slice(0, 12), { s: 5.8, al: 'C' });
    });
    this.polyline(pts, RP_RJ, 0.7); pts.forEach(([x, y]) => this.box(x - 0.6, y - 0.6, 1.2, 1.2, RP_RJ));
    this.line(x0, top, x0, bot, 0.4, [60, 60, 60]); this.line(x0, bot, x0 + W, bot, 0.4, [60, 60, 60]);
    this.txt(x0, top - 2, 'Eje izquierdo: ' + unit + '  |  Eje derecho: % acumulado', { s: 6.5, st: 'I' }); this.y = bot + 7;
  }
  LC(series, o) {
    const H = 52, x0 = 24, W = 160; this.ensure(H + 22); this.txt(10, this.y + 3.5, o.title, { s: 8.5, st: 'B' }); this.y += 7;
    const top = this.y, bot = top + H; let ymax = 1, xmax = 1;
    series.forEach(s => s.p.forEach(([x, y]) => { ymax = Math.max(ymax, y); xmax = Math.max(xmax, x); }));
    const X = v => x0 + v / xmax * W, Y = v => bot - v / ymax * H;
    for (let k = 0; k <= 4; k++) { const yy = bot - H * k / 4; this.line(x0, yy, x0 + W, yy, 0.2, [225, 228, 232]); this.txt(x0 - 1.5, yy + 1, fmtN(ymax * k / 4), { s: 6.5, al: 'R' }); this.txt(X(xmax * k / 4), bot + 3.5, fmtN(xmax * k / 4), { s: 6.5, al: 'C' }); }
    this.line(x0, top, x0, bot, 0.4, [60, 60, 60]); this.line(x0, bot, x0 + W, bot, 0.4, [60, 60, 60]);
    series.forEach((s, i) => { this.polyline(s.p.map(([x, y]) => [X(x), Y(y)]), s.c, 0.9); this.line(x0 + 4 + i * 38, top - 1.2, x0 + 12 + i * 38, top - 1.2, 1, s.c); this.txt(x0 + 14 + i * 38, top - 0.2, s.n, { s: 6.5 }); });
    if (o.vx) { this.line(X(o.vx), top, X(o.vx), bot, 0.5, [30, 60, 200], true); this.txt(X(o.vx) + 1, top + 4, o.vt, { s: 6.5, c: [30, 60, 200] }); }
    this.txt(x0 + W / 2, bot + 8, o.xt, { s: 7, al: 'C' }); this.y = bot + 11;
  }
  GANTT(rows, T) {
    const x0 = 62, W = 135, rh = 7; this.ensure(rows.length * rh + 16);
    const sc = W / T;
    for (let t = 0; t <= T; t++) { this.line(x0 + t * sc, this.y, x0 + t * sc, this.y + rows.length * rh + 2, 0.15, [215, 218, 222]); this.txt(x0 + t * sc, this.y + rows.length * rh + 5.5, String(t), { s: 6.5, al: 'C' }); }
    rows.forEach((r, i) => {
      const yy = this.y + i * rh + 1; this.txt(10, yy + 4.2, r.n, { s: 7.5 });
      this.box(x0 + r.es * sc, yy, (r.ef - r.es) * sc, rh - 2, r.crit ? RP_RJ : RP_AZ);
      this.txt(x0 + (r.es + r.ef) / 2 * sc, yy + 3.7, r.ef - r.es + '', { s: 6.5, c: [255, 255, 255], al: 'C' });
    });
    this.y += rows.length * rh + 9; this.NOTA('Rojo: actividad de la ruta crítica; azul: actividad con holgura. Escala en unidades de tiempo del cronograma.');
  }
  BARCODE(x, y, text, hh) {
    const nar = 0.42, wid = 1.1; let cx = x; const s = '*' + text + '*';
    for (const ch of s) {
      const pat = RP_C39[ch]; if (!pat) continue;
      for (let i = 0; i < 9; i++) { const w = pat[i] === 'w' ? wid : nar; if (i % 2 === 0) this.box(cx, y, w, hh, [0, 0, 0]); cx += w; }
      cx += nar;
    }
    this.txt((x + cx) / 2, y + hh + 3.5, text, { s: 7, al: 'C' }); return cx - x;
  }
  FLOWH(labels) {
    this.ensure(22); const n = labels.length, gap = 6, w = (190 - gap * (n - 1)) / n;
    labels.forEach((l, i) => { const x = 10 + i * (w + gap); this.box(x, this.y, w, 13, RP_CL, RP_AZ, 0.5); this.boxText(x, this.y, w, 13, l, 7, 'B'); if (i < n - 1) this.arrow(x + w, this.y + 6.5, x + w + gap, this.y + 6.5, RP_AZ, 0.5); });
    this.y += 17;
  }
}

/* =========================================================
   Construcción del documento
   ========================================================= */
function rpConstruir(p) {
  const D = rpDatos(), fm = rpN;
  const hoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const cb = gd('cb_sha', 1.2) || 1.2, prodApp = prodDiaria(cb), prodAppM = prodApp * 26;
  const resumenSHA = { total: 0 };

  /* ---------- Portada ---------- */
  p.addPage();
  p.box(0, 0, 210, 108, [14, 17, 22]);
  p.txt(105, 46, 'ALPHA BLOCKS', { s: 38, st: 'B', c: [245, 165, 36], al: 'C' });
  p.txt(105, 60, 'Equipo Cacahuate', { s: 18, st: 'B', c: [255, 255, 255], al: 'C' });
  p.line(55, 68, 155, 68, 0.8, [245, 165, 36]);
  p.txt(105, 79, 'Reporte técnico de Planeación y Diseño de Instalaciones', { s: 13, c: [255, 255, 255], al: 'C' });
  p.txt(105, 87, 'Manejo de materiales: metodologías S.H.A. y S.L.P. (R. Muther)', { s: 10, st: 'I', c: [200, 206, 214], al: 'C' });
  p.txt(105, 95, 'Unidad 2 - Solución de ejercicios', { s: 10, c: [200, 206, 214], al: 'C' });
  const dato = (k, d) => { const v = String(_ss(k, '')).trim(); return v || d; };
  const fila = [['Empresa', 'ALPHA-BLOCK - Fabricación y comercialización de bloques huecos de concreto'],
    ['Ubicación', 'Carretera Tapachula-Puerto Madero, km 6.5, zona Llano de Lima, Tapachula, Chiapas'],
    ['Producto', 'Bloque hueco de concreto BH-152040-2C (15 × 20 × 40 cm, 13.2 kg)'],
    ['Asignatura', 'Planeación y Diseño de Instalaciones'], ['Equipo', 'Cacahuate'],
    ['Integrantes', dato('cov_integrantes', '______________________________ (capturar en la pestaña "Datos del Reporte")')],
    ['Docente', dato('cov_docente', '______________________________')], ['Institución', dato('cov_inst', '______________________________')],
    ['Fecha de generación', hoy]];
  fila.forEach(([a, b], i) => { p.txt(22, 126 + i * 11, a + ':', { s: 10, st: 'B', c: RP_AZ }); p.wrap(b, 125, 10, '').slice(0, 2).forEach((l, j) => p.txt(62, 126 + i * 11 + j * 4.5, l, { s: 10 })); });
  p.txt(105, 250, 'Documento generado automáticamente con los datos vigentes de la aplicación ALPHA BLOCKS.', { s: 8, st: 'I', c: RP_GR, al: 'C' });

  /* ---------- Índice ---------- */
  p.addPage(); p.txt(10, 26, 'Índice', { s: 16, st: 'B', c: RP_AZ }); p.line(10, 29, 200, 29, 0.6, RP_AZ); p.y = 33;
  (p.tocPrev || []).forEach(([t, pg]) => { p.ensure(5.5); p.txt(12, p.y + 3.6, t.slice(0, 95), { s: 8.5 }); p.txt(198, p.y + 3.6, String(pg), { s: 8.5, al: 'R' }); p.y += 5; });

  /* ---------- Introducción ---------- */
  p.addPage(); p.H1('Introducción');
  p.P('Este reporte documenta el análisis de manejo de materiales de la planta ALPHA-BLOCK, dedicada a la fabricación de bloques huecos de concreto de 15 × 20 × 40 cm con una máquina QT4-16. Integra los 19 requisitos académicos de la Unidad 2, las tablas del análisis sistemático de manejo de materiales (S.H.A.) generadas por la aplicación y las tablas de la planeación sistemática de distribución (S.L.P.) adaptadas al proceso de la bloquera.');
  p.P('Cada cálculo se obtiene a partir de los datos vigentes de la aplicación y de los parámetros capturados en la pestaña "Datos del Reporte". Si una matriz, cantidad, distancia o parámetro cambia, el reporte se recalcula al descargarlo.');
  p.H2('Flujo de trabajo del reporte');
  p.FLOWH(['Captura de datos en la aplicación', 'Cálculos S.H.A. / T.W. / P-Q', 'Tablas S.H.A. y S.L.P.', 'Gráficas y diagramas', 'Reporte PDF']);
  p.H2('Clasificación de la información');
  p.TB([{ h: 'Tipo', w: 20 }, { h: 'Significado', w: 70 }, { h: 'Cómo se identifica', w: 40 }], [
    ['Dato documentado', 'Proviene de los documentos del proyecto (Unidad 1, Parte 2, Parte 5 y Unidad 2).', 'Sin marca especial'],
    ['Dato de la aplicación', 'Valor capturado o precargado en los bloques SHA 1 a 9 de la aplicación.', 'Indicado en cada tabla'],
    ['Supuesto', 'Valor adoptado para poder calcular y que debe validarse.', 'Marcado como supuesto'],
    ['Pendiente', 'Dato necesario que aún no existe; se captura en la aplicación.', 'Se imprime "pendiente"']]);
  p.H2('Conciliación de datos entre fuentes');
  p.P('Al revisar las fuentes se detectaron diferencias que no se corrigieron en silencio; se muestran aquí para que el equipo decida cuál valor conservar:');
  p.B(`Producción diaria: la aplicación (bloque 1, ciclo de ${cb.toFixed(2)} min de espera) proyecta ${fmtN(prodApp)} bloques/día (${fmtN(prodAppM)} al mes); los documentos de la Unidad 2 usan ${fmtN(D.prod)} bloques/día (${fmtN(D.mensual)} al mes). Las tablas SHA 1 a 9 usan el valor de la aplicación; los requisitos y las tablas S.L.P. usan el de la Unidad 2.`);
  p.B('Trabajo de manejo de materiales: la Parte 2 lo expresa en movimientos·m/jornada con distancias del plano; la Parte 5 lo expresa en t·m/día con las distancias de la hoja de ruta. Ambas versiones se presentan en el Req. 8 sin mezclarse.');
  p.B('Cantidad por viaje de arena y gravilla: 228 kg (Parte 2) frente a cubetas de 20 kg (Parte 5).');
  p.B('Peso neto de la tarima: 1,320 kg (100 × 13.2 kg). El texto de la Unidad 2 menciona también 1,188 kg, que no coincide con el cálculo.');
  p.B('Sujeción: la Parte 2 indica que no se usa película plástica; la Unidad 2 la propone junto con flejes y esquineros. Este reporte describe flejes y esquineros y marca la película como por definir.');
  p.B('Producción mensual: un párrafo de la Unidad 2 menciona 44,902 bloques; el cálculo 7,450 × 26 = 193,700 es el que se usa.');

  /* =====================  PARTE A · 19 REQUISITOS  ===================== */
  /* Req 1 */
  p.H1('Req. 1 - Identificación y registro formal de los elementos');
  p.P('Finalidad: reconocer qué materiales, productos y equipos participan en el sistema de manejo de materiales y asignarles un código interno para su trazabilidad (MHI, 2012; GS1, 2017).');
  p.H2('Tabla 1. Identificación y clasificación de materiales');
  p.TB([{ h: 'Código', w: 18 }, { h: 'Elemento', w: 45 }, { h: 'Clasificación', w: 28 }, { h: 'Estado físico', w: 28 }, { h: 'Unidad', w: 12 }], RP_MATS);
  p.H2('Tabla 2. Registro de maquinaria y equipos de manejo de materiales');
  p.TB([{ h: 'Código', w: 12 }, { h: 'Equipo', w: 32 }, { h: 'Cant.', w: 12 }, { h: 'Características', w: 50 }, { h: 'Función', w: 45 }], RP_EQ, { fs: 6.8 });
  p.H2('Tabla 3. Registro de identificación y trazabilidad (origen, destino y medio)');
  p.TB([{ h: 'Código', w: 14 }, { h: 'Material', w: 32 }, { h: 'Origen -> Destino', w: 44 }, { h: 'Medio de transporte o suministro', w: 50 }],
    D.rutas.filter(r => ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M09', 'M12'].includes(r.cod)).map(r => [r.cod, r.mat, r.de + ' -> ' + r.a, r.metodo]));
  p.FIN(null, 'Los materiales siguen una secuencia definida de transformación (materia prima, mezcla, bloque fresco, bloque terminado). Los equipos para el bloque fresco y el manejo interno de cargas unitarias están identificados; el equipo de cada traslado se asigna en el Req. 15.');

  /* Req 2 */
  p.H1('Req. 2 - Cumplimiento de las 7 R del manejo de materiales');
  const OP = ['Sin evaluar', 'Cumple', 'No cumple'];
  const est7 = RP_7R.map((_, i) => String(_ss('r7_' + (i + 1), 'Sin evaluar')));
  const NE = est7.filter(e => e !== 'Sin evaluar').length, NC = est7.filter(e => e === 'Cumple').length;
  p.TB([{ h: 'N.º', w: 6, al: 'C' }, { h: 'Criterio', w: 24 }, { h: 'Objetivo', w: 38 }, { h: 'Aplicación en ALPHA-BLOCK', w: 56 }, { h: 'Estado', w: 16 }],
    RP_7R.map((r, i) => [i + 1, r[0], r[1], r[2], est7[i]]));
  p.P('Indicador de cumplimiento: C7R = (NC / NE) × 100, donde NC es el número de criterios que cumplen y NE el número de criterios efectivamente evaluados.');
  p.P(NE ? `Resultado: NC = ${NC}, NE = ${NE}; C7R = ${NC}/${NE} × 100 = ${(NC / NE * 100).toFixed(1)} %.` : 'Resultado: todavía no se ha evaluado ningún criterio, por lo que el porcentaje no es calculable (NE = 0). Los estados se capturan en la pestaña "Datos del Reporte".', { st: 'B' });
  p.H2('Condiciones de manejo por material');
  p.TB([{ h: 'Material', w: 28 }, { h: 'Condición requerida', w: 55 }, { h: 'Medida de control', w: 55 }], [
    ['Cemento', 'Protección contra la humedad', 'Almacenamiento en espacio seco y protegido'], ['Arena', 'Evitar contaminación con otros materiales', 'Almacenamiento en área delimitada'],
    ['Gravilla', 'Libre de residuos y materiales ajenos', 'Almacenamiento separado e inspección visual'], ['Agua', 'Cumplir condiciones para elaborar concreto', 'Verificación de su calidad'],
    ['Mezcla semiseca', 'Conservar la consistencia para el moldeado', 'Control de dosificación y mezclado (28 s)'], ['Bloques recién moldeados', 'Evitar deformaciones y fracturas', 'Manipulación y acomodo adecuados'],
    ['Bloques terminados', 'Conservar su integridad física', 'Inspección y almacenamiento organizado']]);

  /* Req 3 */
  p.H1('Req. 3 - Análisis Producto-Cantidad (P-Q)');
  p.P('El análisis P-Q (Muther) relaciona los productos con sus cantidades para decidir el tipo de producción y de distribución. ALPHA-BLOCK fabrica un solo modelo, el bloque BH-152040-2C.');
  p.TB([{ h: 'Código', w: 20 }, { h: 'Producto', w: 48 }, { h: 'Diaria', w: 18, al: 'R' }, { h: 'Mensual', w: 20, al: 'R' }, { h: 'Anual', w: 22, al: 'R' }, { h: 'Part. %', w: 12, al: 'R' }],
    [['BH-152040-2C', 'Bloque hueco de concreto 15 × 20 × 40 cm', D.prod, D.mensual, D.anual, 100]]);
  p.P(`Participación: Pi = Qi / QT × 100 = ${fmtN(D.mensual)} / ${fmtN(D.mensual)} × 100 = 100 %. Producción mensual: Qm = Qd × Dm = ${fmtN(D.prod)} × ${D.dias} = ${fmtN(D.mensual)} bloques/mes (jornada de 7 h). Cantidades teóricas, no demanda comprobada.`);
  p.TB([{ h: 'Indicador', w: 30 }, { h: 'Resultado', w: 30 }, { h: 'Interpretación', w: 60 }], [
    ['Número de productos', '1', 'Baja variedad'], ['Participación', '100 %', 'Producción concentrada en un artículo'], ['Tipo de producción', 'Repetitiva', 'Mismo modelo con operaciones estandarizadas'], ['Distribución sugerida', 'Por producto', 'Equipos ordenados según la secuencia de fabricación']]);
  p.H2('Requerimientos de materia prima');
  const dens = { c: 1440, a: 1600, g: 1680 }, sem = 6;
  const mp = [['Cemento', D.kgC, 'kg', dens.c], ['Arena', D.kgA, 'kg', dens.a], ['Gravilla', D.kgG, 'kg', dens.g], ['Agua', D.lAg, 'L', 1000]];
  p.TB([{ h: 'Materia prima', w: 22 }, { h: 'Diario', w: 20, al: 'R' }, { h: 'Semanal (6 d)', w: 22, al: 'R' }, { h: 'Mensual', w: 22, al: 'R' }, { h: 'Anual', w: 24, al: 'R' }, { h: 'Vol. mensual m³', w: 22, al: 'R' }],
    mp.map(([n, d, u, de]) => [n + ' (' + u + ')', d, d * sem, d * D.dias, d * D.dias * 12, u === 'L' ? d * D.dias / 1000 : d * D.dias / de]), { fs: 7 });
  p.NOTA('Dosificación provisional de la hoja de ruta: cemento 1 kg/bloque, arena y gravilla 4.56 kg/bloque, agua 0.30 L/bloque. Densidades aparentes de referencia (EngiMetric, 2024): cemento 1,440, arena 1,600 y gravilla 1,680 kg/m³. Deben verificarse con el suministro real.');

  /* Req 4 */
  p.H1('Req. 4 - Gráfica P-Q');
  p.P('Como existe un solo producto no puede construirse la curva P-Q descendente tradicional; se representa una columna individual con la producción mensual.');
  p.HB([{ l: 'BH-152040-2C (bloque hueco 15×20×40)', v: D.mensual }], { title: 'Gráfica P-Q: cantidad mensual (Q) por producto (P)', d: 0, u: 'bloques/mes' });
  p.NOTA('Eje P: producto; eje Q: bloques por mes. La barra única equivale al 100 % de la producción proyectada.');
  p.FIN(null, 'Un único artículo con volumen alto y repetitivo favorece un flujo continuo y una distribución por producto.');

  /* Req 5 */
  p.H1('Req. 5 - Ficha técnica de materiales');
  p.P('Resumen de las características técnicas disponibles de materiales y equipos. Las fichas completas del fabricante (QT4-16, bandas, FOTON Aumark S5, Uline, montacargas, tarima, cemento, agregados y agua) se anexan con el documento de la Unidad 2.');
  p.TB([{ h: 'Elemento', w: 32 }, { h: 'Característica técnica documentada', w: 80 }, { h: 'Estado', w: 20 }], [
    ['Bloque BH-152040-2C', 'Dimensiones 15 × 20 × 40 cm; peso unitario de referencia 13.2 kg', 'Documentado'], ['Cemento', 'Cruz Azul; sacos de 50 kg; densidad aparente de referencia 1,440 kg/m³', 'Verificar'],
    ['Arena', 'Agregado fino a granel; densidad aparente de referencia 1,600 kg/m³', 'Verificar'], ['Gravilla', 'Agregado pétreo a granel; densidad aparente de referencia 1,680 kg/m³', 'Verificar'],
    ['Agua', 'Conducida por manguera Truper PRO de 20 m; calidad apta para elaborar concreto', 'Verificar'],
    ['Máquina QT4-16', 'Mezclado, vibración y compresión de bloques; tiempo de mezclado de 28 s; ciclo < 2 min por lote', 'Ficha del fabricante (HF Block Machine)'],
    ['Bandas transportadoras', 'Longitudes de 13 m (2 unidades) y 7 m (1 unidad); 1 saco o cubeta cada 25 s', 'Documentado'],
    ['Montacargas diésel', '3 unidades; capacidad anunciada de 3,000 kg', 'Verificar'], ['Patín hidráulico Uline H-6710', '2 unidades; 5,500 lb; horquillas de 122 × 53 cm', 'Documentado'],
    ['Estibador Uline H-5440', '3 unidades; elevación eléctrica hasta 3.48 m; horquillas de 1.07 m', 'Documentado'], ['Tarima reforzada', '1.20 × 1.00 m; capacidad dinámica declarada de 2,000 kg (Triplay México)', 'Verificar con proveedor'],
    ['Estante móvil de curado', '65 piezas; 1.70 × 1.20 × 2.40 m; 8 niveles × 3 tableros; 120 bloques', 'A medida'], ['Vehículo FOTON Aumark S5', '2 unidades de reparto', 'Verificar capacidad']], { fs: 6.9 });
  p.NOTA('"Verificar" indica un valor de referencia que debe confirmarse con la ficha del proveedor antes de implementarse.');

  /* Req 6 */
  p.H1('Req. 6 - Definición de la carga unitaria');
  const pu = D.tar * D.peso, util = pu / 2000 * 100, ocup = 20 * 15 * 40 / (120 * 100) * 100;
  p.P('La carga unitaria agrupa los bloques en una tarima de madera reforzada de 1.20 × 1.00 m para reducir movimientos individuales. Referencia comercial: 100 bloques de 15 × 20 × 40 cm por tarima (Loguera Block, 2026).');
  p.TB([{ h: 'Característica', w: 48 }, { h: 'Especificación', w: 62 }], [
    ['Producto', 'Bloque hueco de concreto BH-152040-2C'], ['Distribución', `${D.tar / 5} bloques por nivel × 5 niveles = ${D.tar} bloques por tarima`], ['Altura nominal de la estiba', '1.00 m (sin incluir tarima)'],
    ['Peso neto de los bloques', `Pu = Nb × Pb = ${D.tar} × ${D.peso} = ${fmtN(pu, 1)} kg`], ['Capacidad dinámica declarada', '2,000 kg'], ['Utilización nominal', `${fmtN(pu, 1)} / 2,000 × 100 = ${util.toFixed(1)} % (margen ${fmtN(2000 - pu, 0)} kg)`],
    ['Ocupación de la superficie', `20 bloques × (15 × 40 cm) = 12,000 cm² de 12,000 cm² = ${ocup.toFixed(0)} %`], ['Sujeción', 'Flejes y esquineros protectores (película estirable por definir)'], ['Medio de transporte interno', 'Montacargas / patín hidráulico']]);
  p.H2('Cargas unitarias necesarias');
  p.TB([{ h: 'Indicador', w: 50 }, { h: 'Cálculo', w: 50 }, { h: 'Resultado', w: 28, al: 'R' }], [
    ['Cargas por día', `${fmtN(D.prod)} / ${D.tar}`, fmtN(D.tarDia, 1) + ' (75 con redondeo)'], ['Cargas por mes', `${fmtN(D.mensual)} / ${D.tar}`, fmtN(D.mensual / D.tar, 0)], ['Peso neto de una carga completa', `${D.tar} × ${D.peso} kg`, fmtN(pu, 1) + ' kg']]);
  p.NOTA('La carga total real debe sumar el peso de la tarima y de la sujeción: Ptotal = Pu + Ptarima + Psujeción (pesos pendientes de validar). Debe comprobarse que las piezas reales no sobresalgan de la tarima, la estabilidad de cinco niveles y la capacidad del montacargas.');
  p.P('Procedimiento de aseguramiento: 1) acomodar 100 bloques en cinco niveles de 20; 2) colocar esquineros en las zonas de contacto con los flejes; 3) aplicar flejes (la cantidad y tensión definitivas se determinan con pruebas; la Parte 2 describe dos horizontales en los niveles 2.º y 4.º y tres verticales por lado); 4) inspeccionar antes del despacho.');

  /* Req 7 */
  p.H1('Req. 7 - Diagrama de flujo del proceso', 175);
  p.P('Secuencia de fabricación de ALPHA-BLOCK desde la inspección de la QT4-16 hasta el despacho. Las distancias provienen de la hoja de ruta (Req. 13).');
  p.ensure(150);
  const pasos = [['Inspección inicial de la máquina QT4-16', 'ins', ''], ['Abastecimiento de arena, gravilla, cemento y agua', 'tr', 'Bandas 13 m, 13 m y 7 m; agua 12 m'], ['Mezclado (28 s) hasta consistencia homogénea', 'op', ''],
    ['¿Mezcla homogénea y equipo en condición?', 'dec', 'No: ajuste de dosificación o mantenimiento'], ['Vibración, llenado y compresión de moldes (QT4-16)', 'op', ''], ['¿Bloque conforme?', 'dec', 'No: separar al almacén de no conformes (9.75 m)'],
    ['Traslado a curado y secado', 'tr', '19.5 m'], ['Curado y secado', 'op', ''], ['Inspección de calidad (muestras al laboratorio)', 'ins', 'Laboratorio a 13.75 m'], ['Armado de tarimas: 100 bloques, esquineros y flejes', 'op', ''],
    ['Almacén de producto terminado', 'alm', '24.25 m'], ['Preparación de pedidos y traslado al muelle', 'tr', '18.75 m + 18.75 m'], ['Carga y despacho', 'op', '']];
  const col = { op: [255, 255, 255], ins: [214, 240, 222], tr: [253, 230, 205], alm: [225, 228, 232] }, bx = 20, bw = 92, bh = 8;
  pasos.forEach(([t, tipo, nota], i) => {
    const yy = p.y;
    if (tipo === 'dec') { p.poly([[bx + bw / 2, yy - 0.5], [bx + bw, yy + bh / 2], [bx + bw / 2, yy + bh + 0.5], [bx, yy + bh / 2]], [255, 244, 190], RP_AZ, 0.5); p.boxText(bx + 12, yy, bw - 24, bh, t, 6.6, 'B'); }
    else { p.box(bx, yy, bw, bh, col[tipo], RP_AZ, 0.5); p.boxText(bx, yy, bw, bh, t, 7.2, 'B'); }
    p.txt(bx - 3, yy + bh / 2 + 1, String(i + 1), { s: 7, st: 'B', c: RP_AZ, al: 'R' });
    if (nota) p.txt(bx + bw + 4, yy + bh / 2 + 1, nota, { s: 7, st: 'I', c: RP_GR });
    if (i < pasos.length - 1) p.arrow(bx + bw / 2, yy + bh + (tipo === 'dec' ? 0.5 : 0), bx + bw / 2, yy + bh + 3.6, RP_AZ, 0.5);
    p.y += bh + 3.8;
  });
  p.NOTA('Leyenda: blanco = operación; verde = inspección; naranja = transporte; gris = almacenamiento; rombo = decisión.');

  /* Req 8 */
  p.H1('Req. 8 - Cuantificación del trabajo de manejo de materiales (T.W.)');
  p.P('T.W. = (F / Q) × D, donde F es el flujo diario, Q la cantidad por viaje y D la distancia recorrida.');
  p.H2('8a. T.W. en movimientos·m/jornada (formato de la Parte 2)');
  const tw2 = [['Almacén', 'Producción', 'Arena', D.kgA, 228, 'kg', 7], ['Almacén', 'Producción', 'Gravilla', D.kgG, 228, 'kg', 13], ['Almacén', 'Producción', 'Cemento', D.kgC, 50, 'kg', 13], ['Almacén', 'Producción', 'Agua', D.lAg, 15, 'L', 10],
    ['Producción', 'Secado', 'Bloques', D.prod, 20, 'pzas', 10], ['Secado', 'Armado', 'Bloques', D.prod, 100, 'pzas', 7], ['Armado', 'Producto terminado', 'Bloques', D.prod, 100, 'pzas', 15], ['Producto terminado', 'Carga', 'Bloques', D.prod, 100, 'pzas', 8]];
  let tw2t = 0; const tw2r = tw2.map(r => { const v = r[3] / r[4] * r[6]; tw2t += v; return [r[0], r[1], r[2], r[3], r[4] + ' ' + r[5], r[6], v]; });
  tw2r.push(['TOTAL', '', '', '', '', '', tw2t]);
  p.TB([{ h: 'De', w: 20 }, { h: 'A', w: 24 }, { h: 'Producto', w: 18 }, { h: 'F (flujo)', w: 18, al: 'R' }, { h: 'Q (por viaje)', w: 18, al: 'R' }, { h: 'D (m)', w: 12, al: 'R' }, { h: 'T.W. (mov·m/jornada)', w: 28, al: 'R', d: 1 }], tw2r, { totalLast: true });
  const may2 = tw2r.slice(0, -1).reduce((a, b) => (b[6] > a[6] ? b : a));
  p.P(`Total: ${fmtN(tw2t, 1)} movimientos·m/jornada. Ruta con mayor valor: ${may2[0]} -> ${may2[1]} (${may2[2]}) con ${fmtN(may2[6], 1)}.`);
  p.H2('8b. T.W. en t·m/día (formato de la Parte 5, hoja de ruta)');
  p.TB([{ h: 'Cód.', w: 8 }, { h: 'Ruta', w: 46 }, { h: 'Material', w: 28 }, { h: 'D (m)', w: 10, al: 'R' }, { h: 'Flujo (t/día)', w: 16, al: 'R' }, { h: 'T.W. (t·m/día)', w: 20, al: 'R' }, { h: 'Observación', w: 34 }],
    [...D.rutas.map(r => [r.cod, r.de + ' -> ' + r.a, r.mat, r.dist, r.t, r.tw === null ? '-' : r.tw, r.cuant ? 'Cuantificada' : (r.nota)]), ['', 'TRABAJO DE TRANSPORTE TOTAL (rutas cuantificadas)', '', '', '', D.twTot, '']], { fs: 6.8, totalLast: true });
  p.NOTA('Se suman solo las rutas con distancia definida y flujo diario conocido, igual que en la hoja de ruta. Agua y mezcla (distancia por confirmar) y los flujos sin cantidad (inspección, muestras, no conformes) quedan fuera del total.');
  p.HB(D.rutas.filter(r => r.tw !== null).sort((a, b) => b.tw - a.tw).map(r => ({ l: r.cod + ' ' + r.de + ' -> ' + r.a, v: r.tw, c: r.tw >= 1800 ? RP_RJ : RP_AZ })), { title: 'T.W. por ruta (t·m/día)', u: 't·m' });
  p.FIN(null, 'Los movimientos de bloques (curado, producto terminado, pedidos y muelle) concentran la mayor parte del trabajo porque la carga es pesada (98.34 t/día) y se mueve varias veces; las materias primas por banda tienen recorridos cortos y definidos.');

  /* Req 9 */
  p.H1('Req. 9 - Diagrama de hilos y gráfico Distancia-Intensidad (D-I)', 150);
  p.H2('Diagrama de hilos sobre el esquema de la planta');
  p.P('Esquema no a escala. El color del hilo indica la intensidad (t·m/día): rojo muy alta (>= 1,800), naranja especial (400 a < 1,800), verde importante (200 a < 400), gris ordinaria. Los hilos punteados no tienen flujo cuantificado. Los números son distancias en metros.');
  p.ensure(120);
  const N = { CM: [28, 12, 'Almacén de cemento'], GR: [28, 32, 'Almacén de grava'], AR: [28, 52, 'Almacén de arena'], CI: [28, 84, 'Cisterna'], DO: [82, 32, 'Dosificación'], MZ: [82, 66, 'Mezcladora'], PR: [132, 66, 'Máquina QT4-16'],
    CU: [132, 100, 'Curado y secado'], QC: [176, 84, 'Inspección calidad'], LB: [176, 108, 'Laboratorio'], NC: [82, 100, 'Material no conforme'], PT: [176, 56, 'Producto terminado'], PK: [176, 28, 'Preparación pedidos'], MU: [132, 14, 'Muelle de carga'] };
  const E = [['CM', 'DO', 'M01'], ['GR', 'DO', 'M02'], ['AR', 'DO', 'M03'], ['CI', 'MZ', 'M04'], ['DO', 'MZ', null], ['MZ', 'PR', 'M05'], ['PR', 'CU', 'M06'], ['CU', 'QC', 'M07'], ['CU', 'LB', 'M08'], ['QC', 'PT', 'M09'], ['PR', 'NC', 'M10'], ['PT', 'PK', 'M11'], ['PK', 'MU', 'M12']];
  const oy = p.y + 2, nx = k => 10 + N[k][0] - 5, ny = k => oy + N[k][1] - 4;
  E.forEach(([a, b, cod]) => {
    const r = cod ? D.rutas.find(x => x.cod === cod) : null, cl = r && r.tw !== null ? rpClase(r.tw) : null;
    const c = cl === 'A' ? RP_RJ : cl === 'E' ? [230, 130, 20] : cl === 'I' ? [30, 150, 80] : [140, 146, 154];
    p.line(nx(a), ny(a), nx(b), ny(b), cl ? 1.4 : 0.6, c, !cl);
    if (r) { const mx = (nx(a) + nx(b)) / 2, my = (ny(a) + ny(b)) / 2; p.box(mx - 5, my - 2.2, 10, 4.2, [255, 255, 255]); p.txt(mx, my + 1, fm(r.dist, r.dist % 1 ? 2 : 0) + ' m', { s: 6.5, st: 'B', al: 'C' }); }
  });
  Object.keys(N).forEach(k => { const w = 31, h = 9; p.box(nx(k) - w / 2, ny(k) - h / 2, w, h, RP_CL, RP_AZ, 0.5); p.boxText(nx(k) - w / 2, ny(k) - h / 2, w, h, N[k][2], 6.4, 'B'); });
  p.y = oy + 116;
  p.H2('Gráfico Distancia-Intensidad (D-I)');
  p.P('Cada punto es una ruta con flujo conocido: eje horizontal = distancia (m); eje vertical = flujo (t/día). Las rutas arriba y a la derecha concentran la mayor carga de trabajo.');
  const pts = D.rutas.filter(r => r.t != null && r.dist);
  p.ensure(74); const gx = 26, gw = 165, gh = 56, gy = p.y + 3, mxd = 30, myi = Math.ceil(Math.max(...pts.map(r => r.t)) / 20) * 20;
  for (let k = 0; k <= 5; k++) { const yy = gy + gh - gh * k / 5; p.line(gx, yy, gx + gw, yy, 0.2, [225, 228, 232]); p.txt(gx - 1.5, yy + 1, String(Math.round(myi * k / 5)), { s: 6.5, al: 'R' }); }
  for (let k = 0; k <= 6; k++) { const xx = gx + gw * k / 6; p.txt(xx, gy + gh + 3.5, String(k * 5), { s: 6.5, al: 'C' }); }
  p.line(gx, gy, gx, gy + gh, 0.4); p.line(gx, gy + gh, gx + gw, gy + gh, 0.4);
  pts.forEach(r => { const px = gx + r.dist / mxd * gw, py = gy + gh - r.t / myi * gh, c = r.cuant ? (rpClase(r.tw) === 'A' ? RP_RJ : [230, 130, 20]) : [140, 146, 154]; p.box(px - 1.3, py - 1.3, 2.6, 2.6, c); p.txt(px + 2, py - 1, r.cod, { s: 6.5 }); });
  p.txt(gx + gw / 2, gy + gh + 8, 'Distancia (m)', { s: 7, al: 'C' }); p.txt(10, gy + 2, 't/día', { s: 7, st: 'I' }); p.y = gy + gh + 11;
  p.FIN(null, 'Las rutas M06, M09, M11 y M12 comparten el flujo de 98.34 t/día y difieren por la distancia; M09 (24.25 m) es la de mayor intensidad. M02 y M03 mueven 33.97 t/día a distancias cortas.');

  /* Req 10 */
  p.H1('Req. 10 - Análisis de Pareto', 90);
  const par = D.rutas.filter(r => r.tw !== null).sort((a, b) => b.tw - a.tw), tt = par.reduce((s, r) => s + r.tw, 0);
  p.PAR(par.map(r => ({ l: r.cod + ' ' + r.mat, s: r.cod, v: r.tw })), 'Pareto del trabajo de transporte por ruta (t·m/día)', 't·m/día');
  let ac = 0;
  p.TB([{ h: 'Cód.', w: 8 }, { h: 'Ruta', w: 50 }, { h: 'T.W. (t·m/día)', w: 18, al: 'R' }, { h: '%', w: 10, al: 'R' }, { h: '% acumulado', w: 14, al: 'R' }, { h: 'Zona', w: 10, al: 'C' }],
    par.map(r => { ac += r.tw / tt * 100; return [r.cod, r.de + ' -> ' + r.a, r.tw, +(r.tw / tt * 100).toFixed(1), +ac.toFixed(1), ac - r.tw / tt * 100 < 80 ? 'A' : 'B']; }));
  p.P(`Interpretación: las rutas de la zona A (hasta el 80 % acumulado) son: ${par.filter((r, i) => par.slice(0, i).reduce((s, x) => s + x.tw, 0) / tt < 0.8).map(r => r.cod).join(', ')}. Son los traslados de bloques con montacargas y deben recibir prioridad en pasillos, equipos y distribución.`);
  p.H2('Pareto de defectos (bloques no conformes)');
  const defs = (S.rows_pareto || []).filter(r => num(r.cantidad) > 0).map(r => ({ l: r.causa, v: num(r.cantidad) })).sort((a, b) => b.v - a.v);
  if (defs.length) { p.PAR(defs, 'Pareto de defectos por causa (piezas)', 'piezas'); const td = defs.reduce((s, x) => s + x.v, 0); p.P(`Total registrado: ${fmtN(td)} piezas. Causa principal: ${defs[0].l} (${(defs[0].v / td * 100).toFixed(1)} %).`); }
  else p.P('Pendiente: el proyecto no tiene datos medidos de rechazos ("no se asigna tasa de rechazo sin datos medidos"). Capture las cantidades por causa en la pestaña "Datos del Reporte" y el diagrama se generará automáticamente.', { st: 'B' });

  /* Req 11 */
  p.H1('Req. 11 - Diagrama de Ishikawa', 125);
  p.P('Efecto analizado: bloques defectuosos o no conformes (fisuras, deformaciones, dimensiones incorrectas, despostillamientos). Las causas provienen del diagnóstico de los 7 desperdicios y de las condiciones del proceso; son hipótesis por verificar con datos medidos.');
  p.ensure(100);
  const cats = [['Material', ['Variación en la dosificación', 'Cemento con humedad', 'Agregados contaminados']], ['Máquina QT4-16', ['Fallas en vibración o compresión', 'Falta de mantenimiento', 'Desgaste de moldes']],
    ['Método', ['Mezclado distinto de 28 s', 'Apilado de bloques frescos', 'Estiba inadecuada']], ['Mano de obra', ['Manipulación brusca', 'Falta de procedimientos', 'Fatiga por movimientos']],
    ['Medición', ['Criterios de inspección no únicos', 'Rechazos sin registro', 'Muestreo sin plan']], ['Medio ambiente', ['Secado y curado inadecuados', 'Almacenamiento sin protección', 'Golpes en traslados']]];
  const fy = p.y + 46; p.arrow(14, fy, 150, fy, RP_AZ, 1.2); p.box(150, fy - 9, 50, 18, [255, 235, 235], RP_RJ, 0.8); p.boxText(150, fy - 9, 50, 18, 'Bloques defectuosos / no conformes', 8, 'B');
  cats.forEach(([n, cs], i) => {
    const top = i < 3, cx = 40 + (i % 3) * 45, y0 = top ? p.y + 6 : p.y + 86, y1 = fy;
    p.box(cx - 17, top ? p.y : p.y + 86, 34, 6.5, RP_AZ); p.txt(cx, (top ? p.y : p.y + 86) + 4.5, n, { s: 7.5, st: 'B', c: [255, 255, 255], al: 'C' });
    p.line(cx, top ? y0 : y0, cx + 14, y1, 0.8, RP_AZ);
    cs.forEach((c, j) => { const yy = top ? y0 + 10 + j * 9 : y0 - 10 - j * 9, xb = cx + 14 * (yy - y0) / (y1 - y0); p.line(xb - 5, yy, xb, yy, 0.3, RP_GR); p.txt(xb - 5.5, yy + 1, c, { s: 6.3, al: 'R' }); });
  });
  p.y += 94;

  /* Req 12 */
  p.H1('Req. 12 - Tecnología de identificación (código de barras)', 120);
  p.P('Se propone identificar cada tarima de producto terminado con una etiqueta de código de barras Code 39 (alfanumérico, sin dígito verificador obligatorio y legible con lector estándar). El código de producto BH-152040-2C se conserva del proyecto original; el número de lote es una propuesta (supuesto) para la trazabilidad por tarima.');
  p.H2('Etiqueta propuesta de tarima');
  p.ensure(52);
  const d0 = new Date(), yy2 = String(d0.getFullYear()).slice(2), mm = String(d0.getMonth() + 1).padStart(2, '0'), dd = String(d0.getDate()).padStart(2, '0'), lote = `${yy2}${mm}${dd}-001`;
  p.box(10, p.y, 120, 44, [255, 255, 255], [0, 0, 0], 0.7); p.txt(14, p.y + 6, 'ALPHA-BLOCK  |  Equipo Cacahuate', { s: 9, st: 'B' });
  p.txt(14, p.y + 12, 'Producto: Bloque hueco de concreto 15×20×40 cm', { s: 7.5 }); p.txt(14, p.y + 17, `Cantidad: ${D.tar} piezas   Peso neto: ${fmtN(pu, 1)} kg`, { s: 7.5 });
  p.txt(14, p.y + 22, `Lote (ejemplo): ${lote}   Estado: Aprobado / Liberado`, { s: 7.5 }); p.BARCODE(18, p.y + 26, 'BH-152040-2C', 10);
  p.txt(136, p.y + 6, 'Estructura de la etiqueta', { s: 8, st: 'B' });
  ['Código de producto (BH-152040-2C)', 'Lote AAMMDD-NNN (propuesto)', 'Cantidad y peso neto', 'Estado de calidad', 'Ubicación en almacén'].forEach((t, i) => p.txt(136, p.y + 11 + i * 4.5, '- ' + t, { s: 7 }));
  p.y += 48;
  p.TB([{ h: 'Elemento', w: 30 }, { h: 'Código', w: 36 }, { h: 'Etiquetado en', w: 40 }, { h: 'Uso', w: 40 }], [
    ['Materias primas', 'MP-01 a MP-04', 'Almacenes de materia prima', 'Verificar material correcto (7 R)'], ['Producto en proceso', 'PP-01, PP-02', 'Estantes de curado', 'Seguimiento de lotes en curado'],
    ['Producto terminado', 'BH-152040-2C + lote', 'Cada tarima de 100 bloques', 'Inventario PEPS y despacho'], ['Material no conforme', 'BH-152040-2C + NC', 'Tarimas del almacén de no conformes', 'Separación y conteo']]);
  p.NOTA('La aplicación puede ampliarse a QR si el equipo cuenta con lectores o teléfonos con cámara; Code 39 se eligió por poder imprimirse directamente en este reporte.');

  /* Req 13 */
  p.H1('Req. 13 - Consolidación formal en el formato normalizado S.H.A.');
  p.P('El formato normalizado reúne, para cada movimiento, el origen, la ruta, el destino, la distancia, la intensidad de flujo, la condición de ruta y el código de referencia. Se presentan la hoja de ruta y el resumen de movimientos; las demás hojas se encuentran en los requisitos 14, 15 y en la Parte C.');
  p.H2('Tabla 4. Hoja de ruta');
  p.P('Fábrica: ALPHA-BLOCK. Proyecto: bloquera de concreto. De: almacenes de materia prima. A: muelle de carga. Producción: ' + fmtN(D.prod) + ' bloques/día.', { s: 8 });
  const cant = r => r.cod === 'M01' ? `${Math.ceil(D.kgC / 50)} sacos/día (${fmtN(D.kgC)} kg)` : (r.cod === 'M02' || r.cod === 'M03') ? `${Math.ceil((r.t * 1000) / 20)} cubetas eq./día (${fmtN(r.t * 1000)} kg)` : r.cod === 'M04' ? `${fmtN(D.lAg)} L/día` : r.cod === 'M05' ? '1,490 lotes eq./día (5 bloques/lote)' : r.t != null ? `${fmtN(D.prod)} bloques/día` : 'Según plan o datos medidos';
  p.TB([{ h: 'Cód.', w: 7 }, { h: 'Material', w: 24 }, { h: 'Origen', w: 24 }, { h: 'Ruta / método', w: 28 }, { h: 'Destino', w: 24 }, { h: 'D (m)', w: 9, al: 'R' }, { h: 'Intensidad de flujo', w: 26 }, { h: 'Condiciones', w: 34 }],
    D.rutas.map(r => [r.cod, r.mat, r.de, r.metodo, r.a, r.dist, cant(r), r.nota]), { fs: 6.4 });
  p.NOTA('Q = distancia horizontal; la distancia vertical no se incluye. Los flujos de materias primas usan dosificación provisional; verificar receta, capacidad real y recorridos.');
  p.H2('Tabla 5. Resumen de movimientos e intensidades de transporte');
  p.TB([{ h: 'N.º', w: 6, al: 'C' }, { h: 'Origen', w: 28 }, { h: 'Destino', w: 28 }, { h: 'Material', w: 24 }, { h: 'D (m)', w: 9, al: 'R' }, { h: 'Flujo (t/día)', w: 14, al: 'R' }, { h: 'Trabajo (t·m/día)', w: 18, al: 'R' }, { h: 'Intens.', w: 10, al: 'C' }, { h: 'Base de la distancia', w: 22 }],
    [...D.rutas.map(r => [r.n, r.de, r.a, r.mat, r.dist, r.t === null ? '-' : r.t, r.tw === null ? '-' : r.tw, r.tw === null ? 'por definir' : rpClase(r.tw), r.n <= 3 ? 'Recorrido definido' : 'Distancia estimada']), ['', 'TOTAL (rutas cuantificadas)', '', '', '', '', D.twTot, '', '']], { fs: 6.6, totalLast: true });
  p.NOTA('Intensidad por umbrales propuestos: A muy alta (>= 1,800 t·m/día), E especial (400 a < 1,800), I importante (200 a < 400), O ordinaria (< 200). Base: 7,450 bloques/día × 13.2 kg = 98.34 t/día.');

  /* Req 14 */
  p.H1('Req. 14 - Clasificación de movimientos');
  p.P('Cada material exige un método de traslado distinto según su forma, peso y estado, por lo que se clasifican los movimientos antes de asignar equipos.');
  p.TB([{ h: 'Cód.', w: 8 }, { h: 'Movimiento', w: 40 }, { h: 'Clase de material', w: 26 }, { h: 'Tipo de movimiento', w: 28 }, { h: 'Precaución', w: 40 }], [
    ['M01', 'Cemento: almacén -> dosificación', 'Sacos (50 kg)', 'Continuo por banda', 'Proteger de la humedad'], ['M02', 'Grava: almacén -> tolva', 'Granel', 'Continuo por banda', 'Evitar residuos ajenos'], ['M03', 'Arena: almacén -> tolva', 'Granel', 'Continuo por banda', 'Evitar contaminación'],
    ['M04', 'Agua: cisterna -> mezcladora', 'Líquido', 'Continuo por tubería', 'Medir caudal (0.30 L/bloque)'], ['M05', 'Mezcla: mezcladora -> QT4-16', 'Mezcla semiseca', 'Transferencia por lotes', 'Conservar consistencia (28 s)'],
    ['M06', 'Bloques frescos: QT4-16 -> curado', 'Producto en proceso', 'Por lotes en tableros', 'Traslado delicado; no apilar'], ['M07', 'Curado -> inspección de calidad', 'Producto en proceso', 'Diferido por lotes', 'Respetar tiempo de curado'],
    ['M08', 'Curado -> laboratorio', 'Muestras', 'Ocasional', 'Según plan de muestreo'], ['M09', 'Inspección -> producto terminado', 'Carga unitaria', 'Por tarima (montacargas)', 'Registrar unidades conformes'],
    ['M10', 'Producción -> no conformes', 'Producto no conforme', 'Segregado', 'Evitar mezcla con aprobados'], ['M11-M12', 'Producto terminado -> pedidos -> muelle', 'Carga unitaria', 'Por tarima (montacargas)', 'Pasillos despejados']], { fs: 6.8 });
  p.H2('Resumen por tipo de movimiento');
  const cnt = {}; D.rutas.forEach(r => { const k = r.cod <= 'M05' ? 'Materias primas y mezcla' : r.cod === 'M08' || r.cod === 'M10' ? 'Muestras y no conformes' : 'Bloques (proceso y terminado)'; cnt[k] = cnt[k] || { n: 0, tw: 0 }; cnt[k].n++; cnt[k].tw += r.tw || 0; });
  p.TB([{ h: 'Tipo', w: 48 }, { h: 'Rutas', w: 16, al: 'R' }, { h: 'T.W. (t·m/día)', w: 26, al: 'R' }, { h: '% del total', w: 18, al: 'R' }], Object.entries(cnt).map(([k, v]) => [k, v.n, v.tw, D.twTot ? +(v.tw / D.twTot * 100).toFixed(1) : 0]));

  /* Req 15 */
  p.H1('Req. 15 - Asignación de métodos y equipos (planes generales de manejo)');
  p.P('Se evaluaron los sistemas directo, canalizado y centralizado. El proceso de ALPHA-BLOCK se adapta principalmente a un sistema canalizado porque los materiales pasan por estaciones fijas. No se mueve la mezcla húmeda igual que una tarima terminada.');
  p.TB([{ h: 'Cód.', w: 8 }, { h: 'Movimiento', w: 38 }, { h: 'Sistema', w: 20 }, { h: 'Equipo asignado', w: 46 }, { h: 'Unidad movida', w: 26 }], [
    ['M01', 'Cemento a dosificación', 'Canalizado', 'Banda transportadora 13 m (EQ-02)', 'Saco de 50 kg'], ['M02', 'Grava a tolva', 'Canalizado', 'Banda transportadora 13 m (EQ-02)', 'Cubeta / granel'], ['M03', 'Arena a tolva', 'Canalizado', 'Banda transportadora 7 m (EQ-03)', 'Cubeta / granel'],
    ['M04', 'Agua a mezcladora', 'Canalizado', 'Manguera / tubería (EQ-04)', 'Litro'], ['M05', 'Mezcla a QT4-16', 'Canalizado', 'Descarga directa a tolva de moldeo', 'Lote (5 bloques)'],
    ['M06', 'Bloques frescos a curado', 'Canalizado', 'Estibador Uline H-5440 (EQ-11) y estante móvil (EQ-10)', 'Tablero de 5 bloques'], ['M07-M08', 'Curado a inspección y laboratorio', 'Canalizado', 'Estante móvil / patín hidráulico (por definir)', 'Lote / muestra'],
    ['M09', 'Aprobados a producto terminado', 'Canalizado', 'Montacargas diésel (EQ-07) y tarimas (EQ-09)', 'Tarima de 100 bloques'], ['M11-M12', 'Pedidos y muelle', 'Canalizado', 'Montacargas (EQ-07); patín hidráulico (EQ-06) en tramos cortos', 'Tarima'],
    ['-', 'Distribución externa', 'Directo', 'Vehículos FOTON Aumark S5 (EQ-05)', 'Pedido']], { fs: 6.8 });
  p.NOTA('Hoja de coordinación de métodos: categorías (granel, sacos, líquidos, cargas unitarias, muestras) con las siglas S (sistema), E (equipo) y T (unidad transportada). Las asignaciones marcadas "por definir" deben cerrarse en la siguiente etapa del diseño.');

  /* Req 16 */
  p.H1('Req. 16 - Plano de flujo de manejo de materiales', 115);
  p.P('La distribución sigue el avance natural del producto: los camiones usan la zona posterior (almacenes de cemento, arena y gravilla), los materiales pasan a dosificación y a la nave de fabricación, luego a curado, producto terminado y muelle de carga. Así no se regresan bloques terminados hacia las materias primas. Esquema no a escala.');
  p.ensure(80);
  const Z = [[0, 0, 'Patio de maniobra (descarga MP)'], [1, 0, 'Almacenes MP (cemento, arena, grava)'], [2, 0, 'Dosificación y mezcladora'], [3, 0, 'Nave QT4-16'], [3, 1, 'Curado y secado'], [2, 1, 'Inspección / Laboratorio'], [1, 1, 'Producto terminado'], [0, 1, 'Preparación de pedidos y muelle']];
  const zx = (c) => 14 + c * 46, zy = (r) => p.y + 4 + r * 34;
  Z.forEach(([c, r, t], i) => { p.box(zx(c), zy(r), 40, 18, i < 4 ? [253, 235, 208] : [214, 240, 222], RP_AZ, 0.6); p.boxText(zx(c), zy(r), 40, 18, t, 7, 'B'); if (i < Z.length - 1) { const [c2, r2] = Z[i + 1]; if (r === r2) p.arrow(c < c2 ? zx(c) + 40 : zx(c), zy(r) + 9, c < c2 ? zx(c2) : zx(c2) + 40, zy(r2) + 9, RP_AZ, 0.8); else p.arrow(zx(c) + 20, zy(r) + 18, zx(c2) + 20, zy(r2), RP_AZ, 0.8); } });
  p.txt(10, p.y + 5 + 18 + 8, '', { s: 7 });
  const apoyo = [['Almacén de EPP', 'junto a la nave y al acceso del personal'], ['Almacén de montacargas', 'junto a curado y producto terminado'], ['Oficinas y servicios', 'alejados del ruido y polvo (relación X)']];
  p.y += 74; p.P('Áreas de apoyo ubicadas según el diagrama de relaciones: ' + apoyo.map(a => a[0] + ' (' + a[1] + ')').join('; ') + '.');
  p.NOTA('Los pasillos de montacargas deben mantenerse libres; el trabajo de transporte de bloques terminados es el más alto (Req. 8 y 10).');

  /* Req 17-18 */
  const vol = gd('vol_sha', 220000), yrs = Math.max(1, Math.round(gd('lcc_anios', 10))), tasa = gd('lcc_tasa', 10) / 100;
  const ops = [['Opción A (Manual / Carretillas)', 'a', 25000, 584000, 1.2, 150000], ['Opción B (Minicargador + Montacargas)', 'b', 450000, 219000, 0.45, 180000], ['Opción C (Bandas y sistema mixto)', 'c', 733459, 91400, 0.12, 250000]].map(([n, L, i0, f0, v0, a0]) => {
    const inv = gd('inv' + L + '_sha', i0), cf = gd('cf' + L + '_sha', f0), cv = gd('cv' + L + '_sha', v0), ah = gd('ah' + L + '_sha', a0), co = cf + cv * vol;
    let vp = 0; for (let t = 1; t <= yrs; t++) vp += co / Math.pow(1 + tasa, t);
    return { n, L, inv, cf, cv, ah, co, pb: ah > 0 ? inv / ah : 99, lcc: inv + vp, vp };
  });
  p.H1('Req. 17 - Evaluación económica (costo del ciclo de vida)');
  p.P(`Costo del ciclo de vida: LCC = Inversión + Σ Costo operativo anual / (1 + i)^t, para t = 1 a N. Parámetros: N = ${yrs} años (supuesto) y tasa de descuento i = ${(tasa * 100).toFixed(1)} % (supuesto), editables en "Datos del Reporte". Volumen anual de T.W. de la aplicación: ${fmtN(vol)}. Costo operativo anual = costo fijo + costo variable × volumen.`);
  p.TB([{ h: 'Alternativa', w: 40 }, { h: 'Inversión ($)', w: 20, al: 'R' }, { h: 'Costo fijo ($/año)', w: 22, al: 'R' }, { h: 'Costo var. ($/T.W.)', w: 18, al: 'R' }, { h: 'Costo op. anual ($)', w: 22, al: 'R' }, { h: 'LCC ($)', w: 24, al: 'R' }],
    ops.map(o => [o.n, o.inv, o.cf, o.cv, o.co, o.lcc]));
  const bestL = ops.reduce((a, b) => (b.lcc < a.lcc ? b : a));
  p.HB(ops.map(o => ({ l: o.n, v: o.lcc, c: o === bestL ? [33, 150, 80] : RP_AZ })), { title: 'LCC por alternativa ($)', d: 0 });
  p.P(`Menor costo de ciclo de vida: ${bestL.n} con $${fmtN(bestL.lcc, 2)} a ${yrs} años. Los costos de las alternativas son los capturados en la aplicación (bloque 3) y deben validarse con cotizaciones antes de decidir.`, { st: 'B' });
  p.H1('Req. 18 - Inversión inicial, costos operativos y período de recuperación');
  p.TB([{ h: 'Alternativa', w: 42 }, { h: 'Inversión ($)', w: 22, al: 'R' }, { h: 'Costo op. anual ($)', w: 24, al: 'R' }, { h: 'Ahorro anual base ($)', w: 24, al: 'R' }, { h: 'Período de recuperación', w: 28, al: 'R' }],
    ops.map(o => [o.n, o.inv, o.co, o.ah, o.L === 'a' ? `${(o.pb * 52).toFixed(1)} semanas` : `${o.pb.toFixed(2)} años`]));
  p.P('Período de recuperación simple = Inversión / Ahorro anual base (criterio de la aplicación, bloque 3). No incluye valor del dinero en el tiempo; el LCC del Req. 17 sí lo considera.');
  const rap = ops.reduce((a, b) => (b.pb < a.pb ? b : a));
  p.P(`Recuperación más rápida: ${rap.n}. Opción de menor costo operativo anual: ${ops.reduce((a, b) => (b.co < a.co ? b : a)).n}.`);

  /* Req 19 */
  p.H1('Req. 19 - Cronograma de instalación');
  const cp = cpm(PERT_ACTS);
  p.P('Red de actividades de la aplicación (bloque 8). Las duraciones están en unidades de tiempo; el equipo debe convertirlas a días o semanas cuando se disponga de un calendario de obra.');
  p.TB([{ h: 'Actividad', w: 34 }, { h: 'Duración', w: 14, al: 'R' }, { h: 'Predecesoras', w: 20 }, { h: 'Inicio temprano', w: 18, al: 'R' }, { h: 'Fin temprano', w: 18, al: 'R' }, { h: 'Inicio tardío', w: 18, al: 'R' }, { h: 'Holgura', w: 14, al: 'R' }],
    PERT_ACTS.map(a => [a.nombre, a.dur, a.pred.length ? a.pred.join(', ') : '-', cp.es[a.id], cp.ef[a.id], cp.ls[a.id], cp.ls[a.id] - cp.es[a.id]]));
  p.GANTT(PERT_ACTS.map(a => ({ n: a.nombre, es: cp.es[a.id], ef: cp.ef[a.id], crit: cp.crit.includes(a.id) })), cp.T);
  p.P(`Duración total: ${cp.T} unidades de tiempo. Ruta crítica: ${cp.crit.join(' -> ')}. Cualquier retraso en esas actividades retrasa la instalación completa.`, { st: 'B' });

  /* =====================  PARTE B · TABLAS SHA ORIGINALES  ===================== */
  p.H1('Parte B - Tablas S.H.A. de la aplicación (bloques 1 a 9)');
  p.P('Se conservan las denominaciones, encabezados y campos de cada bloque de la aplicación, con los valores vigentes. Estas tablas usan los datos de la aplicación (ver conciliación en la Introducción).');
  p.H2('SHA-1. Caracterización P-Q-R-S-T');
  p.FIN('Describir producto, cantidad, recorrido, servicios y tiempo para elegir el método de manejo.', null);
  p.TB([{ h: 'Factor', w: 34 }, { h: 'Descripción', w: 96 }], [
    ['P - Producto / Materiales', _ss('p_sha', 'Bloque hueco de concreto 15x20x40 cm (13.2 kg), Arena, Grava, Cemento')], ['Q - Cantidad (producción proyectada)', `${fmtN(prodApp)} bloques/día | ${fmtN(prodAppM)} bloques/mes (26 días) | ${pyF(pyRound(prodApp * 13.2 / 1000, 1))} t/día`],
    ['R - Recorrido / Ruta básica', _ss('r_sha', 'Almacenes MP -> Bandas Transportadoras -> Tolva/Mezclado -> Vibroprensa QT4-16 -> Fraguado -> Curado al sol -> Almacén PT -> Despacho')],
    ['S - Servicios de apoyo', _ss('sup_sha', 'Bandas transportadoras (35m, 28m, 32m), Montacargas (2.5-3t), Minicargador, Cisterna')], ['S - Control de inventario', _ss('s_sha', 'Control visual y registro manual (Bitácoras de producción)')],
    ['T - Tiempo / Frecuencia', _ss('t_sha', 'Jornada de 7 horas, 26 días/mes. Ciclo: 6.93 min')], ['Unidad de carga', _ss('uc_sha', 'Tarima Estandarizada (Bloques curados apilados - Máx 1.8 a 2.0 m)')], ['Cuello de botella (espera de mezcla)', cb.toFixed(2) + ' min']]);
  p.P(`Interpretación: con ${cb.toFixed(2)} min de espera de mezcla se proyectan ${fmtN(prodApp)} bloques/día, calculado con prodDiaria = trunc(((420 - 6.9361) / espera + 1) × 5).`);

  p.H2('SHA-2. Mapeo de flujos y Trabajo de Transporte (T.W.)');
  const fl = (S.rows_flujos || FLUJOS_BASE()).map(r => ({ o: r.origen ?? '', d: r.destino ?? '', i: num(r.intensidad_flujo), di: num(r.distancia) })); let tw1 = 0; fl.forEach(r => { r.tw = r.i * r.di; tw1 += r.tw; });
  fl.sort((a, b) => b.tw - a.tw); let ac1 = 0; fl.forEach(r => { const pr = tw1 > 0 ? r.tw / tw1 : 0; ac1 += pr; r.pm = prioMuther(ac1); r.pc = pyRound(pr * 100, 2); });
  p.FIN('Calcular el trabajo de transporte (T.W. = I × D) y priorizar las rutas con la clasificación de Muther sobre el porcentaje acumulado.', null);
  p.TB([{ h: 'Origen', w: 34 }, { h: 'Destino', w: 34 }, { h: 'Intensidad (I)', w: 14, al: 'R' }, { h: 'Distancia (D)', w: 14, al: 'R' }, { h: 'T.W.', w: 14, al: 'R' }, { h: 'Prioridad Muther', w: 12, al: 'C' }, { h: '% del Total', w: 12, al: 'R' }], fl.map(r => [r.o, r.d, r.i, r.di, r.tw, r.pm, r.pc]), { fs: 6.8 });
  if (fl.length) p.P(`Trabajo de transporte total: ${fmtN(tw1, 2)} (toneladas × metro). Mayor carga: ${fl[0].o} -> ${fl[0].d} (${pyF(fl[0].pc)} %). Prioridad Muther: A hasta 15 % acumulado, E hasta 35 %, I hasta 65 %, O hasta 90 %, U el resto.`);

  p.H2('SHA-3. Selección de equipo de acarreo y retorno de inversión');
  p.FIN('Comparar costos de operación y recuperación de tres alternativas de equipo con el volumen anual de T.W. de la aplicación.', null);
  p.TB([{ h: 'Alternativa', w: 40 }, { h: 'Inversión ($)', w: 20, al: 'R' }, { h: 'Costo op. anual ($)', w: 24, al: 'R' }, { h: 'Payback', w: 20, al: 'R' }], ops.map(o => [o.n.replace('Opción', 'Opción'), o.inv, o.co, o.L === 'a' ? `${(o.pb * 52).toFixed(1)} Semanas` : `${o.pb.toFixed(2)} Años`]));

  p.H2('SHA-4. Matriz de relaciones (departamentos)');
  const c4 = ['Departamento 1', 'Departamento 2', 'Grado Cercanía', 'Motivo'], d4 = (S.rows_rel || REL_BASE()).map(r => c4.map(c => r[c] ?? ''));
  p.FIN('Registrar el grado de cercanía requerido entre cada par de departamentos y su motivo.', null);
  p.TB([{ h: 'Departamento 1', w: 40 }, { h: 'Departamento 2', w: 40 }, { h: 'Grado Cercanía', w: 18, al: 'C' }, { h: 'Motivo', w: 36 }], d4);
  const cg = {}; d4.forEach(r => { const g = String(r[2]).toUpperCase(); cg[g] = (cg[g] || 0) + 1; });
  p.P('Resumen por grado: ' + Object.keys(cg).sort().map(k => `${k}: ${cg[k]}`).join(', ') + '. Las relaciones X exigen separar áreas por ruido y polvo (NOM-011-STPS-2001 y NOM-010-STPS-2014).');

  p.H2('SHA-5. Dimensionamiento de carriles y pasillos');
  const av = gd('ac_sha', 2.6), mv = gd('ma_sha', 0.95), eq = String(_ss('te_sha', 'Camión Torton Pesado')), vi = String(_ss('nv_sha', 'Vía única'));
  const fa = eq.includes('Peatonal') ? 0.4 : eq.includes('Montacargas') ? 0.8 : 0, anc = av * (vi.includes('Doble') ? 2 : 1) + mv * 2 + fa;
  p.FIN('Calcular el ancho mínimo de carril o pasillo: ancho = vehículo × número de vías + 2 × holgura + factor del equipo.', null);
  p.TB([{ h: 'Parámetro', w: 60 }, { h: 'Valor', w: 40, al: 'R' }], [['Equipo', eq], ['Vía', vi], ['Ancho del vehículo de diseño (m)', av], ['Holgura lateral de seguridad (m)', mv], ['Factor del equipo (m)', fa], ['Ancho mínimo de carril recomendado (m)', anc]], { totalLast: true });

  p.H2('SHA-6. Gráfico Distancia-Intensidad (D × I)');
  const d6 = (S.rows_di || DI_BASE()).map(r => ({ m: r.Movimiento, i: num(r['Intensidad (t)']), d: num(r['Distancia (m)']) })).map(r => ({ ...r, x: r.i * r.d })).sort((a, b) => b.x - a.x);
  p.TB([{ h: 'Movimiento', w: 48 }, { h: 'Intensidad (t)', w: 20, al: 'R' }, { h: 'Distancia (m)', w: 20, al: 'R' }, { h: 'D × I', w: 22, al: 'R' }], d6.map(r => [r.m, r.i, r.d, r.x]));
  if (d6.length) p.P(`Movimiento más exigente: ${d6[0].m} (D × I = ${fmtN(d6[0].x, 2)}).`);

  p.H2('SHA-7. Evaluación multicriterio (ponderación de factores de Muther)');
  const pesos = [gd('p1_sha', 40), gd('p2_sha', 20), gd('p3_sha', 20), gd('p4_sha', 20)];
  const planSel = { 'Opción A (Manual)': [['ca1_sha', 'A'], ['ea1_sha', 'I'], ['fa1_sha', 'A'], ['sa1_sha', 'U']], 'Opción B (Minicargador)': [['cb1_sha', 'I'], ['eb1_sha', 'E'], ['fb1_sha', 'I'], ['sb1_sha', 'I']], 'Opción C (Bandas)': [['cc1_sha', 'U'], ['ec1_sha', 'A'], ['fc1_sha', 'E'], ['sc1_sha', 'A']] };
  const punt = []; for (const [n, cr] of Object.entries(planSel)) { const L = cr.map(([k, d]) => String(_ss(k, d))); punt.push({ n, L, v: L.reduce((s, l, i) => s + (VALOR_LETRA[l] ?? 0) * pesos[i], 0) / 100 }); }
  p.P(`Ponderaciones: Costo ${pesos[0]} % | Espacio ${pesos[1]} % | Mantenimiento ${pesos[2]} % | Seguridad ${pesos[3]} %. Valores de letra: A = 4, E = 3, I = 2, O = 1, U = 0.`);
  p.TB([{ h: 'Sistema', w: 40 }, { h: 'Costo', w: 14, al: 'C' }, { h: 'Espacio', w: 14, al: 'C' }, { h: 'Mantenimiento', w: 18, al: 'C' }, { h: 'Seguridad', w: 14, al: 'C' }, { h: 'Puntuación', w: 18, al: 'R' }], punt.map(r => [r.n, ...r.L, +r.v.toFixed(2)]));
  const mj = punt.reduce((a, b) => (b.v > a.v ? b : a)); p.P(`Mejor alternativa: ${mj.n} con ${mj.v.toFixed(2)} puntos.`, { st: 'B' });

  p.H2('SHA-8. Indicadores clave (KPIs) y red PERT');
  const u = gd('u_sha', 538824), ct = gd('ct_sha', 691436), hd = gd('hd_sha', 2184), hr = gd('hr_sha', 2010), dl = gd('dl_sha', 10500);
  p.TB([{ h: 'Indicador', w: 56 }, { h: 'Dato de entrada', w: 34, al: 'R' }, { h: 'Resultado', w: 34, al: 'R' }], [['Costo promedio por bloque ($)', `${fmtN(ct, 0)} / ${fmtN(u, 0)}`, u > 0 ? '$' + (ct / u).toFixed(2) : '-'], ['Utilización de equipo (%)', `${fmtN(hr, 0)} h / ${fmtN(hd, 0)} h`, hd > 0 ? (hr / hd * 100).toFixed(1) + ' %' : '-'], ['Mermas (% de la producción anual)', `${fmtN(dl, 0)} / ${fmtN(u, 0)}`, u > 0 ? (dl / u * 100).toFixed(2) + ' %' : '-']]);
  p.P(`La red PERT (cronograma de instalación) se desarrolla en el Req. 19: duración total ${cp.T}, ruta crítica ${cp.crit.join(' -> ')}.`);

  p.H2('SHA-9. Finanzas, punto de equilibrio y What-If');
  const cf9 = gd('cf_whatif_sha', 144835.17), cv9 = gd('cv_whatif_sha', 10.47), pv9 = gd('pv_whatif_sha', 21), vc = gd('vcv_sha', 0), vp9 = gd('vp_sha', 0), cvA = cv9 * (1 + vc / 100), pvA = pv9 * (1 + vp9 / 100), mc = pvA - cvA;
  p.TB([{ h: 'Concepto', w: 60 }, { h: 'Valor', w: 40, al: 'R' }], [['Costos fijos ($)', cf9], ['Costo variable unitario base ($)', cv9], ['Precio de venta base ($)', pv9], ['Escenario What-If: incremento CV (%)', vc], ['Escenario What-If: ajuste de precio (%)', vp9], ['Costo variable ajustado ($)', cvA], ['Precio ajustado ($)', pvA], ['Margen de contribución unitario ($)', mc]]);
  if (mc > 0) {
    const pe = cf9 / mc, ut = prodAppM * mc - cf9;
    p.P(`Punto de equilibrio: PE = CF / (P - CV) = ${fmtN(cf9, 2)} / ${mc.toFixed(2)} = ${fmtN(Math.trunc(pe))} bloques ($${fmtN(pe * pvA, 2)} en ventas). Utilidad con ${fmtN(prodAppM)} bloques/mes: $${fmtN(ut, 2)}.`, { st: 'B' });
    const mx = Math.trunc(prodAppM * 1.2), ptsI = [], ptsC = []; for (let q = 0; q <= mx; q += Math.max(1, Math.round(mx / 24))) { ptsI.push([q, q * pvA]); ptsC.push([q, cf9 + q * cvA]); }
    p.LC([{ n: 'Ingresos', c: [30, 150, 70], p: ptsI }, { n: 'Costos', c: RP_RJ, p: ptsC }], { title: 'Ingresos y costos frente a unidades producidas ($)', xt: 'Unidades (bloques)', vx: pe, vt: 'Punto de equilibrio' });
  } else p.P('Con este escenario el margen de contribución es negativo: no existe punto de equilibrio.', { st: 'B' });

  /* =====================  PARTE C · TABLAS S.L.P.  ===================== */
  p.H1('Parte C - Tablas de la planeación sistemática de distribución (S.L.P.)');
  p.P('Tablas del procedimiento S.L.P. de Muther (Systematic Layout Planning) aplicables a ALPHA-BLOCK, adaptadas a su proceso: cuadro P-Q-R-S-T, flujo de materiales, relaciones entre actividades, razones de proximidad, matriz DE-A, intensidad de movimientos, distancias, requerimientos de espacio y comparación de alternativas. Las tablas P-Q, T.W. y de equipos ya se presentan en los requisitos 3, 8 y 15 y no se repiten.');
  p.H2('C1. Cuadro de datos P-Q-R-S-T (Unidad 2)');
  p.TB([{ h: 'Factor', w: 20 }, { h: 'Dato', w: 110 }], [['P - Producto', 'Bloque hueco de concreto BH-152040-2C (15 × 20 × 40 cm, 13.2 kg); materias primas: cemento, arena, gravilla y agua'], ['Q - Cantidad', `${fmtN(D.prod)} bloques/día; ${fmtN(D.mensual)} bloques/mes; ${fmtN(D.anual)} bloques/año; ${fmtN(D.kgB / 1000, 2)} t/día de bloques`],
    ['R - Recorrido', 'Almacenes de materia prima -> dosificación -> mezcladora -> QT4-16 -> curado y secado -> inspección -> producto terminado -> preparación de pedidos -> muelle de carga'], ['S - Servicios', 'Bandas transportadoras, tubería de agua, montacargas, patín hidráulico, estibadores, laboratorio de calidad, almacén de EPP, almacén de montacargas, oficinas y servicios al personal'],
    ['T - Tiempo', 'Jornada de 7 horas; 26 días al mes; mezclado de 28 s; ciclo de moldeo menor a 2 min por lote de 5 bloques']]);
  p.H2('C2. Tabla de flujo de materiales');
  p.TB([{ h: 'Material', w: 30 }, { h: 'Origen', w: 32 }, { h: 'Destino', w: 32 }, { h: 'Flujo (t/día)', w: 16, al: 'R' }, { h: 'Unidades/día', w: 24, al: 'R' }], D.rutas.filter(r => r.t != null).map(r => [r.mat, r.de, r.a, r.t, r.cod === 'M01' ? Math.ceil(D.kgC / 50) + ' sacos' : r.cod === 'M04' ? fmtN(D.lAg) + ' L' : r.cod === 'M02' || r.cod === 'M03' ? Math.ceil(r.t * 50) + ' cubetas eq.' : r.cod === 'M05' ? '1,490 lotes eq.' : fmtN(D.prod) + ' bloques']), { fs: 6.8 });
  p.H2('C3. Matriz de relaciones entre actividades (diagrama de rombos)');
  const rel = (S.relaciones && S.relaciones.length ? S.relaciones : null), pares = {};
  const GR = 'Grado (A,E,I,O,U,X)', CMo = 'Código Motivo';
  (rel || [[0, 1, 'A', '1'], [1, 2, 'A', '2'], [2, 3, 'A', '3'], [3, 4, 'A', '3'], [4, 5, 'A', '1'], [5, 6, 'E', '5'], [1, 8, 'E', '7'], [1, 7, 'X', '4'], [0, 7, 'X', '4'], [0, 8, 'I', '7'], [3, 9, 'E', '8'], [4, 9, 'A', '8'], [3, 10, 'E', '9']].map(a => ({ 'Área 1': a[0], 'Área 2': a[1], [GR]: a[2], [CMo]: a[3] }))).forEach(r => {
    const a = parseInt(r['Área 1']), b = parseInt(r['Área 2']); if (!Number.isFinite(a) || !Number.isFinite(b) || a === b || a < 0 || b < 0 || a >= MX_ESTACIONES.length || b >= MX_ESTACIONES.length) return;
    let g = String(r[GR] ?? 'U').toUpperCase().trim(); g = g && 'AEIOUX'.includes(g[0]) ? g[0] : 'U'; pares[Math.min(a, b) + '-' + Math.max(a, b)] = [g, String(r[CMo] ?? '-').trim() || '-'];
  });
  const nEst = MX_ESTACIONES.length, nomE = k => MX_ESTACIONES[k].replace(/^\d+\.\s*/, '');
  const filasM = []; for (let i = 0; i < nEst; i++) { const f = [(i + 1) + '. ' + nomE(i)]; for (let j = 0; j < nEst; j++) f.push(i === j ? '=' : (pares[Math.min(i, j) + '-' + Math.max(i, j)] || ['U', '-']).join('/')); filasM.push(f); }
  p.TB([{ h: 'Área', w: 40 }, ...Array.from({ length: nEst }, (_, i) => ({ h: String(i + 1), w: 10, al: 'C' }))], filasM, { fs: 6.2 });
  p.NOTA('Cada celda muestra grado/código de motivo (por ejemplo A/1). "U/-" = sin importancia y sin interacción directa. Es la misma información de la matriz interactiva de la aplicación, incluidas las áreas nuevas.');
  p.H2('C4. Razones de proximidad (códigos de motivo) y valores de cercanía');
  p.TB([{ h: 'Código', w: 10, al: 'C' }, { h: 'Motivo', w: 110 }], Object.entries(MX_MOTIVOS).map(([k, v]) => [k, v]));
  p.TB([{ h: 'Letra', w: 10, al: 'C' }, { h: 'Significado', w: 50 }, { h: 'Valor numérico', w: 18, al: 'C' }, { h: 'Cercanía', w: 60 }], [['A', 'Absolutamente necesario', 4, 'Deben quedar contiguas'], ['E', 'Especialmente importante', 3, 'Muy cerca'], ['I', 'Importante', 2, 'Cerca'], ['O', 'Ordinario', 1, 'Distancia normal'], ['U', 'Sin importancia', 0, 'No importa'], ['X', 'Indeseable', 'X', 'Lo más lejos posible']]);
  p.H2('C5. Diagrama de relaciones entre áreas (actualizado)');
  p.P('Red de relaciones de la aplicación. Se reemplazó "Taller y refacciones" por el Almacén de EPP y se agregaron el Almacén de montacargas y el Laboratorio.');
  p.ensure(110);
  const sc = 190 / 960, ox = 10, oy2 = p.y + 2, RX = 84 * sc, RY = 36 * sc, nd = {}; RD_NODOS.forEach(n => { nd[n.id] = n; });
  RD_ARISTAS.forEach(a => {
    const A = nd[a.de], B = nd[a.a], dx = (B.x - A.x) * sc, dy = (B.y - A.y) * sc, k1 = 1 / Math.max(Math.abs(dx) / RX, Math.abs(dy) / RY), c = rpHex(a.color);
    const x1 = ox + A.x * sc + dx * k1, y1 = oy2 + A.y * sc + dy * k1, x2 = ox + B.x * sc - dx * k1, y2 = oy2 + B.y * sc - dy * k1;
    p.arrow(x1, y1, x2, y2, c.map(v => Math.round(v * 0.85)), a.g === 'A' ? 1.4 : a.g === 'E' ? 1 : 0.6, a.g === 'X'); const lx = x1 + (x2 - x1) * a.lt, ly = y1 + (y2 - y1) * a.lt;
    p.box(lx - 2, ly - 2, 4, 4, [255, 255, 255]); p.txt(lx, ly + 1.1, a.g, { s: 6.5, st: 'B', al: 'C' });
  });
  RD_NODOS.forEach(n => { const x = ox + n.x * sc - RX, y = oy2 + n.y * sc - RY; p.box(x, y, RX * 2, RY * 2, rpHex(n.color), [255, 255, 255], 0.4); p.boxText(x, y, RX * 2, RY * 2, n.label.join(' '), 6, 'B', rpHex(n.tc)); });
  p.y = oy2 + 620 * sc + 3;
  p.TB([{ h: 'Relación', w: 40 }, { h: 'Grado', w: 10, al: 'C' }, { h: 'Justificación operativa', w: 80 }], [
    ['Almacenes MP -> Nave', 'A', 'Flujo continuo de cemento, arena, grava y agua hacia la mezcladora'], ['Nave -> Curado', 'A', 'Bloque fresco: minimizar el recorrido para evitar daños'], ['Curado -> Producto terminado', 'A', 'Transición continua de bloques aprobados'],
    ['Producto terminado -> Patio de maniobras', 'A', 'Carga de camiones de reparto'], ['Almacén de montacargas -> Producto terminado', 'A', 'Los montacargas trasladan las tarimas; las rutas M09, M11 y M12 son las de mayor intensidad'],
    ['Almacén de montacargas -> Curado', 'E', 'Retiro de bloques curados (ruta M09)'], ['Curado -> Laboratorio', 'E', 'Muestreo de bloques en curado para ensayo (ruta M08)'], ['Nave -> Almacén de EPP', 'E', 'El personal retira y devuelve EPP antes de ingresar a la nave'],
    ['Almacén de EPP -> Almacenes MP', 'I', 'Personal expuesto a polvo de cemento y agregados'], ['Oficinas / Servicios -> Nave / Almacenes MP', 'X', 'Separar del ruido de la QT4-16 y del polvo (NOM-011-STPS-2001 y NOM-010-STPS-2014)']], { fs: 6.8 });
  p.H2('C6. Matriz origen-destino (DE-A) en toneladas por día');
  const AR = ['CM', 'GR', 'AR', 'CI', 'DO', 'MZ', 'PR', 'CU', 'QC', 'PT', 'PK', 'MU', 'LB', 'NC'], NA = ['Alm. cemento', 'Alm. grava', 'Alm. arena', 'Cisterna', 'Dosificación', 'Mezcladora', 'QT4-16', 'Curado y secado', 'Insp. calidad', 'Prod. terminado', 'Prep. pedidos', 'Muelle carga', 'Laboratorio', 'No conforme'];
  const tM = (D.kgC + D.kgA + D.kgG + D.lAg) / 1000, fl2 = { '0-4': D.kgC / 1000, '1-4': D.kgG / 1000, '2-4': D.kgA / 1000, '3-5': D.lAg / 1000, '4-5': tM, '5-6': tM, '6-7': D.kgB / 1000, '7-8': D.kgB / 1000, '8-9': D.kgB / 1000, '9-10': D.kgB / 1000, '10-11': D.kgB / 1000 };
  const colT = Array(14).fill(0), filasD = NA.map((n, i) => { let rt = 0; const f = [(i + 1) + '. ' + n]; for (let j = 0; j < 14; j++) { const v = fl2[i + '-' + j]; if (i === j) f.push('='); else if (v != null) { f.push(v.toFixed(1)); rt += v; colT[j] += v; } else f.push('-'); } f.push(rt ? rt.toFixed(1) : '-'); return f; });
  filasD.push(['ENTRADAS', ...colT.map(v => (v ? v.toFixed(1) : '-')), colT.reduce((a, b) => a + b, 0).toFixed(1)]);
  p.TB([{ h: 'DE \\ A', w: 24 }, ...AR.map(a => ({ h: a, w: 9, al: 'C' })), { h: 'Salidas', w: 11, al: 'C' }], filasD, { fs: 5.6, totalLast: true });
  p.NOTA('"-" movimiento sin cuantificar; "=" origen igual a destino. Los traslados de curado a laboratorio y a no conformes no tienen cantidad verificada y se mantienen fuera de la matriz. Mezcladora a QT4-16 suma cemento, arena, gravilla y agua.');
  p.H2('C7. Intensidad de movimientos (escala de intensidades)');
  p.HB(D.rutas.filter(r => r.tw !== null).sort((a, b) => b.tw - a.tw).map(r => ({ l: `${r.cod} ${r.de} -> ${r.a}`, v: r.tw, c: r.tw >= 1800 ? RP_RJ : r.tw >= 400 ? [230, 130, 20] : r.tw >= 200 ? [30, 150, 80] : [140, 146, 154] })), { title: 'Escala de intensidades (t·m/día)', u: 't·m' });
  p.TB([{ h: 'Categoría', w: 20 }, { h: 'Rango (t·m/día)', w: 30 }, { h: 'Rutas', w: 80 }], ['A', 'E', 'I', 'O'].map(c => [{ A: 'A Muy alta', E: 'E Especial', I: 'I Importante', O: 'O Ordinaria' }[c], { A: '>= 1,800', E: '400 a < 1,800', I: '200 a < 400', O: '< 200' }[c], D.rutas.filter(r => r.tw !== null && rpClase(r.tw) === c).map(r => r.cod).join(', ') || '-']));
  p.H2('C8. Distancias y recorridos');
  p.TB([{ h: 'Cód.', w: 8 }, { h: 'Recorrido', w: 60 }, { h: 'Distancia (m)', w: 16, al: 'R' }, { h: 'Base', w: 46 }], D.rutas.map(r => [r.cod, r.de + ' -> ' + r.a, r.dist, r.n <= 3 ? 'Banda de longitud definida' : (r.cuant ? 'Estimación geométrica del plano' : r.nota)]), { fs: 6.8 });
  const d1 = D.rutas.filter(r => r.cuant).reduce((s, r) => s + r.dist, 0); p.P(`Recorrido acumulado de una carga de bloques desde la QT4-16 hasta el muelle: ${fmtN(D.rutas.filter(r => ['M06', 'M09', 'M11', 'M12'].includes(r.cod)).reduce((s, r) => s + r.dist, 0), 2)} m (rutas M06, M09, M11 y M12). Suma de distancias con flujo cuantificado: ${fmtN(d1, 2)} m.`);
  p.H2('C9. Requerimientos de espacio y relaciones de actividades y espacios');
  const esp = (S.rows_espacio && S.rows_espacio.length ? S.rows_espacio : MX_ESTACIONES.map(n => ({ area: n.replace(/^\d+\.\s*/, ''), m2: /Patio/.test(n) ? 390 : null })));
  const rc = k => { const o = { A: 0, E: 0, I: 0, X: 0 }; Object.entries(pares).forEach(([ky, [g]]) => { const [a, b] = ky.split('-').map(Number); if ((a === k || b === k) && g in o) o[g]++; }); return o; };
  const filE = esp.map((r, i) => { const k = MX_ESTACIONES.findIndex(n => n.replace(/^\d+\.\s*/, '') === r.area); const o = k >= 0 ? rc(k) : null; return [r.area, o ? o.A : '-', o ? o.E : '-', o ? o.I : '-', o ? o.X : '-', num(r.m2, null) === null || r.m2 === null ? 'pendiente' : r.m2]; });
  p.TB([{ h: 'Actividad / área', w: 52 }, { h: 'A', w: 10, al: 'C' }, { h: 'E', w: 10, al: 'C' }, { h: 'I', w: 10, al: 'C' }, { h: 'X', w: 10, al: 'C' }, { h: 'Superficie requerida (m²)', w: 26, al: 'R' }], filE);
  const pend = filE.filter(r => r[5] === 'pendiente').length; p.P(`Datos documentados: terreno de 141.5 × 26 m (3,679 m²) y patio de maniobra de 26 × 15 m (390 m²). Faltan ${pend} superficies por capturar en "Datos del Reporte"; no se estimaron para no inventar valores. Con ellas se obtiene el espacio disponible frente al requerido.`, { st: 'B' });
  p.H2('C10. Comparación de alternativas de distribución / manejo');
  p.TB([{ h: 'Criterio', w: 40 }, ...ops.map(o => ({ h: o.n, w: 30, al: 'R' }))], [['Inversión inicial ($)', ...ops.map(o => o.inv)], ['Costo operativo anual ($)', ...ops.map(o => o.co)], ['LCC a ' + yrs + ' años ($)', ...ops.map(o => o.lcc)], ['Período de recuperación', ...ops.map(o => o.L === 'a' ? (o.pb * 52).toFixed(1) + ' sem.' : o.pb.toFixed(2) + ' años')], ['Puntuación multicriterio', ...punt.map(r => r.v.toFixed(2))]]);
  p.H2('C11. Matriz de evaluación y selección');
  const rank = [...punt].sort((a, b) => b.v - a.v); p.TB([{ h: 'Orden', w: 12, al: 'C' }, { h: 'Alternativa', w: 50 }, { h: 'Puntuación', w: 22, al: 'R' }, { h: 'Costo / Espacio / Mantenimiento / Seguridad', w: 46 }], rank.map((r, i) => [i + 1, r.n, +r.v.toFixed(2), r.L.join(' / ')]));
  p.P(`Interpretación: con las ponderaciones vigentes la mejor alternativa es ${rank[0].n}; la de menor LCC es ${bestL.n}. Si ambas no coinciden, el equipo debe decidir qué peso dar al costo frente a espacio, mantenimiento y seguridad antes de la selección final.`);

  /* ---------- Conclusiones ---------- */
  p.H1('Conclusiones');
  const topR = D.rutas.filter(r => r.tw !== null).sort((a, b) => b.tw - a.tw)[0];
  p.B(`El proceso de ${fmtN(D.prod)} bloques/día (${fmtN(D.mensual)} al mes) es de producción repetitiva de un solo producto, adecuada para una distribución por producto con flujo lineal.`);
  p.B(`La carga unitaria de ${D.tar} bloques por tarima (${fmtN(pu, 1)} kg netos, ${util.toFixed(0)} % de la capacidad nominal) requiere ${fmtN(D.tarDia, 1)} tarimas por jornada.`);
  p.B(`El trabajo de transporte cuantificado es de ${fmtN(D.twTot, 2)} t·m/día; la ruta más intensa es ${topR.de} -> ${topR.a} (${fmtN(topR.tw, 2)} t·m/día). Los traslados de bloques con montacargas deben tener prioridad en pasillos y equipos.`);
  p.B('Las relaciones del diagrama incorporan el Almacén de EPP, el Almacén de montacargas y el Laboratorio, justificadas por el flujo de tarimas, el muestreo de calidad y la entrega de equipo de protección.');
  p.B(`La evaluación económica usa los costos precargados de la aplicación y supuestos de N = ${yrs} años e i = ${(tasa * 100).toFixed(1)} %; deben validarse con cotizaciones.`);
  p.B('Pendientes para cerrar el proyecto: tasa de rechazo medida, superficies requeridas por área, evaluación de las 7 R, pesos de tarima y sujeción, y equipo para los traslados M07, M08 y M10.');

  /* ---------- Referencias ---------- */
  p.H1('Referencias');
  ['EngiMetric. (s. f.). Material quantity calculator. https://www.engimetric.com/construction/estimation/material-quantity-calculator/', 'GS1. (2017). GS1 global traceability standard (versión 2.0). https://ref.gs1.org/standards/global-traceability/2.0.0/',
    'HF Block Machine. (s. f.). QT4-16. https://www.hfblockmachine.com/ProDetail/QT4-16.html', 'Loguera Block. (2026). Inicio [Página web]. https://www.loguerablock.com/', 'Masa Group. (s. f.). Concrete block production: Labeling and packaging. https://masa-group.com/en/products/concrete-block-production/product-handling/labeling-and-packaging/',
    'Material Handling Institute. (2000). The ten principles of material handling. https://og.mhi.org/downloads/learning/cicmhe/guidelines/10_principles.pdf', 'MHI. (2012). Glossary. https://og.mhi.org/glossary', 'Muther, R., & Hales, L. (2015). Systematic layout planning (4.ª ed.). Management & Industrial Research Publications.',
    'Triplay México. (s. f.). Tarimas de madera. https://triplaymexico.com/tarimas'].forEach(r => p.P(r, { s: 8.5, ind: 4 }));

  /* ---------- Anexos ---------- */
  p.H1('Anexo A - Registro de datos pendientes de validación');
  p.TB([{ h: 'Dato', w: 52 }, { h: 'Estado', w: 20 }, { h: 'Dónde se captura', w: 58 }], [
    ['Tasa de rechazo y defectos por causa (Pareto)', defs.length ? 'Capturado' : 'Pendiente', 'Datos del Reporte > Pareto de defectos'], ['Superficies requeridas por área', pend ? 'Pendiente (' + pend + ')' : 'Capturado', 'Datos del Reporte > Requerimientos de espacio'],
    ['Evaluación de las 7 R', NE ? `Evaluado (${NE}/7)` : 'Pendiente', 'Datos del Reporte > 7 R'], ['Horizonte y tasa de descuento del LCC', 'Supuesto', 'Datos del Reporte > Evaluación económica'], ['Costos de equipos A, B y C', 'Valores precargados', 'Bloque 3 de la aplicación'],
    ['Peso de tarima y de sujeción', 'Pendiente', 'Proveedor (Triplay México / Masa Group)'], ['Distancias de agua y mezcla (M04, M05)', 'Por confirmar', 'Plano de distribución'], ['Equipo de traslado M07, M08 y M10', 'Por definir', 'Req. 15'], ['Integrantes, docente e institución', String(_ss('cov_integrantes', '')).trim() ? 'Capturado' : 'Pendiente', 'Datos del Reporte > Portada']]);
  p.NOTA('Reporte generado por ALPHA BLOCKS - Equipo Cacahuate.');
}

function generarReporteCompleto() {
  let toc = null, pdf;
  for (let i = 0; i < 3; i++) { pdf = new RP(toc); rpConstruir(pdf); toc = pdf.toc.slice(); }
  return pdf.output();
}

/* =========================================================
   Pestaña "Datos del Reporte" (captura de datos complementarios)
   ========================================================= */
function appDatosReporte(root) {
  S.rows_pareto = S.rows_pareto || ['Fisuras o grietas', 'Despostillamientos y roturas', 'Dimensiones incorrectas', 'Deformaciones', 'Baja resistencia a compresión'].map(c => ({ causa: c, cantidad: null }));
  S.rows_espacio = S.rows_espacio || [{ area: 'Terreno total (141.5 × 26 m)', m2: 3679 }, ...MX_ESTACIONES.map(n => ({ area: n.replace(/^\d+\.\s*/, ''), m2: /Patio/.test(n) ? 390 : null }))];
  root.append(H('h2', {}, '🗂️ Datos del Reporte'),
    H('p', { class: 'caption' }, 'Datos complementarios que usa el PDF. Lo que no se captura aparece como "pendiente"; no se inventan valores.'),
    cols([1, 1],
      H('div', {}, H('h3', {}, 'Producción y carga unitaria (Unidad 2)'),
        wNumber('Producción diaria (bloques)', 'd2_prod', 7450, 50), wNumber('Peso unitario del bloque (kg)', 'd2_peso', 13.2, 0.1), wNumber('Bloques por tarima', 'd2_tarima', 100, 10), wNumber('Días laborables al mes', 'd2_dias', 26, 1),
        H('h3', {}, 'Evaluación económica (supuestos)'), wNumber('Horizonte del costo del ciclo de vida (años)', 'lcc_anios', 10, 1), wNumber('Tasa de descuento (%)', 'lcc_tasa', 10, 0.5),
        H('h3', {}, 'Portada'), wText('Integrantes del equipo', 'cov_integrantes', ''), wText('Docente', 'cov_docente', ''), wText('Institución', 'cov_inst', '')),
      H('div', {}, H('h3', {}, 'Evaluación de las 7 R'),
        ...['Material correcto', 'Cantidad adecuada', 'Condición requerida', 'Secuencia y orientación correcta', 'Lugar correcto', 'Tiempo oportuno', 'Costo óptimo'].map((n, i) => wSelect(`${i + 1}. ${n}`, 'r7_' + (i + 1), ['Sin evaluar', 'Cumple', 'No cumple'], 0)))),
    H('h3', {}, 'Pareto de defectos (piezas por causa)'),
    editor([{ k: 'causa', type: 'text' }, { k: 'cantidad', type: 'num' }], S.rows_pareto, { dynamic: true }),
    H('h3', {}, 'Requerimientos de espacio por área (m²)'),
    editor([{ k: 'area', type: 'text' }, { k: 'm2', type: 'num' }], S.rows_espacio, { dynamic: true }));
}