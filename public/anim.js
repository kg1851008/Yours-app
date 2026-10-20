// YOURS exercise animations: one flat, editorial female figure posed by joint angles.
// Each movement pattern is two poses (a = start, b = the hard part) that the figure loops between.
// Angles are absolute, in degrees, with y pointing down: 0 = right, 90 = down, -90 = up.
// Side views face right. Front and back views use N for the screen-left limb and F for the screen-right one.
(function () {
  const C = {
    bg: '#F9F7F4', ink: '#2F3720', skin: '#E3D3C1', skinFar: '#CFBBA5', shade: '#D3BFA9',
    leg: '#2F3720', legFar: '#4A5336', prim: '#C8673F', sec: '#E9B597', steel: '#8C8F80', mat: '#E9E3DA',
  };
  const W = 300, G = 258; // plate size and floor line
  const L = { trunk: 60, neck: 9, head: 11, thigh: 50, shin: 48, foot: 15, uarm: 33, farm: 29 };
  const R = Math.PI / 180;
  const dir = (a) => [Math.cos(a * R), Math.sin(a * R)];
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const lerp = (a, b, t) => a + (b - a) * t;
  const f1 = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f1(p[0])} ${f1(p[1])}`;

  const SIDE = { trunk: -90, thighN: 90, thighF: 90, shinN: 90, shinF: 90, footN: 0, footF: 0, uarmN: 93, uarmF: 87, farmN: 93, farmF: 85 };
  const FRONT = { trunk: -90, thighN: 96, thighF: 84, shinN: 92, shinF: 88, footN: 170, footF: 10, uarmN: 100, uarmF: 80, farmN: 95, farmF: 85 };

  // ---------- skeleton ----------
  function joints(pose, view) {
    const T = dir(pose.trunk);
    const J = { hip: [0, 0] };
    J.sh = add(J.hip, T, L.trunk);
    const hd = dir(pose.head == null ? pose.trunk : pose.head);
    J.neck = add(J.sh, hd, L.neck);
    J.head = add(J.neck, hd, L.head * 0.85);
    J.T = T; J.hd = hd;
    if (view === 'side') {
      J.shN = J.sh; J.shF = add(J.sh, [-T[1], T[0]], -1.5); J.hipN = J.hip; J.hipF = add(J.hip, [-T[1], T[0]], -1.5);
    } else {
      const lat = [T[1], -T[0]]; // screen-left when upright
      J.shN = add(J.sh, lat, 19); J.shF = add(J.sh, lat, -19); J.hipN = add(J.hip, lat, 11); J.hipF = add(J.hip, lat, -11);
    }
    for (const s of ['N', 'F']) {
      J['knee' + s] = add(J['hip' + s], dir(pose['thigh' + s]), L.thigh);
      J['ankle' + s] = add(J['knee' + s], dir(pose['shin' + s]), L.shin);
      J['toe' + s] = add(J['ankle' + s], dir(pose['foot' + s]), view === 'side' ? L.foot : 7);
      J['elbow' + s] = add(J['sh' + s], dir(pose['uarm' + s]), L.uarm);
      J['wrist' + s] = add(J['elbow' + s], dir(pose['farm' + s]), L.farm);
    }
    J.mid = [(J.wristN[0] + J.wristF[0]) / 2, (J.wristN[1] + J.wristF[1]) / 2];
    return J;
  }
  function moveAll(J, dx, dy) {
    for (const k of Object.keys(J)) if (k !== 'T' && k !== 'hd') J[k] = [J[k][0] + dx, J[k][1] + dy];
  }

  // ---------- drawing helpers ----------
  function limb(a, b, wa, wb, fill) {
    const d = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(d[0], d[1]) || 1, p = [-d[1] / n, d[0] / n];
    return `<path d="M${pt(add(a, p, wa / 2))} L${pt(add(b, p, wb / 2))} L${pt(add(b, p, -wb / 2))} L${pt(add(a, p, -wa / 2))} Z" fill="${fill}"/><circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="${f1(wa / 2)}" fill="${fill}"/><circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="${f1(wb / 2)}" fill="${fill}"/>`;
  }
  function smooth(points) { // closed Catmull-Rom spline
    const n = points.length;
    let d = `M${pt(points[0])}`;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
    }
    return d + ' Z';
  }
  const ell = (c, rx, ry, ang, fill, op) => `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${f1(ang)} ${f1(c[0])} ${f1(c[1])})" fill="${fill}"${op != null ? ` opacity="${f1(op * 100) / 100}"` : ''}/>`;
  const segAng = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / R;
  // An ellipse lying along a limb, pushed to its front (+1) or back (-1).
  function onSeg(a, b, s0, s1, side, off, ry, fill, op) {
    const d = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(d[0], d[1]) || 1, front = [d[1] / n, -d[0] / n];
    const c = add(add(a, d, (s0 + s1) / 2), front, side * off);
    return ell(c, (n * (s1 - s0)) / 2, ry, segAng(a, b), fill, op);
  }

  // Torso outline: [s along the spine, front offset, back offset] for side views; [s, half width] for front/back.
  const PROFILE = [[0, 12, 19], [0.14, 12, 18], [0.38, 10, 12.5], [0.6, 11, 13], [0.74, 16, 13.5], [0.9, 13, 14], [1, 8.5, 11]];
  const WIDTH = [[0, 25], [0.15, 24], [0.4, 16.5], [0.65, 19], [0.85, 22], [1, 20.5]];
  function torsoSide(J, s0, s1) {
    const T = J.T, nf = [-T[1], T[0]];
    const rows = PROFILE.filter((r) => r[0] >= s0 - 1e-6 && r[0] <= s1 + 1e-6);
    const at = (s) => { // interpolate the profile at s
      for (let i = 1; i < PROFILE.length; i++) if (s <= PROFILE[i][0]) { const a = PROFILE[i - 1], b = PROFILE[i], k = (s - a[0]) / (b[0] - a[0]); return [s, lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
      return PROFILE[PROFILE.length - 1];
    };
    const list = [at(s0), ...rows.filter((r) => r[0] > s0 && r[0] < s1), at(s1)];
    const front = list.map(([s, f]) => add(add(J.hip, T, L.trunk * s), nf, f));
    const back = list.slice().reverse().map(([s, , b]) => add(add(J.hip, T, L.trunk * s), nf, -b));
    return [...front, ...back];
  }
  function torsoFront(J, s0, s1) {
    const T = J.T, lat = [T[1], -T[0]];
    const at = (s) => { for (let i = 1; i < WIDTH.length; i++) if (s <= WIDTH[i][0]) { const a = WIDTH[i - 1], b = WIDTH[i]; return [s, lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0]))]; } return WIDTH[WIDTH.length - 1]; };
    const rows = WIDTH.filter((r) => r[0] > s0 && r[0] < s1);
    const list = [at(s0), ...rows, at(s1)];
    const left = list.map(([s, w]) => add(add(J.hip, T, L.trunk * s), lat, w));
    const right = list.slice().reverse().map(([s, w]) => add(add(J.hip, T, L.trunk * s), lat, -w));
    return [...left, ...right];
  }
  const onTrunk = (J, s, off) => add(add(J.hip, J.T, L.trunk * s), [-J.T[1], J.T[0]], off); // side: +off = front
  const onTrunkLat = (J, s, off) => add(add(J.hip, J.T, L.trunk * s), [J.T[1], -J.T[0]], off); // front/back: +off = screen-left

  // ---------- muscles ----------
  function musclesSide(J, P, Q, k) {
    const has = (m) => (P.includes(m) ? 1 : Q.includes(m) ? 2 : 0);
    const col = (m) => (has(m) === 1 ? C.prim : C.sec), op = (m) => (has(m) === 1 ? 0.55 + 0.45 * k : 0.45 + 0.35 * k);
    const ta = segAng(J.hip, J.sh);
    const out = [];
    const tr = (m, s, off, rx, ry) => { if (has(m)) out.push(ell(onTrunk(J, s, off), rx, ry, ta, col(m), op(m))); };
    tr('glutes', 0.05, -9, 9, 8.5); tr('glute-med', 0.17, -5, 5, 4); tr('lower-back', 0.36, -7, 6, 3.2); tr('lats', 0.6, -6.5, 11, 4.2);
    tr('upper-back', 0.88, -7.5, 6, 4); tr('core', 0.38, 5.5, 11, 3.6); tr('obliques', 0.45, 0, 8, 4); tr('chest', 0.8, 8.5, 6, 4.6);
    tr('pelvic-floor', 0.02, 2, 3.4, 3.4);
    const sg = (m, a, b, s0, s1, side, off, ry) => { if (has(m)) out.push(onSeg(a, b, s0, s1, side, off, ry, col(m), op(m))); };
    sg('quads', J.hipN, J.kneeN, 0.15, 0.88, 1, 3.6, 5.2); sg('hamstrings', J.hipN, J.kneeN, 0.2, 0.9, -1, 3.6, 5);
    sg('adductors', J.hipN, J.kneeN, 0.08, 0.6, 0, 0, 3.2); sg('calves', J.kneeN, J.ankleN, 0.06, 0.55, -1, 2.4, 4.4);
    sg('biceps', J.shN, J.elbowN, 0.25, 0.85, 1, 1.8, 3.4); sg('triceps', J.shN, J.elbowN, 0.25, 0.85, -1, 1.8, 3.4); sg('forearms', J.elbowN, J.wristN, 0.1, 0.65, 0, 0, 3);
    const nf = [-J.T[1], J.T[0]];
    for (const [m, o] of [['front-delts', 3], ['side-delts', 0], ['rear-delts', -3]]) if (has(m)) out.push(ell(add(J.shN, nf, o), 5.5, 5.5, 0, col(m), op(m)));
    return out.join('');
  }
  function musclesFlat(J, P, Q, k, back) {
    const has = (m) => (P.includes(m) ? 1 : Q.includes(m) ? 2 : 0);
    const col = (m) => (has(m) === 1 ? C.prim : C.sec), op = (m) => (has(m) === 1 ? 0.55 + 0.45 * k : 0.45 + 0.35 * k);
    const ta = segAng(J.hip, J.sh);
    const out = [];
    const tr = (m, s, off, rx, ry, pair) => { if (!has(m)) return; out.push(ell(onTrunkLat(J, s, off), rx, ry, ta, col(m), op(m))); if (pair) out.push(ell(onTrunkLat(J, s, -off), rx, ry, ta, col(m), op(m))); };
    const sg = (m, s0, s1, ry, seg) => { if (!has(m)) return; for (const s of ['N', 'F']) { const [a, b] = seg(s); out.push(onSeg(a, b, s0, s1, 0, 0, ry, col(m), op(m))); } };
    const dot = (m, s, o, r) => { if (!has(m)) return; for (const x of ['N', 'F']) out.push(ell(add(J['sh' + x], dir(segAng(J.sh, J['sh' + x])), o), r, r, 0, col(m), op(m))); };
    if (back) {
      tr('lats', 0.6, 9, 11, 4.6, true); tr('upper-back', 0.88, 0, 6.5, 9); tr('lower-back', 0.36, 0, 6, 5); tr('glutes', 0.07, 9, 8, 8.5, true); tr('glute-med', 0.17, 15, 4.5, 4.5, true);
      dot('rear-delts', 0, 1, 6); dot('side-delts', 0, 4, 5);
      sg('hamstrings', 0.2, 0.9, 5.4, (s) => [J['hip' + s], J['knee' + s]]); sg('calves', 0.06, 0.55, 4.6, (s) => [J['knee' + s], J['ankle' + s]]);
      sg('triceps', 0.2, 0.85, 3.6, (s) => [J['sh' + s], J['elbow' + s]]); sg('adductors', 0.08, 0.55, 3, (s) => [J['hip' + s], J['knee' + s]]);
    } else {
      tr('chest', 0.79, 8, 5.5, 6.5, true); tr('core', 0.38, 0, 12, 5.5); tr('obliques', 0.42, 13, 8, 3.5, true); tr('pelvic-floor', 0.02, 0, 3.5, 3.5);
      tr('glute-med', 0.12, 20, 4.5, 4.5, true); tr('adductors', 0.0, 6, 3, 3, true);
      dot('front-delts', 0, 0, 6); dot('side-delts', 0, 4, 5);
      sg('quads', 0.15, 0.88, 5.6, (s) => [J['hip' + s], J['knee' + s]]); sg('biceps', 0.2, 0.85, 3.6, (s) => [J['sh' + s], J['elbow' + s]]);
      sg('forearms', 0.1, 0.65, 3, (s) => [J['elbow' + s], J['wrist' + s]]);
    }
    return out.join('');
  }

  // ---------- props (hairline equipment) ----------
  const ln = (a, b, w, c, extra) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c || C.ink}" stroke-width="${w || 1.6}" stroke-linecap="round"${extra || ''}/>`;
  function prop(p, J, view) {
    const at = (k) => (Array.isArray(k) ? k : J[k]);
    switch (p.k) {
      case 'bench': return `<rect x="${p.x0}" y="${p.y}" width="${p.x1 - p.x0}" height="7" rx="3" fill="${C.ink}"/>${ln([p.x0 + 10, p.y + 7], [p.x0 + 10, G])}${ln([p.x1 - 10, p.y + 7], [p.x1 - 10, G])}`;
      case 'slab': return `<path d="M${pt(at(p.a))} L${pt(at(p.b))}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>${p.legs ? p.legs.map((q) => ln(q[0], q[1])).join('') : ''}`;
      case 'box': return `<rect x="${p.x0}" y="${p.y}" width="${p.x1 - p.x0}" height="${G - p.y}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
      case 'mat': return `<rect x="${p.x0 || 30}" y="${G - 4}" width="${(p.x1 || 270) - (p.x0 || 30)}" height="4" rx="2" fill="${C.mat}"/>`;
      case 'wall': return ln([p.x, 20], [p.x, G], 2);
      case 'bar': return `${ln([p.x0, p.y], [p.x1, p.y], 3)}${ln([p.x0 + 6, p.y], [p.x0 + 6, G], 1.4)}${ln([p.x1 - 6, p.y], [p.x1 - 6, G], 1.4)}`;
      case 'post': return `${ln([p.x, p.y0 || 18], [p.x, G], 3)}<circle cx="${p.x}" cy="${(p.y0 || 18) + 6}" r="6" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
      case 'cable': { const a = at(p.from), b = at(p.to); return `${ln(a, b, 1.2, C.steel)}<circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="4.5" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`; }
      case 'band': { const a = at(p.from), b = at(p.to); return ln(a, b, 2.2, C.prim, ' opacity=".55"'); }
      case 'loop': return ln(at(p.a), at(p.b), 2.6, C.prim, ' opacity=".6"');
      case 'plate': { const c = at(p.at); return view === 'side' ? `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${p.r || 16}" fill="${C.bg}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="3" fill="${C.ink}"/>` : ''; }
      case 'barbell': { // front/back views: a long bar through both hands
        const a = at(p.a || 'wristN'), b = at(p.b || 'wristF'), d = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(d[0], d[1]) || 1, u = [d[0] / n, d[1] / n];
        const e0 = add(a, u, -26), e1 = add(b, u, 26);
        return `${ln(e0, e1, 3)}${[e0, e1].map((e) => ln(add(e, [-u[1], u[0]], 12), add(e, [-u[1], u[0]], -12), 6)).join('')}`;
      }
      case 'db': return (p.at === 'both' ? ['wristN', 'wristF'] : [p.at]).map((k) => { const c = at(k); const ang = p.ang != null ? p.ang : 0; return `<g transform="rotate(${ang} ${f1(c[0])} ${f1(c[1])})"><rect x="${f1(c[0] - 9)}" y="${f1(c[1] - 2)}" width="18" height="4" fill="${C.ink}"/><rect x="${f1(c[0] - 11)}" y="${f1(c[1] - 5.5)}" width="5" height="11" rx="1.5" fill="${C.ink}"/><rect x="${f1(c[0] + 6)}" y="${f1(c[1] - 5.5)}" width="5" height="11" rx="1.5" fill="${C.ink}"/></g>`; }).join('');
      case 'kb': { const c = at(p.at); return `<path d="M${f1(c[0] - 5)} ${f1(c[1] + 2)} Q${f1(c[0])} ${f1(c[1] - 7)} ${f1(c[0] + 5)} ${f1(c[1] + 2)}" fill="none" stroke="${C.ink}" stroke-width="2.4"/><circle cx="${f1(c[0])}" cy="${f1(c[1] + 9)}" r="8" fill="${C.ink}"/>`; }
      case 'ball': { const c = at(p.at); return `<circle cx="${f1(c[0] + (p.dx || 0))}" cy="${f1(c[1] + (p.dy || 0))}" r="${p.r || 10}" fill="${C.ink}"/>`; }
      case 'pad': { const c = at(p.at); return `<circle cx="${f1(c[0])}" cy="${f1(c[1] + (p.dy || 0))}" r="${p.r || 6}" fill="${C.ink}"/>`; }
      case 'plateau': { const c = at(p.at); const u = dir(p.ang); return ln(add(c, u, -22), add(c, u, 22), 5); }
      default: return '';
    }
  }

  // ---------- figure ----------
  function figure(J, view, P, Q, k, opts) {
    opts = opts || {};
    const out = [];
    const arm = (s, far) => limb(J['sh' + s], J['elbow' + s], 10, 8.4, far ? C.skinFar : C.skin) + limb(J['elbow' + s], J['wrist' + s], 8.4, 6.6, far ? C.skinFar : C.skin) + `<circle cx="${f1(J['wrist' + s][0])}" cy="${f1(J['wrist' + s][1])}" r="4.2" fill="${far ? C.skinFar : C.shade}"/>`;
    const leg = (s, far) => limb(J['hip' + s], J['knee' + s], 17, 12.5, far ? C.legFar : C.leg) + limb(J['knee' + s], J['ankle' + s], 12.5, 8, far ? C.legFar : C.leg) + limb(J['ankle' + s], J['toe' + s], 7, 4.5, far ? C.skinFar : C.shade);
    if (view === 'side') {
      const nf = [-J.T[1], J.T[0]];
      out.push(arm('F', true), leg('F', true));
      out.push(`<path d="${smooth(torsoSide(J, 0, 1))}" fill="${C.skin}"/>`);
      out.push(`<path d="${smooth(torsoSide(J, 0, 0.24))}" fill="${C.leg}"/>`, `<path d="${smooth(torsoSide(J, 0.64, 0.88))}" fill="${C.leg}"/>`);
      out.push(leg('N', false));
      out.push(musclesSide(J, P, Q, k));
      out.push(limb(J.sh, J.neck, 8, 8, C.shade));
      const hb = add(J.head, nf, -2.5);
      out.push(`<circle cx="${f1(J.head[0] + nf[0] * 1.5)}" cy="${f1(J.head[1] + nf[1] * 1.5)}" r="10" fill="${C.skin}"/>`);
      out.push(`<circle cx="${f1(hb[0])}" cy="${f1(hb[1])}" r="10.4" fill="${C.ink}"/>`);
      const bun = add(add(J.head, nf, -9.5), J.hd, 3.5);
      out.push(`<circle cx="${f1(bun[0])}" cy="${f1(bun[1])}" r="6" fill="${C.ink}"/>`);
      out.push(arm('N', false));
    } else {
      const back = view === 'back';
      if (!opts.seated) out.push(leg('N', false), leg('F', false));
      out.push(`<path d="${smooth(torsoFront(J, 0, 1))}" fill="${C.skin}"/>`);
      out.push(`<path d="${smooth(torsoFront(J, 0, 0.22))}" fill="${C.leg}"/>`);
      out.push(back ? `<path d="${smooth(torsoFront(J, 0.7, 0.78))}" fill="${C.leg}"/>` : `<path d="${smooth(torsoFront(J, 0.64, 0.86))}" fill="${C.leg}"/>`);
      if (back) out.push(ln(J.sh, onTrunkLat(J, 0.24, 0), 1.2, C.shade));
      out.push(musclesFlat(J, P, Q, k, back));
      out.push(limb(J.sh, J.neck, 9, 9, C.shade));
      out.push(`<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="11.5" fill="${back ? C.ink : C.skin}"/>`);
      if (!back) out.push(`<path d="M${pt(add(J.head, [-11.5, 0], 1))} A11.5 11.5 0 0 1 ${pt(add(J.head, [11.5, 0], 1))} L${pt(add(J.head, [9, 3], 1))} A9 9 0 0 0 ${pt(add(J.head, [-9, 3], 1))} Z" fill="${C.ink}"/>`);
      const bun = add(J.head, J.hd, 11);
      out.push(`<circle cx="${f1(bun[0])}" cy="${f1(bun[1])}" r="6" fill="${C.ink}"/>`);
      out.push(arm('N', false), arm('F', false));
    }
    return out.join('');
  }

  // ---------- movement patterns ----------
  // view, a, b (poses over the defaults), at (where the anchor joint sits in each pose), props, load (where the weight is held).
  const sym = (n) => 180 - n; // mirror an angle for the other side in front/back views
  const P = {};
  const stand = {};
  P.squat = { view: 'side', anchor: 'ankleN', at: [[142, G - 4], [142, G - 4]], load: 'chest',
    a: { uarmN: 100, uarmF: 96, farmN: -60, farmF: -64 }, b: { trunk: -64, thighN: 12, thighF: 14, shinN: 112, shinF: 110, uarmN: 118, uarmF: 114, farmN: -40, farmF: -44 } };
  P.backSquat = { ...P.squat, load: 'back', a: { uarmN: 150, uarmF: 146, farmN: -48, farmF: -52 }, b: { trunk: -58, thighN: 14, thighF: 16, shinN: 112, shinF: 110, uarmN: 175, uarmF: 172, farmN: -30, farmF: -34 } };
  P.boxSquat = { ...P.backSquat, props: [{ k: 'box', x0: 70, x1: 112, y: 196 }] };
  P.sitToStand = { ...P.squat, load: null, props: [{ k: 'box', x0: 70, x1: 112, y: 196 }], a: { uarmN: 0, uarmF: 2, farmN: 0, farmF: 2 }, b: { trunk: -62, thighN: 10, thighF: 12, shinN: 110, shinF: 108, uarmN: 5, uarmF: 7, farmN: 2, farmF: 4 } };
  P.thruster = { view: 'side', anchor: 'ankleN', at: [[142, G - 4], [142, G - 4]], load: 'hands',
    a: { trunk: -64, thighN: 12, thighF: 14, shinN: 112, shinF: 110, uarmN: 118, uarmF: 114, farmN: -82, farmF: -86 }, b: { uarmN: -94, uarmF: -90, farmN: -92, farmF: -88 } };
  P.legPress = { view: 'side', anchor: 'hip', at: [[110, 212], [110, 212]], load: null,
    props: [{ k: 'slab', a: [70, 236], b: [128, 228] }, { k: 'slab', a: [78, 232], b: [40, 172] }, { k: 'plateau', at: 'ankleN', ang: -50 }],
    a: { trunk: -150, head: -140, thighN: -58, thighF: -55, shinN: 22, shinF: 25, footN: -50, footF: -47, uarmN: 20, uarmF: 22, farmN: 10, farmF: 12 },
    b: { trunk: -150, head: -140, thighN: -30, thighF: -28, shinN: -26, shinF: -24, footN: -65, footF: -62, uarmN: 20, uarmF: 22, farmN: 10, farmF: 12 } };
  P.splitSquat = { view: 'side', anchor: 'ankleN', at: [[170, G - 4], [170, G - 4]], load: 'hands', props: [{ k: 'bench', x0: 40, x1: 92, y: 206 }],
    a: { thighN: 70, shinN: 98, thighF: 128, shinF: 168, footF: 200 }, b: { trunk: -84, thighN: 12, shinN: 104, thighF: 104, shinF: 176, footF: 205 } };
  P.supportedSplit = { ...P.splitSquat, props: [], at: [[176, G - 4], [176, G - 4]], a: { thighN: 72, shinN: 100, thighF: 112, shinF: 108, footF: 0 }, b: { trunk: -86, thighN: 18, shinN: 104, thighF: 96, shinF: 172, footF: -30 } };
  P.lunge = { view: 'side', anchor: 'ankleN', at: [[176, G - 4], [176, G - 4]], load: 'hands',
    a: {}, b: { trunk: -86, thighN: 16, shinN: 100, thighF: 100, shinF: 168, footF: -40 } };
  P.stepUp = { view: 'side', anchor: 'ankleN', at: [[168, 200], [168, 200]], load: 'hands', props: [{ k: 'box', x0: 140, x1: 210, y: 204 }],
    a: { trunk: -80, thighN: 18, shinN: 100, thighF: 106, shinF: 96 }, b: { thighF: 14, shinF: 92 } };
  P.jump = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 34]], load: null,
    a: { trunk: -58, thighN: 14, thighF: 16, shinN: 112, shinF: 110, uarmN: 140, uarmF: 136, farmN: 130, farmF: 126 },
    b: { trunk: -92, thighN: 94, thighF: 98, shinN: 96, shinF: 100, footN: 60, footF: 64, uarmN: -112, uarmF: -108, farmN: -104, farmF: -100 } };
  P.boxJump = { ...P.jump, props: [{ k: 'box', x0: 190, x1: 250, y: 214 }] };
  P.slam = { view: 'side', anchor: 'ankleN', at: [[140, G - 4], [140, G - 4]], load: null, props: [{ k: 'ball', at: 'mid', dy: -4, r: 9 }],
    a: { trunk: -96, uarmN: -100, uarmF: -96, farmN: -100, farmF: -96 }, b: { trunk: -40, thighN: 30, thighF: 32, shinN: 108, shinF: 106, uarmN: 70, uarmF: 74, farmN: 80, farmF: 84 } };
  P.sled = { view: 'side', anchor: 'hip', at: [[120, 170], [120, 170]], ground: true, load: null, props: [{ k: 'slab', a: [214, 150], b: [214, G - 4] }, { k: 'slab', a: [214, G - 6], b: [262, G - 6] }],
    a: { trunk: -30, head: -24, thighN: 46, shinN: 104, footN: 10, thighF: 128, shinF: 112, footF: 40, uarmN: -4, uarmF: -2, farmN: -8, farmF: -6 }, b: { trunk: -30, head: -24, thighN: 128, shinN: 112, footN: 40, thighF: 46, shinF: 104, footF: 10, uarmN: -4, uarmF: -2, farmN: -8, farmF: -6 } };
  P.rdl = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { uarmN: 92, uarmF: 90, farmN: 92, farmF: 90 }, b: { trunk: -14, head: -4, thighN: 104, thighF: 104, shinN: 84, shinF: 84, uarmN: 104, uarmF: 102, farmN: 100, farmF: 98 } };
  P.slRdl = { view: 'side', anchor: 'ankleN', at: [[170, G - 4], [170, G - 4]], load: 'hands',
    a: { thighF: 96, shinF: 120 }, b: { trunk: -4, head: 4, thighN: 96, shinN: 86, thighF: 182, shinF: 182, footF: 270, uarmN: 92, uarmF: 90, farmN: 92, farmF: 90 } };
  P.deadlift = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { trunk: -36, head: -20, thighN: 22, thighF: 24, shinN: 104, shinF: 102, uarmN: 92, uarmF: 90, farmN: 92, farmF: 90 }, b: {} };
  P.swing = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { trunk: -26, head: -10, thighN: 100, thighF: 102, shinN: 82, shinF: 84, uarmN: 116, uarmF: 114, farmN: 120, farmF: 118 }, b: { uarmN: -4, uarmF: -2, farmN: -4, farmF: -2 } };
  P.pullThrough = { ...P.swing, load: null, props: [{ k: 'cable', from: [40, G - 12], to: 'mid' }], b: { uarmN: 70, uarmF: 72, farmN: 70, farmF: 72 } };
  P.hipThrust = { view: 'side', anchor: 'sh', at: [[96, 200], [96, 200]], load: 'hip', props: [{ k: 'bench', x0: 50, x1: 100, y: 204 }],
    a: { trunk: -158, head: -150, thighN: -14, thighF: -12, shinN: 76, shinF: 78, footN: 0, footF: 0, uarmN: 0, uarmF: 2, farmN: -40, farmF: -38 },
    b: { trunk: 180, head: -165, thighN: 2, thighF: 4, shinN: 90, shinF: 92, footN: 0, footF: 0, uarmN: 6, uarmF: 8, farmN: -60, farmF: -58 } };
  P.slHipThrust = { ...P.hipThrust, a: { ...P.hipThrust.a, thighF: -50, shinF: -10 }, b: { ...P.hipThrust.b, thighF: -28, shinF: -24 } };
  P.bridge = { view: 'side', anchor: 'sh', at: [[100, G - 10], [100, G - 10]], load: 'hip', props: [{ k: 'mat' }],
    a: { trunk: 180, head: 180, thighN: -42, thighF: -40, shinN: 62, shinF: 64, uarmN: 4, uarmF: 6, farmN: 2, farmF: 4 },
    b: { trunk: 158, head: 176, thighN: -14, thighF: -12, shinN: 86, shinF: 88, uarmN: 4, uarmF: 6, farmN: 2, farmF: 4 } };
  P.slBridge = { ...P.bridge, a: { ...P.bridge.a, thighF: -64, shinF: -64 }, b: { ...P.bridge.b, thighF: -26, shinF: -24 } };
  P.backExt = { view: 'side', anchor: 'ankleN', at: [[70, 236], [70, 236]], load: null, props: [{ k: 'slab', a: [102, 218], b: [126, 194], legs: [[[70, 240], [130, 240]], [[120, 202], [120, G]]] }],
    a: { trunk: 48, head: 60, thighN: 136, thighF: 138, shinN: 136, shinF: 138, footN: 50, footF: 52, uarmN: 100, uarmF: 102, farmN: 100, farmF: 102 },
    b: { trunk: -44, head: -40, thighN: 136, thighF: 138, shinN: 136, shinF: 138, footN: 50, footF: 52, uarmN: 150, uarmF: 152, farmN: -60, farmF: -58 } };
  P.legCurl = { view: 'side', anchor: 'hip', at: [[130, 196], [130, 196]], load: null, props: [{ k: 'bench', x0: 66, x1: 230, y: 204 }, { k: 'pad', at: 'ankleN', dy: -6 }],
    a: { trunk: -2, head: -10, thighN: 180, thighF: 181, shinN: 180, shinF: 181, footN: 90, footF: 91, uarmN: 70, uarmF: 72, farmN: -10, farmF: -8 },
    b: { trunk: -2, head: -10, thighN: 176, thighF: 177, shinN: 262, shinF: 263, footN: 350, footF: 351, uarmN: 70, uarmF: 72, farmN: -10, farmF: -8 } };
  P.seatedLegCurl = { view: 'side', anchor: 'hip', at: [[120, 196], [120, 196]], load: null, props: [{ k: 'slab', a: [96, 206], b: [150, 206] }, { k: 'slab', a: [92, 202], b: [84, 140] }, { k: 'pad', at: 'ankleN', dy: -2 }],
    a: { trunk: -100, thighN: 0, thighF: 2, shinN: 4, shinF: 6, footN: -80, footF: -78 }, b: { trunk: -100, thighN: 0, thighF: 2, shinN: 96, shinF: 98, footN: 6, footF: 8 } };
  P.nordic = { view: 'side', anchor: 'kneeN', at: [[110, G - 6], [110, G - 6]], load: null, props: [{ k: 'mat' }, { k: 'pad', at: 'ankleN', dy: -8 }],
    a: { trunk: -90, head: -88, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 96, uarmF: 94, farmN: -40, farmF: -42 },
    b: { trunk: -58, head: -52, thighN: 122, thighF: 123, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 50, uarmF: 52, farmN: 40, farmF: 42 } };
  P.ballCurl = { ...P.bridge, props: [{ k: 'mat' }, { k: 'ball', at: 'ankleN', dy: 4, r: 15 }], a: { trunk: 172, head: 178, thighN: -6, thighF: -5, shinN: -4, shinF: -3, uarmN: 4, uarmF: 6, farmN: 2, farmF: 4 }, b: { trunk: 160, head: 176, thighN: -42, thighF: -40, shinN: 40, shinF: 42, uarmN: 4, uarmF: 6, farmN: 2, farmF: 4 } };
  P.calf = { view: 'side', anchor: 'toeN', at: [[160, G - 3], [160, G - 3]], load: 'hands', a: { footN: 0, footF: 0 }, b: { footN: 34, footF: 34 } };
  P.seatedCalf = { view: 'side', anchor: 'hip', at: [[120, 190], [120, 182]], load: null, props: [{ k: 'bench', x0: 78, x1: 136, y: 198 }, { k: 'pad', at: 'kneeN', dy: -9 }],
    a: { trunk: -88, thighN: 2, thighF: 4, shinN: 90, shinF: 92, footN: 0, footF: 2, uarmN: 50, uarmF: 52, farmN: 0, farmF: 2 }, b: { trunk: -88, thighN: 2, thighF: 4, shinN: 90, shinF: 92, footN: 34, footF: 36, uarmN: 50, uarmF: 52, farmN: 0, farmF: 2 } };
  P.hop = { ...P.calf, anchor: 'toeN', at: [[160, G - 3], [160, G - 18]], load: null, b: { footN: 40, footF: 40, uarmN: 120, uarmF: 116, farmN: 60, farmF: 56 } };
  P.pulldown = { view: 'back', seated: true, anchor: 'hip', at: [[150, 214], [150, 214]], load: null, props: [{ k: 'post', x: 150 }, { k: 'cable', from: [150, 24], to: 'mid' }, { k: 'barbell' }, { k: 'slab', a: [108, 226], b: [192, 226] }],
    a: { thighN: 160, thighF: 20, shinN: 92, shinF: 88, uarmN: -112, uarmF: sym(-112), farmN: -108, farmF: sym(-108) }, b: { thighN: 160, thighF: 20, shinN: 92, shinF: 88, uarmN: 128, uarmF: sym(128), farmN: -78, farmF: sym(-78) } };
  P.straightPulldown = { view: 'side', anchor: 'ankleN', at: [[130, G - 4], [130, G - 4]], load: null, props: [{ k: 'post', x: 250 }, { k: 'cable', from: [250, 24], to: 'wristN' }],
    a: { trunk: -76, head: -70, thighN: 96, thighF: 94, shinN: 86, shinF: 88, uarmN: -36, uarmF: -34, farmN: -36, farmF: -34 }, b: { trunk: -76, head: -70, thighN: 96, thighF: 94, shinN: 86, shinF: 88, uarmN: 84, uarmF: 86, farmN: 84, farmF: 86 } };
  P.pullup = { view: 'back', anchor: 'mid', at: [[150, 40], [150, 40]], load: null, props: [{ k: 'bar', x0: 70, x1: 230, y: 40 }],
    a: { uarmN: -106, uarmF: sym(-106), farmN: -100, farmF: sym(-100), thighN: 92, thighF: 88, shinN: 110, shinF: 112 }, b: { uarmN: 160, uarmF: sym(160), farmN: -64, farmF: sym(-64), thighN: 92, thighF: 88, shinN: 112, shinF: 114 } };
  P.hang = { ...P.pullup, b: { ...P.pullup.a, uarmN: -102, uarmF: sym(-102), farmN: -98, farmF: sym(-98) } };
  P.row = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { trunk: -28, head: -14, thighN: 104, thighF: 104, shinN: 80, shinF: 80, uarmN: 90, uarmF: 88, farmN: 90, farmF: 88 }, b: { trunk: -28, head: -14, thighN: 104, thighF: 104, shinN: 80, shinF: 80, uarmN: 158, uarmF: 156, farmN: 78, farmF: 76 } };
  P.seatedRow = { view: 'side', anchor: 'hip', at: [[110, 236], [110, 236]], load: null, props: [{ k: 'mat', x0: 60, x1: 270 }, { k: 'post', x: 262, y0: 200 }, { k: 'cable', from: [262, 218], to: 'mid' }],
    a: { trunk: -70, thighN: -6, thighF: -4, shinN: 12, shinF: 14, footN: -70, footF: -68, uarmN: 4, uarmF: 6, farmN: 2, farmF: 4 }, b: { trunk: -94, thighN: -6, thighF: -4, shinN: 12, shinF: 14, footN: -70, footF: -68, uarmN: 140, uarmF: 138, farmN: 2, farmF: 4 } };
  P.invertedRow = { view: 'side', anchor: 'ankleN', at: [[48, G - 4], [48, G - 4]], load: null, props: [{ k: 'bar', x0: 200, x1: 260, y: 150 }],
    a: { trunk: -22, head: -22, thighN: 158, thighF: 159, shinN: 158, shinF: 159, footN: 250, footF: 251, uarmN: -60, uarmF: -58, farmN: -60, farmF: -58 }, b: { trunk: -22, head: -22, thighN: 158, thighF: 159, shinN: 158, shinF: 159, footN: 250, footF: 251, uarmN: 70, uarmF: 72, farmN: -76, farmF: -74 } };
  P.pushup = { view: 'side', anchor: 'toeN', at: [[60, G - 2], [60, G - 2]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -18, head: -14, thighN: 162, thighF: 163, shinN: 162, shinF: 163, footN: 100, footF: 101, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 },
    b: { trunk: -6.5, head: -4, thighN: 173.5, thighF: 174.5, shinN: 173.5, shinF: 174.5, footN: 110, footF: 111, uarmN: 162, uarmF: 164, farmN: 43, farmF: 45 } };
  P.inclinePush = { ...P.pushup, at: [[52, G - 2], [52, G - 2]], props: [{ k: 'bench', x0: 200, x1: 262, y: 186 }],
    a: { trunk: -36, head: -32, thighN: 144, thighF: 145, shinN: 144, shinF: 145, footN: 80, footF: 81, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 },
    b: { trunk: -28, head: -26, thighN: 152, thighF: 153, shinN: 152, shinF: 153, footN: 85, footF: 86, uarmN: 150, uarmF: 152, farmN: 70, farmF: 72 } };
  P.wallPush = { view: 'side', anchor: 'toeN', at: [[120, G - 2], [120, G - 2]], load: null, props: [{ k: 'wall', x: 214 }],
    a: { trunk: -66, head: -64, thighN: 114, thighF: 115, shinN: 114, shinF: 115, footN: 10, footF: 11, uarmN: -12, uarmF: -10, farmN: -12, farmF: -10 }, b: { trunk: -62, head: -60, thighN: 118, thighF: 119, shinN: 118, shinF: 119, footN: 14, footF: 15, uarmN: 70, uarmF: 72, farmN: -40, farmF: -38 } };
  P.dip = { view: 'side', anchor: 'wristN', at: [[110, 200], [110, 200]], load: null, props: [{ k: 'bench', x0: 70, x1: 116, y: 202 }],
    a: { trunk: -90, thighN: -4, thighF: -2, shinN: 80, shinF: 82, uarmN: 92, uarmF: 94, farmN: 92, farmF: 94 }, b: { trunk: -92, thighN: -2, thighF: 0, shinN: 74, shinF: 76, uarmN: 160, uarmF: 162, farmN: 70, farmF: 72 } };
  P.press = { view: 'side', anchor: 'sh', at: [[96, 194], [96, 194]], load: 'hands', props: [{ k: 'bench', x0: 70, x1: 176, y: 204 }],
    a: { trunk: 180, head: 186, thighN: 24, thighF: 26, shinN: 98, shinF: 100, uarmN: -90, uarmF: -88, farmN: -90, farmF: -88 },
    b: { trunk: 180, head: 186, thighN: 24, thighF: 26, shinN: 98, shinF: 100, uarmN: 104, uarmF: 106, farmN: -84, farmF: -82 } };
  P.inclinePress = { view: 'side', anchor: 'hip', at: [[150, 200], [150, 200]], load: 'hands', props: [{ k: 'slab', a: [150, 208], b: [104, 132], legs: [[[130, 176], [130, G]]] }, { k: 'slab', a: [140, 208], b: [196, 208] }],
    a: { trunk: -122, head: -116, thighN: 4, thighF: 6, shinN: 92, shinF: 94, uarmN: -32, uarmF: -30, farmN: -32, farmF: -30 },
    b: { trunk: -122, head: -116, thighN: 4, thighF: 6, shinN: 92, shinF: 94, uarmN: 116, uarmF: 118, farmN: -40, farmF: -38 } };
  P.fly = { view: 'front', anchor: 'ankleN', at: [[132, G - 4], [132, G - 4]], load: 'hands',
    a: { uarmN: 176, uarmF: sym(176), farmN: 172, farmF: sym(172) }, b: { uarmN: 24, uarmF: sym(24), farmN: -10, farmF: sym(-10) } };
  P.ohp = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { uarmN: 128, uarmF: 124, farmN: -86, farmF: -88 }, b: { uarmN: -92, uarmF: -90, farmN: -90, farmF: -88 } };
  P.seatedOhp = { ...P.ohp, anchor: 'hip', at: [[140, 200], [140, 200]], props: [{ k: 'bench', x0: 100, x1: 160, y: 204 }],
    a: { ...P.ohp.a, thighN: 0, thighF: 2, shinN: 90, shinF: 92 }, b: { ...P.ohp.b, thighN: 0, thighF: 2, shinN: 90, shinF: 92 } };
  P.lateral = { view: 'front', anchor: 'ankleN', at: [[138, G - 4], [138, G - 4]], load: 'hands',
    a: { uarmN: 100, uarmF: sym(100), farmN: 96, farmF: sym(96) }, b: { uarmN: 182, uarmF: sym(182), farmN: 178, farmF: sym(178) } };
  P.rearDelt = { view: 'back', anchor: 'ankleN', at: [[138, G - 4], [138, G - 4]], load: 'hands',
    a: { uarmN: 100, uarmF: sym(100), farmN: 96, farmF: sym(96) }, b: { uarmN: 186, uarmF: sym(186), farmN: 186, farmF: sym(186) } };
  P.facePull = { view: 'side', anchor: 'ankleN', at: [[120, G - 4], [120, G - 4]], load: null, props: [{ k: 'post', x: 262 }, { k: 'cable', from: [262, 92], to: 'wristN' }],
    a: { uarmN: -14, uarmF: -12, farmN: -14, farmF: -12 }, b: { uarmN: 186, uarmF: 184, farmN: -60, farmF: -62 } };
  P.yRaise = { view: 'side', anchor: 'toeN', at: [[60, G - 2], [60, G - 2]], load: null, props: [{ k: 'mat' }],
    a: { trunk: 0, head: 6, thighN: 180, thighF: 181, shinN: 180, shinF: 181, footN: 120, footF: 121, uarmN: 160, uarmF: 162, farmN: 160, farmF: 162 }, b: { trunk: -4, head: -6, thighN: 180, thighF: 181, shinN: 180, shinF: 181, footN: 120, footF: 121, uarmN: -16, uarmF: -14, farmN: -16, farmF: -14 } };
  P.curl = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { uarmN: 92, uarmF: 90, farmN: 88, farmF: 86 }, b: { uarmN: 96, uarmF: 94, farmN: -84, farmF: -86 } };
  P.pushdown = { view: 'side', anchor: 'ankleN', at: [[140, G - 4], [140, G - 4]], load: null, props: [{ k: 'post', x: 196 }, { k: 'cable', from: [196, 30], to: 'wristN' }],
    a: { trunk: -84, head: -80, uarmN: 94, uarmF: 92, farmN: -14, farmF: -16 }, b: { trunk: -84, head: -80, uarmN: 94, uarmF: 92, farmN: 84, farmF: 82 } };
  P.ohTriceps = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: 'hands',
    a: { uarmN: -100, uarmF: -98, farmN: 100, farmF: 102 }, b: { uarmN: -96, uarmF: -94, farmN: -94, farmF: -92 } };
  P.pallof = { view: 'side', anchor: 'ankleN', at: [[150, G - 4], [150, G - 4]], load: null, props: [{ k: 'band', from: [150, 150], to: 'wristN' }],
    a: { thighN: 98, thighF: 82, shinN: 86, shinF: 98, uarmN: 116, uarmF: 114, farmN: -10, farmF: -12 }, b: { thighN: 98, thighF: 82, shinN: 86, shinF: 98, uarmN: -6, uarmF: -4, farmN: -6, farmF: -4 } };
  P.plank = { view: 'side', anchor: 'toeN', at: [[56, G - 2], [56, G - 2]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -6, head: -2, thighN: 172, thighF: 173, shinN: 172, shinF: 173, footN: 105, footF: 106, uarmN: 92, uarmF: 94, farmN: 0, farmF: 2 }, b: { trunk: -7, head: -5, thighN: 171, thighF: 172, shinN: 171, shinF: 172, footN: 104, footF: 105, uarmN: 92, uarmF: 94, farmN: 0, farmF: 2 } };
  P.sidePlank = { view: 'front', anchor: 'ankleN', at: [[64, G - 4], [64, G - 4]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -14, head: -14, thighN: 168, thighF: 166, shinN: 168, shinF: 166, footN: 90, footF: 80, uarmN: 90, uarmF: -88, farmN: 0, farmF: -88 }, b: { trunk: -19, head: -19, thighN: 163, thighF: 161, shinN: 163, shinF: 161, footN: 90, footF: 80, uarmN: 90, uarmF: -92, farmN: 0, farmF: -92 } };
  P.deadBug = { view: 'side', anchor: 'sh', at: [[96, G - 10], [96, G - 10]], load: null, props: [{ k: 'mat' }],
    a: { trunk: 180, head: 180, thighN: -88, thighF: -86, shinN: 0, shinF: 2, footN: -60, footF: -58, uarmN: -90, uarmF: -88, farmN: -90, farmF: -88 },
    b: { trunk: 180, head: 180, thighN: -14, thighF: -86, shinN: -10, shinF: 2, footN: -70, footF: -58, uarmN: -90, uarmF: -176, farmN: -90, farmF: -176 } };
  P.hollow = { ...P.deadBug, a: { trunk: 186, head: 196, thighN: -24, thighF: -23, shinN: -24, shinF: -23, footN: -60, footF: -59, uarmN: -168, uarmF: -167, farmN: -168, farmF: -167 }, b: { trunk: 190, head: 200, thighN: -30, thighF: -29, shinN: -30, shinF: -29, footN: -66, footF: -65, uarmN: -164, uarmF: -163, farmN: -164, farmF: -163 } };
  P.hundred = { ...P.deadBug, a: { trunk: 194, head: 205, thighN: -40, thighF: -39, shinN: -40, shinF: -39, footN: -20, footF: -19, uarmN: 0, uarmF: 2, farmN: 0, farmF: 2 }, b: { trunk: 194, head: 205, thighN: -40, thighF: -39, shinN: -40, shinF: -39, footN: -20, footF: -19, uarmN: 12, uarmF: 14, farmN: 12, farmF: 14 } };
  P.vSit = { view: 'side', anchor: 'hip', at: [[130, G - 12], [130, G - 12]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -150, head: -140, thighN: -20, thighF: -19, shinN: 30, shinF: 31, footN: 0, footF: 1, uarmN: -10, uarmF: -8, farmN: -10, farmF: -8 }, b: { trunk: -126, head: -116, thighN: -54, thighF: -53, shinN: -54, shinF: -53, footN: -20, footF: -19, uarmN: -36, uarmF: -34, farmN: -36, farmF: -34 } };
  P.rollUp = { ...P.vSit, at: [[110, G - 12], [110, G - 12]], a: { trunk: 180, head: 180, thighN: 0, thighF: 1, shinN: 0, shinF: 1, footN: -80, footF: -79, uarmN: 180, uarmF: 181, farmN: 180, farmF: 181 }, b: { trunk: -50, head: -20, thighN: 0, thighF: 1, shinN: 0, shinF: 1, footN: -80, footF: -79, uarmN: 10, uarmF: 12, farmN: 10, farmF: 12 } };
  P.birdDog = { view: 'side', anchor: 'kneeN', at: [[100, G - 6], [100, G - 6]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -2, head: 10, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: -2, head: 4, thighN: 90, thighF: 180, shinN: 180, shinF: 180, footN: 180, footF: 180, uarmN: 90, uarmF: -4, farmN: 90, farmF: -4 } };
  P.kickback = { ...P.birdDog, anchor: 'kneeF', a: { trunk: -2, head: 10, thighN: 92, thighF: 90, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: -2, head: 10, thighN: 186, thighF: 90, shinN: 270, shinF: 181, footN: 360, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 } };
  P.cableKickback = { view: 'side', anchor: 'ankleF', at: [[150, G - 4], [150, G - 4]], load: null, props: [{ k: 'post', x: 250 }, { k: 'cable', from: [250, G - 12], to: 'ankleN' }],
    a: { trunk: -66, head: -60, thighN: 96, shinN: 92, thighF: 92, shinF: 88, uarmN: -10, uarmF: -12, farmN: 30, farmF: 28 }, b: { trunk: -62, head: -56, thighN: 140, shinN: 130, thighF: 92, shinF: 88, uarmN: -10, uarmF: -12, farmN: 30, farmF: 28 } };
  P.catCow = { ...P.birdDog, a: { trunk: 4, head: 30, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: -10, head: -30, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 } };
  P.child = { view: 'side', anchor: 'kneeN', at: [[96, G - 6], [96, G - 6]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -10, head: 6, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: 10, head: 24, thighN: 14, thighF: 15, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: -2, uarmF: 0, farmN: 0, farmF: 2 } };
  P.downDog = { view: 'side', anchor: 'toeN', at: [[60, G - 2], [80, G - 2]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -12, head: -8, thighN: 168, thighF: 169, shinN: 168, shinF: 169, footN: 100, footF: 101, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: 46, head: 60, thighN: 128, thighF: 129, shinN: 128, shinF: 129, footN: 20, footF: 21, uarmN: 46, uarmF: 48, farmN: 46, farmF: 48 } };
  P.seatedFold = { view: 'side', anchor: 'hip', at: [[110, G - 12], [110, G - 12]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -92, thighN: 0, thighF: 1, shinN: 0, shinF: 1, footN: -80, footF: -79, uarmN: -90, uarmF: -88, farmN: -90, farmF: -88 }, b: { trunk: -24, head: -10, thighN: 0, thighF: 1, shinN: 0, shinF: 1, footN: -80, footF: -79, uarmN: 4, uarmF: 6, farmN: 4, farmF: 6 } };
  P.supineKnees = { view: 'side', anchor: 'sh', at: [[100, G - 10], [100, G - 10]], load: null, props: [{ k: 'mat' }],
    a: { trunk: 180, head: 180, thighN: -60, thighF: -58, shinN: 40, shinF: 42, uarmN: 170, uarmF: 172, farmN: 170, farmF: 172 }, b: { trunk: 180, head: 180, thighN: -100, thighF: -98, shinN: -40, shinF: -38, uarmN: -60, uarmF: -58, farmN: -40, farmF: -38 } };
  P.legsWall = { view: 'side', anchor: 'sh', at: [[100, G - 10], [100, G - 10]], load: null, props: [{ k: 'mat' }, { k: 'wall', x: 168 }],
    a: { trunk: 180, head: 180, thighN: -86, thighF: -85, shinN: -86, shinF: -85, footN: 0, footF: 1, uarmN: 160, uarmF: 162, farmN: 170, farmF: 172 }, b: { trunk: 180, head: 180, thighN: -90, thighF: -89, shinN: -90, shinF: -89, footN: 4, footF: 5, uarmN: 160, uarmF: 162, farmN: 170, farmF: 172 } };
  P.swan = { view: 'side', anchor: 'toeN', at: [[50, G - 2], [50, G - 2]], load: null, props: [{ k: 'mat' }],
    a: { trunk: 0, head: 10, thighN: 180, thighF: 181, shinN: 180, shinF: 181, footN: 150, footF: 151, uarmN: 100, uarmF: 102, farmN: 0, farmF: 2 }, b: { trunk: -22, head: -36, thighN: 180, thighF: 181, shinN: 180, shinF: 181, footN: 150, footF: 151, uarmN: 90, uarmF: 92, farmN: 80, farmF: 82 } };
  P.sideLying = { view: 'front', anchor: 'hip', at: [[130, G - 14], [130, G - 14]], load: null, props: [{ k: 'mat' }],
    a: { trunk: 180, head: 200, thighN: 4, thighF: 0, shinN: 4, shinF: 0, footN: -60, footF: -60, uarmN: 180, uarmF: 0, farmN: -150, farmF: 30 }, b: { trunk: 180, head: 200, thighN: 4, thighF: -32, shinN: 4, shinF: -32, footN: -60, footF: -90, uarmN: 180, uarmF: 0, farmN: -150, farmF: 30 } };
  P.clam = { ...P.sideLying, a: { ...P.sideLying.a, thighN: 30, thighF: 28, shinN: 160, shinF: 158, footN: 140, footF: 140 }, b: { ...P.sideLying.a, thighN: 30, thighF: -20, shinN: 160, shinF: 150, footN: 140, footF: 120 } };
  P.abduction = { view: 'front', anchor: 'hip', at: [[150, 198], [150, 198]], load: null, props: [{ k: 'bench', x0: 110, x1: 190, y: 204 }],
    a: { thighN: 100, thighF: 80, shinN: 92, shinF: 88, uarmN: 110, uarmF: 70, farmN: 80, farmF: 100 }, b: { thighN: 124, thighF: 56, shinN: 96, shinF: 84, uarmN: 110, uarmF: 70, farmN: 80, farmF: 100 } };
  P.lateralWalk = { view: 'front', anchor: 'hip', at: [[140, 152], [160, 152]], load: null, props: [{ k: 'loop', a: 'kneeN', b: 'kneeF' }],
    a: { trunk: -86, thighN: 110, thighF: 80, shinN: 86, shinF: 94 }, b: { trunk: -86, thighN: 96, thighF: 66, shinN: 90, shinF: 98 } };
  P.carry = { view: 'side', anchor: 'hip', at: [[150, 158], [150, 158]], load: 'hands', ground: true,
    a: { thighN: 72, thighF: 108, shinN: 94, shinF: 116, footN: -6, footF: 30 }, b: { thighN: 108, thighF: 72, shinN: 116, shinF: 94, footN: 30, footF: -6 } };
  P.walk = { ...P.carry, load: null, a: { ...P.carry.a, uarmN: 110, uarmF: 72 }, b: { ...P.carry.b, uarmN: 72, uarmF: 110 } };
  P.balance = { view: 'front', anchor: 'ankleN', at: [[146, G - 4], [146, G - 4]], load: null,
    a: { thighN: 92, shinN: 90, thighF: 30, shinF: 120, uarmN: 150, uarmF: sym(150), farmN: 160, farmF: sym(160) }, b: { thighN: 92, shinN: 90, thighF: 20, shinF: 110, uarmN: 170, uarmF: sym(170), farmN: 176, farmF: sym(176) } };
  P.tree = { ...P.balance, a: { thighN: 92, shinN: 90, thighF: 20, shinF: 140, uarmN: -70, uarmF: sym(-70), farmN: -110, farmF: sym(-110) }, b: { thighN: 92, shinN: 90, thighF: 18, shinF: 142, uarmN: -76, uarmF: sym(-76), farmN: -104, farmF: sym(-104) } };
  P.warrior = { view: 'front', anchor: 'hip', at: [[150, 170], [150, 182]], load: null, props: [{ k: 'mat' }],
    a: { thighN: 120, thighF: 60, shinN: 110, shinF: 70, uarmN: 100, uarmF: 80, farmN: 96, farmF: 84 }, b: { thighN: 160, thighF: 64, shinN: 100, shinF: 64, footN: 180, uarmN: 180, uarmF: 0, farmN: 180, farmF: 0 } };
  P.goddess = { ...P.warrior, a: { thighN: 120, thighF: 60, shinN: 104, shinF: 76, uarmN: 100, uarmF: 80, farmN: 96, farmF: 84 }, b: { thighN: 166, thighF: 14, shinN: 96, shinF: 84, uarmN: 180, uarmF: 0, farmN: -90, farmF: -90 } };
  P.lowLunge = { view: 'side', anchor: 'ankleN', at: [[184, G - 4], [184, G - 4]], load: null, props: [{ k: 'mat' }],
    a: { thighN: 30, shinN: 98, thighF: 110, shinF: 180, footF: 180 }, b: { trunk: -98, head: -100, thighN: 20, shinN: 100, thighF: 140, shinF: 182, footF: 180, uarmN: -96, uarmF: -94, farmN: -96, farmF: -94 } };
  P.chair = { ...P.squat, b: { trunk: -60, thighN: 30, thighF: 32, shinN: 108, shinF: 106, uarmN: -120, uarmF: -118, farmN: -120, farmF: -118 }, a: { uarmN: -94, uarmF: -92, farmN: -94, farmF: -92 } };
  P.breathe = { view: 'side', anchor: 'hip', at: [[120, G - 12], [120, G - 12]], load: null, props: [{ k: 'mat' }],
    a: { trunk: -90, thighN: 10, thighF: 14, shinN: 168, shinF: 172, footN: 180, footF: 180, uarmN: 70, uarmF: 72, farmN: 20, farmF: 22 }, b: { trunk: -92, head: -96, thighN: 10, thighF: 14, shinN: 168, shinF: 172, footN: 180, footF: 180, uarmN: 70, uarmF: 72, farmN: 20, farmF: 22 } };
  P.rotation = { ...P.birdDog, a: { trunk: -2, head: 10, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: 92, farmN: 90, farmF: 92 }, b: { trunk: -6, head: -40, thighN: 90, thighF: 92, shinN: 180, shinF: 181, footN: 180, footF: 181, uarmN: 90, uarmF: -86, farmN: 90, farmF: -86 } };
  P.throwRot = { view: 'side', anchor: 'ankleN', at: [[130, G - 4], [130, G - 4]], load: null, props: [{ k: 'ball', at: 'mid', r: 9 }, { k: 'wall', x: 268 }],
    a: { trunk: -84, thighN: 96, thighF: 84, shinN: 86, shinF: 96, uarmN: 150, uarmF: 146, farmN: 120, farmF: 116 }, b: { trunk: -88, thighN: 84, thighF: 100, shinN: 96, shinF: 84, uarmN: -10, uarmF: -8, farmN: -14, farmF: -12 } };
  P.landmine = { ...P.ohp, load: null, props: [{ k: 'slab', a: [40, G - 4], b: 'wristN' }], a: { trunk: -84, uarmN: 116, uarmF: 112, farmN: -60, farmF: -64 }, b: { trunk: -78, uarmN: -36, uarmF: -34, farmN: -40, farmF: -38 } };
  P.kneelPress = { ...P.ohp, anchor: 'kneeF', at: [[150, G - 6], [150, G - 6]], props: [{ k: 'mat' }], a: { ...P.ohp.a, thighN: 0, shinN: 92, thighF: 92, shinF: 180, footF: 180 }, b: { ...P.ohp.b, thighN: 0, shinN: 92, thighF: 92, shinF: 180, footF: 180 } };

  // Exercise name -> pattern. First match wins; specific names come before general ones.
  const MAP = [
    [/^360 breathing|pelvic floor/i, 'breathe'], [/thruster/i, 'thruster'], [/box squat/i, 'boxSquat'], [/back squat|hack squat|front-loaded/i, 'backSquat'],
    [/sit-to-stand/i, 'sitToStand'], [/chair pose/i, 'chair'], [/goddess/i, 'goddess'], [/squat jump|broad jump|lateral bound|pogo/i, /pogo/i], [/box jump|step-up hop/i, 'boxJump'],
    [/bulgarian/i, 'splitSquat'], [/supported split|split squat/i, 'supportedSplit'], [/squat/i, 'squat'], [/leg press/i, 'legPress'],
    [/low lunge|crescent|hip flexor stretch|pigeon/i, 'lowLunge'], [/lunge/i, 'lunge'], [/step-up|step-down/i, 'stepUp'],
    [/single-leg romanian|hip airplane/i, 'slRdl'], [/romanian/i, 'rdl'], [/deadlift/i, 'deadlift'], [/swing/i, 'swing'], [/pull-through/i, 'pullThrough'],
    [/single-leg hip thrust|b-stance/i, 'slHipThrust'], [/hip thrust/i, 'hipThrust'], [/single-leg (glute )?bridge/i, 'slBridge'], [/bridge|frog pump|pelvic tilt/i, 'bridge'],
    [/back extension|hip extension/i, 'backExt'], [/nordic/i, 'nordic'], [/stability ball/i, 'ballCurl'], [/seated leg curl/i, 'seatedLegCurl'], [/leg curl/i, 'legCurl'],
    [/seated calf/i, 'seatedCalf'], [/calf|heel drops/i, 'calf'],
    [/straight-arm/i, 'straightPulldown'], [/pulldown/i, 'pulldown'], [/dead hang|flexed-arm|scapular/i, 'hang'], [/pull-up/i, 'pullup'],
    [/rotational/i, 'throwRot'], [/pallof/i, 'pallof'], [/seated cable row/i, 'seatedRow'], [/inverted row/i, 'invertedRow'], [/row/i, 'row'],
    [/wall push-up/i, 'wallPush'], [/incline push-up/i, 'inclinePush'], [/push-up/i, 'pushup'], [/bench dip/i, 'dip'],
    [/incline dumbbell press/i, 'inclinePress'], [/bench press|floor press|chest press/i, 'press'], [/reverse dumbbell fly|pull-apart/i, 'rearDelt'], [/fly|pec deck/i, 'fly'],
    [/landmine/i, 'landmine'], [/half-kneeling dumbbell press/i, 'kneelPress'], [/seated dumbbell shoulder|machine shoulder/i, 'seatedOhp'], [/press/i, 'ohp'],
    [/lateral raise/i, 'lateral'], [/face pull/i, 'facePull'], [/y-raise/i, 'yRaise'], [/reverse dumbbell fly|pull-apart/i, 'rearDelt'],
    [/curl/i, 'curl'], [/pushdown/i, 'pushdown'], [/triceps extension/i, 'ohTriceps'],
    [/side plank|copenhagen/i, 'sidePlank'], [/plank/i, 'plank'], [/dead bug|heel slides|toe taps/i, 'deadBug'], [/hollow/i, 'hollow'],
    [/teaser|boat/i, 'vSit'], [/roll-up|spine stretch|saw/i, 'rollUp'], [/hundred|leg stretch|criss-cross|leg circles/i, 'hundred'],
    [/bird dog|swimming/i, 'birdDog'], [/cable kickback/i, 'cableKickback'], [/kickback/i, 'kickback'], [/cat-cow/i, 'catCow'], [/thread the needle|thoracic/i, 'rotation'],
    [/child/i, 'child'], [/downward dog|sun salutation/i, 'downDog'], [/forward fold/i, 'seatedFold'], [/legs up the wall/i, 'legsWall'],
    [/happy baby|reclined twist|90\/90/i, 'supineKnees'], [/swan/i, 'swan'], [/clam/i, 'clam'], [/side kick|side-lying leg/i, 'sideLying'],
    [/lateral walk/i, 'lateralWalk'], [/abduction/i, 'abduction'], [/carry/i, 'carry'], [/walk/i, 'walk'], [/sled/i, 'sled'],
    [/medicine ball slam/i, 'slam'], [/tree/i, 'tree'], [/warrior|triangle/i, 'warrior'], [/balance/i, 'balance'],
  ];
  function patternFor(name) {
    for (const [re, id] of MAP) if (re.test(name)) return id instanceof RegExp ? (id.test(name) ? 'hop' : 'jump') : id;
    return null;
  }

  // Where the weight sits, by equipment.
  function loadProps(pat, equipment, view) {
    const eq = String(equipment || '').toLowerCase();
    if (!pat.load || /bodyweight|band|machine|cable|bench|mat|box/.test(eq) && !/dumbbell|barbell|kettlebell/.test(eq)) return [];
    const flat = view !== 'side';
    if (/barbell|trap bar/.test(eq)) {
      if (pat.load === 'back') return [{ k: 'plate', at: 'sh' }];
      if (pat.load === 'hip') return [{ k: 'plate', at: 'hip', r: 15 }];
      return flat ? [{ k: 'barbell' }] : [{ k: 'plate', at: 'wristN' }];
    }
    if (/kettlebell/.test(eq)) return [{ k: 'kb', at: pat.load === 'chest' ? 'mid' : 'wristN' }];
    if (pat.load === 'hip') return [{ k: 'db', at: 'hip', ang: 0 }];
    if (pat.load === 'chest' || pat.load === 'back') return [{ k: 'db', at: 'mid', ang: 90 }];
    return [{ k: 'db', at: flat ? 'both' : 'wristN', ang: flat ? 90 : 0 }];
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  // Phase of the loop at time ms: up, hold, down, rest.
  function phaseAt(ms, period) {
    const x = (ms % period) / period;
    return x < 0.38 ? ease(x / 0.38) : x < 0.5 ? 1 : x < 0.92 ? 1 - ease((x - 0.5) / 0.42) : 0;
  }

  // Centre each move in the plate: moves done lying down sit low, so lift the whole scene to the middle.
  const FRAME = {};
  function frameShift(id) {
    if (FRAME[id] != null) return FRAME[id];
    const pat = P[id];
    if ((pat.props || []).some((p) => ['post', 'bar', 'wall'].includes(p.k))) return (FRAME[id] = 0);
    let top = G;
    for (const t of [0, 0.5, 1]) {
      const J = place(pat, t);
      for (const k of Object.keys(J)) if (Array.isArray(J[k]) && k !== 'T' && k !== 'hd') top = Math.min(top, J[k][1] - (k === 'head' ? 14 : 6));
      for (const p of pat.props || []) if (p.y != null) top = Math.min(top, p.y);
    }
    return (FRAME[id] = Math.min(0, Math.round(152 - (top + G + 6) / 2)));
  }
  function place(pat, k) {
    const base = pat.view === 'side' ? SIDE : FRONT;
    const pose = {};
    for (const key of Object.keys(base)) pose[key] = lerp(pat.a[key] != null ? pat.a[key] : base[key], pat.b[key] != null ? pat.b[key] : (pat.a[key] != null ? pat.a[key] : base[key]), k);
    const ha = pat.a.head != null ? pat.a.head : pose.trunk, hb = pat.b.head != null ? pat.b.head : (pat.a.head != null ? pat.a.head : pose.trunk);
    pose.head = pat.a.head != null || pat.b.head != null ? lerp(ha, hb, k) : null;
    const J = joints(pose, pat.view);
    const target = [lerp(pat.at[0][0], pat.at[1][0], k), lerp(pat.at[0][1], pat.at[1][1], k)];
    const src = J[pat.anchor];
    moveAll(J, target[0] - src[0], target[1] - src[1]);
    if (pat.ground) { const low = Math.max(J.toeN[1], J.toeF[1], J.ankleN[1], J.ankleF[1]); moveAll(J, 0, G - 3 - low); }
    return J;
  }

  function svg(name, opts) {
    opts = opts || {};
    const id = patternFor(name);
    if (!id) return '';
    const pat = P[id];
    const k = opts.t == null ? 1 : opts.t;
    const J = place(pat, k);
    const dy = frameShift(id);
    const props = [...(pat.props || []), ...loadProps(pat, opts.equipment, pat.view)];
    const P1 = opts.primary || [], Q1 = opts.secondary || [];
    const behind = props.filter((p) => ['bench', 'slab', 'box', 'mat', 'wall', 'bar', 'post', 'cable', 'band'].includes(p.k));
    const front = props.filter((p) => !behind.includes(p));
    const label = opts.label ? `<text x="18" y="28" font-family="'DM Mono', ui-monospace, monospace" font-size="9" letter-spacing="2.2" fill="${C.ink}">${String(opts.label).toUpperCase().replace(/[&<>"]/g, '')}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" class="ex-anim-svg" role="img" aria-label="${String(name).replace(/[&<>"]/g, '')} demonstration">
      <rect width="${W}" height="${W}" fill="${C.bg}"/>${label}<g transform="translate(0 ${dy})">
      ${ln([18, G], [W - 18, G], 1, C.ink, ' opacity=".3"')}
      ${behind.map((p) => prop(p, J, pat.view)).join('')}
      ${figure(J, pat.view, P1, Q1, k, pat)}
      ${front.map((p) => prop(p, J, pat.view)).join('')}</g>
    </svg>`;
  }

  const api = { svg, patternFor, phaseAt, PATTERNS: P, period: 2800 };
  if (typeof window !== 'undefined') window.YOURS_ANIM = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
