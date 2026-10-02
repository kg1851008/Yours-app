// In-memory stand-in for the parts of Supabase YOURS uses, for tests.
// backend.handle(op) runs in Node; BROWSER_CLIENT is a script that defines window.YOURS_TEST_CLIENT, a
// supabase-js-shaped client that forwards every call to window.__sb (exposed by Playwright), so several
// browser contexts can share one backend like real devices share one project.
const crypto = require('node:crypto');

function createBackend(opts) {
  const confirmEmail = !!(opts && opts.confirmEmail);
  const db = { users: [], profiles: [], user_data: [], posts: [], comments: [], likes: [], messages: [], reports: [], subscriptions: [], files: {} };
  const tokens = {};
  const now = () => new Date(Date.now() + (db.tick = (db.tick || 0) + 1)).toISOString();
  const err = (message) => ({ data: null, error: { message } });
  const userOf = (token) => db.users.find((u) => u.id === tokens[token]);
  const pub = (u) => ({ id: u.id, email: u.email, user_metadata: { name: u.name }, identities: [{}] });

  function session(u) {
    const token = crypto.randomUUID();
    tokens[token] = u.id;
    return { access_token: token, user: pub(u) };
  }

  const auth = {
    signUp({ email, password, options }) {
      if (db.users.some((u) => u.email === email)) return confirmEmail ? { data: { user: { id: 'x', identities: [] }, session: null }, error: null } : err('User already registered');
      const u = { id: crypto.randomUUID(), email, password, name: (options && options.data && options.data.name) || '', confirmed: !confirmEmail };
      db.users.push(u);
      db.profiles.push({ id: u.id, name: u.name || 'Member' });
      return { data: { user: pub(u), session: u.confirmed ? session(u) : null }, error: null };
    },
    signInWithPassword({ email, password }) {
      const u = db.users.find((x) => x.email === email && x.password === password);
      if (!u) return err('Invalid login credentials');
      if (!u.confirmed) return err('Email not confirmed');
      return { data: { user: pub(u), session: session(u) }, error: null };
    },
    getUser(token) { const u = userOf(token); return { data: { user: u ? pub(u) : null }, error: null }; },
    updateUser(token, { password }) { const u = userOf(token); if (!u) return err('not signed in'); u.password = password; return { data: { user: pub(u) }, error: null }; },
    resetPasswordForEmail() { return { data: {}, error: null }; },
  };

  function confirm(email) { const u = db.users.find((x) => x.email === email); if (u) u.confirmed = true; }

  function match(row, filters) {
    return filters.every((f) => {
      if (f.op === 'eq') return String(row[f.col]) === String(f.val);
      if (f.op === 'in') return f.val.map(String).includes(String(row[f.col]));
      if (f.op === 'or') return f.val.split(',').some((c) => { const [col, , v] = c.split('.'); return String(row[col]) === v; });
      return true;
    });
  }

  function query(token, q) {
    const u = userOf(token);
    if (!u) return err('JWT expired');
    const t = db[q.table];
    if (q.action === 'select') {
      let rows = t.filter((r) => match(r, q.filters));
      if (q.table === 'user_data' || q.table === 'subscriptions') rows = rows.filter((r) => r.user_id === u.id);
      if (q.table === 'messages') rows = rows.filter((r) => r.from_id === u.id || r.to_id === u.id);
      if (q.order) rows = rows.slice().sort((a, b) => (a[q.order.col] < b[q.order.col] ? -1 : 1) * (q.order.ascending ? 1 : -1));
      if (q.limit) rows = rows.slice(0, q.limit);
      if (q.table === 'posts') rows = rows.map((p) => ({ ...p, likes: db.likes.filter((l) => l.post_id === p.id).map((l) => ({ user_id: l.user_id })), comments: db.comments.filter((c) => c.post_id === p.id) }));
      return { data: JSON.parse(JSON.stringify(rows)), error: null };
    }
    if (q.action === 'insert' || q.action === 'upsert') {
      const v = { ...q.values };
      if (q.table === 'posts' || q.table === 'comments') { v.id = crypto.randomUUID(); v.user_id = u.id; v.author_name = (db.profiles.find((p) => p.id === u.id) || {}).name || 'Member'; v.created_at = now(); }
      if (q.table === 'messages') { v.id = crypto.randomUUID(); v.from_id = u.id; v.created_at = now(); }
      if (q.table === 'reports') { v.reporter_id = u.id; }
      if (q.table === 'user_data') { if (v.user_id !== u.id) return err('row-level security'); const i = t.findIndex((r) => r.user_id === u.id); if (i > -1) t[i] = v; else t.push(v); return { data: null, error: null }; }
      if (q.table === 'likes') { v.user_id = u.id; if (t.some((r) => r.post_id === v.post_id && r.user_id === u.id)) return { data: null, error: null }; }
      t.push(v);
      return { data: null, error: null };
    }
    if (q.action === 'update') {
      t.filter((r) => match(r, q.filters) && (r.id === u.id || r.user_id === u.id)).forEach((r) => Object.assign(r, q.values));
      return { data: null, error: null };
    }
    if (q.action === 'delete') {
      db[q.table] = t.filter((r) => !(match(r, q.filters) && (r.user_id === u.id)));
      if (q.table === 'posts') { const ids = new Set(db.posts.map((p) => p.id)); db.comments = db.comments.filter((c) => ids.has(c.post_id)); db.likes = db.likes.filter((l) => ids.has(l.post_id)); }
      return { data: null, error: null };
    }
    return err('unsupported');
  }

  function storage(token, fn, args) {
    const u = userOf(token);
    if (!u) return err('JWT expired');
    const own = (path) => path.split('/')[0] === u.id;
    if (fn === 'list') { const [folder] = args; if (folder !== u.id) return { data: [], error: null }; return { data: Object.keys(db.files).filter((p) => p.startsWith(folder + '/')).map((p) => ({ name: p.slice(folder.length + 1) })), error: null }; }
    if (fn === 'upload') { const [path, text] = args; if (!own(path)) return err('row-level security'); db.files[path] = text; return { data: { path }, error: null }; }
    if (fn === 'download') { const [path] = args; if (!own(path) || !(path in db.files)) return err('Object not found'); return { data: db.files[path], error: null }; }
    if (fn === 'remove') { args[0].forEach((p) => { if (own(p)) delete db.files[p]; }); return { data: [], error: null }; }
    return err('unsupported');
  }

  function rpc(token, name) {
    const u = userOf(token);
    if (!u) return err('not signed in');
    if (name === 'delete_my_account') {
      db.users = db.users.filter((x) => x.id !== u.id);
      ['profiles'].forEach((k) => { db[k] = db[k].filter((r) => r.id !== u.id); });
      ['user_data', 'posts', 'comments', 'likes'].forEach((k) => { db[k] = db[k].filter((r) => r.user_id !== u.id); });
      db.messages = db.messages.filter((m) => m.from_id !== u.id && m.to_id !== u.id);
      return { data: null, error: null };
    }
    return err('unknown function');
  }

  function handle(op) {
    if (op.kind === 'auth') {
      if (op.fn === 'getUser' || op.fn === 'updateUser') return auth[op.fn](op.token, op.args[0]);
      return auth[op.fn](...op.args);
    }
    if (op.kind === 'query') return query(op.token, op.q);
    if (op.kind === 'storage') return storage(op.token, op.fn, op.args);
    if (op.kind === 'rpc') return rpc(op.token, op.name);
    return err('unknown op');
  }
  const tokenUser = (token) => { const u = userOf(token); return u ? { id: u.id, email: u.email } : null; };
  return { db, handle, confirm, tokenUser };
}

// Runs in the page. Session persists in localStorage like supabase-js.
const BROWSER_CLIENT = `(() => {
  const KEY = 'sb-test-auth';
  const listeners = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const call = (op) => { const s = load(); return window.__sb({ ...op, token: s && s.access_token }); };
  const emit = (ev, s) => listeners.forEach((cb) => cb(ev, s));
  function builder(table) {
    const q = { table, filters: [], action: 'select' };
    const b = {
      select(sel) { q.select = sel; return b; },
      eq(col, val) { q.filters.push({ op: 'eq', col, val }); return b; },
      in(col, val) { q.filters.push({ op: 'in', col, val }); return b; },
      or(val) { q.filters.push({ op: 'or', val }); return b; },
      order(col, o) { q.order = { col, ascending: !(o && o.ascending === false) }; return b; },
      limit(n) { q.limit = n; return b; },
      insert(values) { q.action = 'insert'; q.values = values; return b; },
      upsert(values) { q.action = 'upsert'; q.values = values; return b; },
      update(values) { q.action = 'update'; q.values = values; return b; },
      delete() { q.action = 'delete'; return b; },
      then(res, rej) { return call({ kind: 'query', q }).then(res, rej); },
    };
    return b;
  }
  window.YOURS_TEST_CLIENT = () => ({
    auth: {
      async getSession() { const s = load(); if (!s) return { data: { session: null }, error: null }; const r = await call({ kind: 'auth', fn: 'getUser', args: [] }); if (!r.data.user) { localStorage.removeItem(KEY); return { data: { session: null }, error: null }; } return { data: { session: { ...s, user: r.data.user } }, error: null }; },
      async signUp(a) { const r = await call({ kind: 'auth', fn: 'signUp', args: [a] }); if (r.data && r.data.session) { localStorage.setItem(KEY, JSON.stringify(r.data.session)); emit('SIGNED_IN', r.data.session); } return r; },
      async signInWithPassword(a) { const r = await call({ kind: 'auth', fn: 'signInWithPassword', args: [a] }); if (r.data && r.data.session) { localStorage.setItem(KEY, JSON.stringify(r.data.session)); emit('SIGNED_IN', r.data.session); } return r; },
      async signOut() { localStorage.removeItem(KEY); emit('SIGNED_OUT', null); return { error: null }; },
      async resetPasswordForEmail(e) { return call({ kind: 'auth', fn: 'resetPasswordForEmail', args: [e] }); },
      async updateUser(a) { return call({ kind: 'auth', fn: 'updateUser', args: [a] }); },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: builder,
    rpc: (name) => call({ kind: 'rpc', name }),
    storage: { from: () => ({
      list: (folder, o) => call({ kind: 'storage', fn: 'list', args: [folder, o] }),
      upload: async (path, blob) => call({ kind: 'storage', fn: 'upload', args: [path, await blob.text()] }),
      download: async (path) => { const r = await call({ kind: 'storage', fn: 'download', args: [path] }); return r.error ? r : { data: new Blob([r.data]), error: null }; },
      remove: (paths) => call({ kind: 'storage', fn: 'remove', args: [paths] }),
    }) },
    channel() { const ch = { on() { return ch; }, subscribe() { return ch; } }; return ch; },
    removeChannel() {},
  });
  window.YOURS_CONFIG = { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-anon' };
})();`;

module.exports = { createBackend, BROWSER_CLIENT };
