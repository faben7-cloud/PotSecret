const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextResponse } = require('next/server');
const { loadSource } = require('./helpers/p0-runtime.cjs');
const origin = 'https://branch-alias.example';
const privateCode = 'private-auth-code-marker';
const privateText = 'private-token-verifier-email-marker';
const success = { data: { session: { user: { id: 'local-user' } } }, error: null };
function setup(locale, exchange = async () => success, create) {
  const logs = [], calls = [];
  const headers = new Headers({ host: 'branch-alias.example', 'x-potsecret-locale': locale });
  const globals = { process: { env: { VERCEL: '1', VERCEL_URL: 'technical.example' } },
    console: { warn: (...args) => logs.push(args) } };
  const mocks = { 'next/server': { NextResponse }, 'next/headers': { headers: () => headers },
    '@/lib/supabase/server': { createSupabaseServerClient: create || (async () => ({
      auth: { exchangeCodeForSession: async code => { calls.push(code); return exchange(code); } },
    })) } };
  const GET = loadSource('app/auth/callback/route.ts', mocks, globals).GET;
  return { GET, logs, calls, mocks, globals, headers };
}
function failure(response, locale, next, logs, reason) {
  const url = new URL(response.headers.get('location'));
  assert.equal(url.origin, origin);
  assert.equal(url.pathname, '/' + locale + '/login');
  assert.equal(url.searchParams.get('next'), next);
  assert.match(url.searchParams.get('error'), /nouveau lien.*même navigateur/);
  assert.deepEqual([...url.searchParams.keys()].sort(), ['error', 'next']);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1].reason, reason);
  for (const value of [url.href, JSON.stringify(logs)]) {
    assert.ok(!value.includes(privateCode));
    assert.ok(!value.includes(privateText));
  }
}
const failures = [
  ['absent code', '', async () => { throw Error('Must not exchange'); }, 'missing_code', 0],
  ['empty code', '?code=', async () => { throw Error('Must not exchange'); }, 'missing_code', 0],
  ['Supabase error with code', '?code=' + privateCode + '&error=access_denied&error_code=otp_expired&error_description=' + privateText,
    async () => { throw Error('Must not exchange'); }, 'supabase_error', 0],
  ...['flow_state_expired', 'flow_state_not_found', 'bad_code_verifier', 'pkce_code_verifier_not_found'].map(code =>
    [code, '?code=' + privateCode, async () => ({ data: { session: null }, error: { code, message: privateText } }), 'exchange_error', 1]),
  ['exception', '?code=' + privateCode, async () => { throw Error(privateText); }, 'exchange_exception', 1],
  ['no session', '?code=' + privateCode, async () => ({ data: { session: null }, error: null }), 'missing_session', 1],
];
for (const locale of ['fr', 'en', 'es', 'it', 'de']) {
  const next = '/' + locale + '/cagnotte/Opaque.Token_123?tag=a&tag=b&value=%2B#receipt';
  for (const [name, suffix, exchange, reason, expectedCalls] of failures) {
    test(locale + ': safely handles ' + name, async () => {
      const { GET, logs, calls, headers } = setup(locale, exchange);
      const url = new URL(origin + '/' + locale + '/auth/callback' + suffix);
      url.searchParams.set('next', next);
      failure(await GET(new Request(url, { headers })), locale, next, logs, reason);
      assert.equal(calls.length, expectedCalls);
    });
  }
  test(locale + ': successful exchange alone reaches next, preserving host and suffix', async () => {
    const { GET, logs, calls, headers } = setup(locale);
    const url = origin + '/' + locale + '/auth/callback?code=' + privateCode + '&next=' + encodeURIComponent(next);
    const response = await GET(new Request(url, { headers }));
    assert.equal(response.headers.get('location'), origin + next);
    assert.deepEqual(logs, []);
    assert.deepEqual(calls, [privateCode]);
  });
}
for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/\r\nevil.example']) {
  test('failed exchange keeps malicious next local: ' + JSON.stringify(next), async () => {
    const { GET, logs, headers } = setup('fr', async () => ({ data: null, error: { code: privateCode, message: privateText } }));
    const url = origin + '/fr/auth/callback?code=' + privateCode + '&next=' + encodeURIComponent(next);
    failure(await GET(new Request(url, { headers })), 'fr', '/fr/dashboard', logs, 'exchange_error');
    assert.equal(logs[0][1].providerCode, 'unknown');
  });
}
test('client initialization exception is handled safely', async () => {
  const { GET, headers, logs } = setup('fr', undefined, async () => { throw Error(privateText); });
  failure(await GET(new Request(origin + '/fr/auth/callback?code=' + privateCode, { headers })), 'fr', '/fr/dashboard', logs, 'exchange_exception');
});
test('login displays the safe callback error even if an older session exists', async () => {
  const message = 'Impossible de finaliser la connexion. Demandez un nouveau lien.';
  const { mocks, globals } = setup('fr');
  const page = loadSource('app/login/page.tsx', { ...mocks, 'next/link': 'a',
    'next/navigation': { redirect() { throw Error('Must display the error'); } },
    '@/lib/auth': { getCurrentSession: async () => ({ user: {} }) },
    '@/components/auth/login-form': { EmailAuthForm: 'email-form' },
  }, globals).default;
  const tree = await page({ searchParams: Promise.resolve({ error: message, next: '/dashboard' }) });
  function nodes(value) {
    if (!value || typeof value !== 'object') return [];
    return Array.isArray(value) ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)];
  }
  const props = nodes(tree).find(n => n.type === 'email-form').props;
  assert.equal(props.initialError, message);
  assert.equal(props.next, '/fr/dashboard');
});

for (const scenario of ['success', 'expired', 'consumed', 'wrong-verifier', 'missing-verifier']) {
  test('real installed Supabase SSR PKCE client: ' + scenario, async () => {
    const { createServerClient } = require('@supabase/ssr');
    const { mocks, globals, headers, logs } = setup('fr');
    globals.process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pkce.example.invalid';
    globals.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'local-only';
    const cookies = new Map();
    if (scenario !== 'missing-verifier') cookies.set('sb-pkce-auth-token-code-verifier',
      'base64-' + Buffer.from(JSON.stringify(scenario === 'wrong-verifier' ? 'wrong-verifier' : 'local-verifier')).toString('base64url'));
    mocks['next/headers'].cookies = () => ({
      get: name => cookies.has(name) ? { value: cookies.get(name) } : undefined,
      set: ({ name, value }) => cookies.set(name, value),
    });
    let requests = 0;
    const fetch = async (url, options) => {
      requests++;
      assert.equal(String(url), 'https://pkce.example.invalid/auth/v1/token?grant_type=pkce');
      const body = JSON.parse(options.body);
      assert.equal(body.auth_code, privateCode);
      assert.equal(body.code_verifier, scenario === 'wrong-verifier' ? 'wrong-verifier' : 'local-verifier');
      if (scenario !== 'success') return new Response(JSON.stringify({
        code: scenario === 'expired' ? 'flow_state_expired' : scenario === 'consumed' ? 'flow_state_not_found' : 'bad_code_verifier',
        message: privateText,
      }), { status: 400, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' } });
      const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
      const accessToken = part({ alg: 'HS256' }) + '.' + part({ sub: 'local-user', exp: Math.floor(Date.now()/1000)+3600 }) + '.local-only';
      return new Response(JSON.stringify({ access_token: accessToken, refresh_token: 'local-refresh', token_type: 'bearer',
        expires_in: 3600, user: { id: 'local-user', aud: 'authenticated', role: 'authenticated' } }),
      { headers: { 'content-type': 'application/json' } });
    };
    mocks['@/lib/supabase/server'] = loadSource('lib/supabase/server.ts', { ...mocks,
      '@supabase/ssr': { createServerClient: (url, key, options) => createServerClient(url, key, { ...options, global: { fetch } }) },
    }, globals);
    const GET = loadSource('app/auth/callback/route.ts', mocks, globals).GET;
    const response = await GET(new Request(origin + '/fr/auth/callback?code=' + privateCode, { headers }));
    assert.equal(requests, scenario === 'missing-verifier' ? 0 : 1);
    if (scenario === 'success') {
      assert.equal(response.headers.get('location'), origin + '/fr/dashboard');
      assert.ok(cookies.get('sb-pkce-auth-token'));
      assert.equal(logs.length, 0);
    } else {
      failure(response, 'fr', '/fr/dashboard', logs, 'exchange_error');
      assert.ok(!cookies.get('sb-pkce-auth-token'));
    }
  });
}
