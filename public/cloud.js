// YOURS cloud: accounts, cross-device sync, encrypted photo backup and the shared community, on Supabase.
// Turned on by public/config.js (project URL + public anon key). Without a key the app stays fully on-device.
// The Supabase client is injected (createClient), so this file has no network code of its own and is testable in Node.
(function () {
  const ID = (uid) => `c:${uid}`;
  const UID = (id) => String(id || '').replace(/^c:/, '');
  const ts = (iso) => new Date(iso).getTime();

  // Whole-document sync: whichever copy changed last wins.
  function pickNewer(local, localUpdated, remote) {
    if (!remote || !remote.data) return local ? 'push' : 'none';
    if (!local || !local.onboarded) return 'pull';
    if (!remote.data.onboarded) return 'push'; // never let an empty plan replace a finished one
    return (remote.updated || 0) > (localUpdated || 0) ? 'pull' : (remote.updated || 0) < (localUpdated || 0) ? 'push' : 'none';
  }

  // Rows from Supabase -> the shape the community screens already use.
  function mapFeed(rows, myId, blocked) {
    const hide = new Set(blocked || []);
    return (rows || []).filter((r) => !hide.has(ID(r.user_id))).map((r) => ({
      id: r.id,
      author: ID(r.user_id),
      authorName: r.author_name,
      text: r.text,
      tag: r.tag,
      phase: r.phase || null,
      ts: ts(r.created_at),
      baseLikes: 0,
      likedBy: (r.likes || []).map((l) => ID(l.user_id)),
      comments: (r.comments || []).filter((c) => !hide.has(ID(c.user_id))).sort((a, b) => ts(a.created_at) - ts(b.created_at)).map((c) => ({ id: c.id, author: ID(c.user_id), authorName: c.author_name, text: c.text, ts: ts(c.created_at) })),
      mine: ID(r.user_id) === myId,
    }));
  }
  function mapThreads(rows, myId, blocked) {
    const hide = new Set(blocked || []);
    const threads = {};
    (rows || []).slice().sort((a, b) => ts(a.created_at) - ts(b.created_at)).forEach((m) => {
      const from = ID(m.from_id);
      const to = ID(m.to_id);
      const other = from === myId ? to : from;
      if (hide.has(other)) return;
      const key = [myId, other].sort().join('|');
      (threads[key] = threads[key] || []).push({ id: m.id, from, text: m.text, ts: ts(m.created_at) });
    });
    return threads;
  }
  const friendlyError = (e) => {
    const msg = (e && (e.message || e.error_description)) || 'Something went wrong';
    if (/invalid login credentials/i.test(msg)) return 'That email and password do not match.';
    if (/email not confirmed/i.test(msg)) return 'Confirm your email first: check your inbox for the link, then sign in.';
    if (/already registered|already exists/i.test(msg)) return 'An account with that email already exists. Sign in instead.';
    if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
    if (/failed to fetch|network/i.test(msg)) return 'Could not reach YOURS. Check your connection.';
    return msg;
  };

  function create(config, createClient) {
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey || typeof createClient !== 'function') return null;
    const sb = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    let user = null;
    const must = (res) => { if (res && res.error) throw res.error; return res ? res.data : null; };
    const setUser = (u) => { user = u ? { id: u.id, email: (u.email || '').toLowerCase(), name: (u.user_metadata && u.user_metadata.name) || '' } : null; return user; };

    const api = {
      enabled: true,
      user: () => user,
      myId: () => (user ? ID(user.id) : null),
      friendlyError,

      async init() {
        try { const d = must(await sb.auth.getSession()); return setUser(d && d.session ? d.session.user : null); } catch { return null; }
      },
      async signUp(email, password, name) {
        const d = must(await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: typeof location !== 'undefined' ? location.origin : undefined } }));
        // With "Confirm email" on (the Supabase default) there is no session until she clicks the link.
        if (d.user && Array.isArray(d.user.identities) && d.user.identities.length === 0) throw new Error('User already registered');
        setUser(d.session ? d.session.user : null);
        return { user, needsConfirm: !d.session };
      },
      async signIn(email, password) {
        const d = must(await sb.auth.signInWithPassword({ email, password }));
        return setUser(d.user);
      },
      async resetPassword(email, redirectTo) { must(await sb.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)); },
      async updatePassword(password) { must(await sb.auth.updateUser({ password })); },
      async signOut() { try { await sb.auth.signOut(); } catch { /* signed out locally anyway */ } user = null; },
      onAuth(cb) { const r = sb.auth.onAuthStateChange((event, session) => { setUser(session ? session.user : null); cb(event, user); }); return () => r.data.subscription.unsubscribe(); },

      // ---- app data ----
      async pullData() {
        const rows = must(await sb.from('user_data').select('data, updated').eq('user_id', user.id).limit(1));
        return rows && rows[0] ? rows[0] : null;
      },
      async pushData(data, updated) {
        must(await sb.from('user_data').upsert({ user_id: user.id, data, updated }, { onConflict: 'user_id' }));
      },
      // Proof of agreement: the server stamps the time and the member; members can only add rows.
      async recordConsent(version, documents) {
        must(await sb.from('consents').insert({ terms_version: version, documents, user_agent: typeof navigator !== 'undefined' ? String(navigator.userAgent).slice(0, 400) : null }));
      },
      // Reminders: this device's push subscription, and the weekly email preference.
      async savePush(sub) {
        const j = sub.toJSON ? sub.toJSON() : sub;
        must(await sb.from('push_subscriptions').upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' }));
      },
      async removePush(endpoint) { must(await sb.from('push_subscriptions').delete().eq('endpoint', endpoint)); },
      async emailPrefs() { const rows = must(await sb.from('email_prefs').select('weekly').eq('user_id', user.id).limit(1)); return rows && rows[0] ? rows[0] : { weekly: true }; },
      async setWeeklyEmail(on) { must(await sb.from('email_prefs').upsert({ user_id: user.id, weekly: !!on, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })); },
      async accessToken() { const d = must(await sb.auth.getSession()); return d && d.session ? d.session.access_token : null; },
      async subscription() {
        const rows = must(await sb.from('subscriptions').select('status, plan, trial_used, trial_end, current_period_end, cancel_at_period_end').eq('user_id', user.id).limit(1));
        return rows && rows[0] ? rows[0] : null;
      },
      async setName(name) { must(await sb.from('profiles').update({ name }).eq('id', user.id)); },
      async deleteAccount() {
        const names = await api.listBackups();
        if (names.length) must(await sb.storage.from('vault').remove(names.map((n) => `${user.id}/${n}`)));
        must(await sb.rpc('delete_my_account'));
        await api.signOut();
      },

      // ---- encrypted photo backup (files are already encrypted by the app) ----
      async listBackups() {
        const out = [];
        for (let offset = 0; ; offset += 100) {
          const page = must(await sb.storage.from('vault').list(user.id, { limit: 100, offset }));
          (page || []).forEach((f) => { if (f.name && f.name !== '.emptyFolderPlaceholder') out.push(f.name); });
          if (!page || page.length < 100) return out;
        }
      },
      async uploadBackup(name, text) {
        must(await sb.storage.from('vault').upload(`${user.id}/${name}`, new Blob([text], { type: 'application/octet-stream' }), { upsert: true, contentType: 'application/octet-stream' }));
      },
      async downloadBackup(name) {
        const blob = must(await sb.storage.from('vault').download(`${user.id}/${name}`));
        return blob.text();
      },
      async removeBackups(names) { if (names.length) must(await sb.storage.from('vault').remove(names.map((n) => `${user.id}/${n}`))); },

      // ---- community ----
      async feed(blocked) {
        const rows = must(await sb.from('posts').select('id, user_id, author_name, text, tag, phase, created_at, likes(user_id), comments(id, user_id, author_name, text, created_at)').order('created_at', { ascending: false }).limit(60));
        return mapFeed(rows, api.myId(), blocked);
      },
      async post(text, tag, phase) { must(await sb.from('posts').insert({ text, tag, phase, author_name: user.name || 'Member' })); },
      async comment(postId, text) { must(await sb.from('comments').insert({ post_id: postId, text, author_name: user.name || 'Member' })); },
      async like(postId, on) {
        if (on) must(await sb.from('likes').upsert({ post_id: postId, user_id: user.id }, { onConflict: 'post_id,user_id', ignoreDuplicates: true }));
        else must(await sb.from('likes').delete().eq('post_id', postId).eq('user_id', user.id));
      },
      async deletePost(id) { must(await sb.from('posts').delete().eq('id', id)); },
      async deleteComment(id) { must(await sb.from('comments').delete().eq('id', id)); },
      async report(target, reason) {
        must(await sb.from('reports').insert({ post_id: target.postId || null, comment_id: target.commentId || null, message_id: target.messageId || null, reason: (reason || '').slice(0, 300) }));
      },
      async threads(blocked) {
        const me = user.id;
        const rows = must(await sb.from('messages').select('id, from_id, to_id, text, created_at').or(`from_id.eq.${me},to_id.eq.${me}`).order('created_at', { ascending: false }).limit(500));
        const threads = mapThreads(rows, api.myId(), blocked);
        const others = Object.keys(threads).map((k) => k.split('|').find((x) => x !== api.myId()));
        return { threads, names: await api.names(others) };
      },
      async names(ids) {
        const uids = Array.from(new Set((ids || []).map(UID))).filter(Boolean);
        if (!uids.length) return {};
        const rows = must(await sb.from('profiles').select('id, name').in('id', uids));
        const out = {};
        (rows || []).forEach((r) => { out[ID(r.id)] = r.name; });
        return out;
      },
      async send(toId, text) { must(await sb.from('messages').insert({ to_id: UID(toId), text })); },

      // Live updates: any change to the feed or her messages calls back (debounced by the app).
      subscribe(onChange) {
        const ch = sb.channel('yours-community')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => onChange('feed'))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => onChange('feed'))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => onChange('feed'))
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => onChange('messages'))
          .subscribe();
        return () => { try { sb.removeChannel(ch); } catch { /* already gone */ } };
      },
    };
    return api;
  }

  // Same rule as the server (lib/billing.js): trialing, active, or past due for up to 7 days.
  function hasAccess(row, now) {
    if (!row || !['trialing', 'active', 'past_due', 'comp'].includes(row.status)) return false;
    if (row.status === 'past_due' && row.current_period_end) return new Date(row.current_period_end).getTime() + 7 * 864e5 > (now || Date.now());
    return true;
  }

  // Has this password appeared in a data breach? Uses Have I Been Pwned's k-anonymity range API: only the first
  // 5 characters of the password's SHA-1 hash leave the device, so the service never learns the password.
  // Returns the number of breaches it was seen in, or null if the check could not run (never blocks sign-up).
  async function passwordLeaks(password, fetchImpl) {
    try {
      const f = fetchImpl || fetch;
      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
      const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const r = await f(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } });
      if (!r.ok) return null;
      const suffix = hash.slice(5);
      const line = (await r.text()).split('\n').find((l) => l.split(':')[0].trim() === suffix);
      return line ? parseInt(line.split(':')[1], 10) || 0 : 0;
    } catch { return null; }
  }

  const exported = { create, hasAccess, passwordLeaks, pickNewer, mapFeed, mapThreads, friendlyError, ID, UID };
  if (typeof window !== 'undefined') window.YOURS_CLOUD = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})();
