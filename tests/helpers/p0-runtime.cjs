const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');

const root = path.resolve(__dirname, '../..');
const ids = {
  owner: '11111111-1111-4111-8111-111111111111',
  outsider: '22222222-2222-4222-8222-222222222222',
  pot: '33333333-3333-4333-8333-333333333333',
  otherPot: '44444444-4444-4444-8444-444444444444',
  token: 'public-test-token-only',
};

// Execute repository modules, replacing only external boundaries. Unexpected
// imports fail closed: no environment file or network client can be loaded.
function loadSource(file, mocks = {}, globals = {}) {
  const cache = new Map();
  function load(relative) {
    let filename = path.resolve(root, relative);
    if (!path.extname(filename)) filename += fs.existsSync(filename + '.ts') ? '.ts' : '.tsx';
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
    }).outputText;
    const requireLocal = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'next/headers') return { headers: () => new Headers() };
      if (['stripe', 'zod', 'react/jsx-runtime', 'clsx'].includes(name)) return require(name);
      if (/^@\/locales\/(fr|en|es|it|de)\.json$/.test(name)) return JSON.parse(fs.readFileSync(path.join(root, name.slice(2)), 'utf8'));
      if (['@/lib/payment-security', '@/lib/security', '@/lib/payouts', '@/lib/copy',
        '@/lib/getCopy', '@/lib/utils', '@/lib/i18n', '@/lib/i18n-server', '@/lib/auth'].includes(name)) return load(name.slice(2));
      throw new Error(`Unmocked dependency: ${name} in ${relative}`);
    };
    const context = { exports: mod.exports, module: mod, require: requireLocal,
      Request, Response, FormData, URL, Date, crypto: globalThis.crypto, console,
      ...globals };
    vm.runInNewContext(output, context, { filename });
    return mod.exports;
  }
  return load(file);
}

async function createDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
  `);
  const directory = path.join(root, 'supabase/migrations');
  for (const filename of fs.readdirSync(directory).filter(f => f.endsWith('.sql')).sort()) {
    // Only pgcrypto installation is omitted: these migrations use the native
    // PostgreSQL gen_random_uuid(), available in PGlite without the extension.
    const sql = fs.readFileSync(path.join(directory, filename), 'utf8')
      .replace(/^create extension if not exists pgcrypto;\s*/m, '');
    try { await db.exec(sql); }
    catch (error) { throw new Error(`Migration ${filename}: ${error.message}`, { cause: error }); }
  }
  return db;
}

async function seed(db, overrides = {}) {
  await db.exec('reset role; truncate auth.users cascade;');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [ids.owner]);
  await db.query(`insert into auth.users(id, email, raw_user_meta_data) values
    ($1, 'owner@example.invalid', '{}'), ($2, 'outsider@example.invalid', '{}')`, [ids.owner, ids.outsider]);
  await db.query(`insert into pots(id, owner_user_id, title, event_type, currency, share_token,
    privacy_mode, mystery_mode, revealed, goal_amount, messages_visible_to_beneficiary)
    values ($1,$2,'Test pot','birthday','EUR',$3,'standard',true,false,4000,true),
      ($4,$5,'Other pot','birthday','EUR','other-public-test-token','standard',false,false,4000,true)`,
    [ids.pot, ids.owner, ids.token, ids.otherPot, ids.outsider]);
  for (const [key, value] of Object.entries(overrides)) {
    await db.query(`update pots set ${identifier(key)} = $1 where id = $2`, [value, ids.pot]);
  }
}

const identifier = value => {
  if (!/^[a-z_][a-z_0-9]*$/i.test(value)) throw new Error('Invalid SQL identifier');
  return `"${value}"`;
};
function adapter(db, options = {}) {
  const calls = [];
  function from(table) {
    let op = 'select', payload, projection = '*', conflict, single = false;
    const filters = [], orders = [];
    const query = {
      select(value = '*') { projection = value; return query; },
      eq(key, value) { filters.push([key, '=', [value]]); return query; },
      in(key, values) { filters.push([key, 'in', values]); return query; },
      order(key, settings = {}) { orders.push(`${identifier(key)} ${settings.ascending === false ? 'desc' : 'asc'}`); return query; },
      update(value) { op = 'update'; payload = value; return query; },
      insert(value) { op = 'insert'; payload = value; return query; },
      upsert(value, settings) { op = 'insert'; payload = value; conflict = settings; return query; },
      maybeSingle() { single = true; return execute(); },
      single() { single = true; return execute(); },
      then(resolve, reject) { return execute().then(resolve, reject); },
    };
    async function execute() {
      calls.push({ table, op, payload, filters: structuredClone(filters), conflict });
      if (options.fail?.(table, op)) return { data: null, error: { message: 'Injected persistence failure' } };
      const args = [];
      const bind = value => { args.push(value); return `$${args.length}`; };
      const columns = projection === '*' ? '*' : projection.split(',').map(s => identifier(s.trim())).join(',');
      let sql;
      if (op === 'select') sql = `select ${columns} from ${identifier(table)}`;
      if (op === 'update') sql = `update ${identifier(table)} set ` + Object.entries(payload)
        .map(([key, value]) => `${identifier(key)}=${bind(value)}`).join(',');
      if (op === 'insert') {
        sql = `insert into ${identifier(table)} (${Object.keys(payload).map(identifier).join(',')}) values
          (${Object.values(payload).map(bind).join(',')})`;
        if (conflict) {
          if (!conflict.ignoreDuplicates) throw new Error('Unsupported conflict mode');
          sql += ` on conflict (${identifier(conflict.onConflict)}) do nothing`;
        }
      }
      if (filters.length) sql += ' where ' + filters.map(([key, operator, values]) =>
        operator === 'in' ? (values.length ? `${identifier(key)} in (${values.map(bind).join(',')})` : 'false') :
          `${identifier(key)}=${bind(values[0])}`).join(' and ');
      if (orders.length) sql += ' order by ' + orders.join(',');
      if (op !== 'select') sql += ` returning ${columns}`;
      try {
        const { rows } = await db.query(sql, args);
        return { data: single ? rows[0] ?? null : rows, error: null };
      } catch (error) { return { data: null, error }; }
    }
    return query;
  }
  return { calls, from, auth: { getUser: async () => ({ data: { user: options.user === null ? null : { id: options.user ?? ids.owner } }, error: null }) },
    async rpc(name, params = {}) {
      calls.push({ rpc: name, params });
      if (options.fail?.(name, 'rpc')) return { data: null, error: { message: 'Injected RPC failure' } };
      try {
        const args = Object.values(params);
        const { rows } = await db.query(`select * from ${identifier(name)}(${args.map((_, i) => `$${i + 1}`).join(',')})`, args);
        return { data: rows, error: null };
      } catch (error) { return { data: null, error }; }
    },
  };
}

async function contribution(db, overrides = {}) {
  const client = adapter(db);
  const result = await client.from('contributions').insert({ pot_id: ids.pot,
    stripe_checkout_session_id: 'cs_local', amount: 2000, currency: 'EUR', status: 'pending',
    contributor_display_name: 'Alice', is_anonymous: false, ...overrides }).single();
  if (result.error) throw result.error;
  return result.data;
}

function textContent(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(' ');
  return textContent(node.props?.children);
}

module.exports = { root, ids, loadSource, createDatabase, seed, adapter, contribution, textContent };
