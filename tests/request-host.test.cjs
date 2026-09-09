const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextResponse } = require('next/server');
const { loadSource } = require('./helpers/p0-runtime.cjs');
const alias = 'branch-alias.example';
const origin = 'https://' + alias;
const env = { VERCEL: '1', VERCEL_URL: 'technical-deployment.example',
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-only' };
const locales = ['fr', 'en', 'es', 'it', 'de'];
function fixture(locale = 'fr', requestHost = alias) {
  const headers = new Headers({ host: requestHost, 'x-potsecret-locale': locale,
    'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'http',
    origin: 'https://evil.example', referer: 'https://evil.example' });
  const globals = { process: { env } };
  const mocks = { 'next/headers': { headers: () => headers }, 'next/server': { NextResponse },
    'next/navigation': { redirect(url) { throw Error('REDIRECT:' + url); } } };
  return { headers, mocks, globals };
}
for (const locale of locales) {
  test(locale + ': callback keeps branch alias and the host-scoped session after code exchange', async () => {
    const { headers, mocks, globals } = fixture(locale);
    const cookies = new Map(), writes = [], exchanges = [];
    let browserHost = alias;
    mocks['next/headers'].cookies = () => ({
      get: name => { const value = cookies.get(browserHost + ':' + name); return value ? { value } : undefined; },
      set: cookie => { writes.push(cookie); cookies.set(browserHost + ':' + cookie.name, cookie.value); },
    });
    const server = loadSource('lib/supabase/server.ts', { ...mocks,
      '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: {
        exchangeCodeForSession: async code => {
          exchanges.push(code);
          options.cookies.set('sb-local-auth-token', 'local-session-only', { path: '/', sameSite: 'lax' });
          return { error: null };
        },
        getUser: async () => ({ data: { user: options.cookies.get('sb-local-auth-token') ? { id: 'local-user' } : null }, error: null }),
      } }) },
    }, globals);
    mocks['@/lib/supabase/server'] = server;
    const callback = loadSource('app/auth/callback/route.ts', mocks, globals).GET;
    const next = '/p/Opaque.Token_%2B123/success?session_id=cs_%2B&tag=a&tag=b#receipt';
    const request = new Request(origin + '/' + locale + '/auth/callback?code=local-code&next=' + encodeURIComponent(next), { headers });
    const response = await callback(request);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.href, origin + '/' + locale + '/cagnotte/Opaque.Token_%2B123/success?session_id=cs_%2B&tag=a&tag=b#receipt');
    assert.equal(target.origin, new URL(request.url).origin);
    assert.deepEqual(exchanges, ['local-code']);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].domain, undefined, 'Session cookie stays host-only');
    browserHost = target.host;
    const user = await loadSource('lib/auth.ts', mocks, globals).requireUser('/dashboard');
    assert.equal(user.id, 'local-user', 'Session remains available on the redirected host');
    const defaultResponse = await callback(new Request(origin + '/' + locale + '/auth/callback', { headers }));
    assert.equal(defaultResponse.headers.get('location'), origin + '/' + locale + '/dashboard');
    assert.equal(loadSource('lib/env.ts', {}, globals).getBaseUrl(), 'https://technical-deployment.example', 'Reproduce the mismatched configured deployment domain');
  });

  test(locale + ': Stripe returns to the request alias without changing payment data', async () => {
    const { mocks, globals } = fixture(locale);
    let payload, pending;
    const action = loadSource('app/p/[shareToken]/actions.ts', { ...mocks,
      '@/lib/pots': { getPotForCheckoutByShareToken: async () => ({ id: 'pot-local', title: 'Local', currency: 'EUR', status: 'open' }) },
      '@/lib/logger': { logServerError() {}, logServerWarn() {} },
      '@/lib/supabase/admin': { createSupabaseAdminClient: () => ({ from: () => ({
        insert: async value => { pending = value; return { error: null }; },
      }) }) },
      '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { create: async value => {
        payload = value; return { id: 'cs_local', url: 'https://checkout.stripe.com/local-only', payment_intent: null };
      } } } }) },
    }, globals).prepareContributionAction;
    const token = 'Opaque.Token_123';
    const form = new FormData();
    for (const [key, value] of Object.entries({ share_token: token, amount: '2.50', consent: 'on',
      origin: 'https://evil.example', success_url: 'https://evil.example', cancel_url: 'https://evil.example' })) form.set(key, value);
    await assert.rejects(action({}, form), { message: 'REDIRECT:https://checkout.stripe.com/local-only' });
    assert.equal(payload.success_url, origin + '/' + locale + '/cagnotte/' + token + '/success?session_id={CHECKOUT_SESSION_ID}');
    assert.equal(payload.cancel_url, origin + '/' + locale + '/cagnotte/' + token + '/cancel');
    assert.equal(pending.amount, 250);
    assert.equal(pending.status, 'pending');
    assert.equal(payload.line_items[0].price_data.unit_amount, 250);
    assert.deepEqual(JSON.parse(JSON.stringify(payload.metadata)), {
      pot_id: 'pot-local', share_token: token, contributor_display_name: '', is_anonymous: 'false', message_body: '',
    });
    assert.deepEqual(JSON.parse(JSON.stringify(payload.payment_intent_data.metadata)), JSON.parse(JSON.stringify(payload.metadata)));
  });
}
for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/\r\nevil.example']) {
  test('malicious next stays on branch alias: ' + JSON.stringify(next), async () => {
    const { headers, mocks, globals } = fixture();
    const callback = loadSource('app/auth/callback/route.ts', { ...mocks,
      '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: {} }) },
    }, globals).GET;
    const response = await callback(new Request(origin + '/fr/auth/callback?next=' + encodeURIComponent(next) + '&origin=https://evil.example', { headers }));
    assert.equal(response.headers.get('location'), origin + '/fr/dashboard');
  });
}
test('legacy callback without locale keeps its request origin and defaults to French', async () => {
  const { mocks, globals } = fixture();
  mocks['next/headers'].headers = () => new Headers();
  const callback = loadSource('app/auth/callback/route.ts', { ...mocks,
    '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: {} }) },
  }, globals).GET;
  assert.equal((await callback(new Request(origin + '/auth/callback'))).headers.get('location'), origin + '/fr/dashboard');
});
test('Vercel request Host preserves custom aliases and ignores forwarded/client origin headers', () => {
  const { headers, mocks, globals } = fixture();
  const { getRequestBaseUrl } = loadSource('lib/request-url.ts', mocks, globals);
  assert.equal(getRequestBaseUrl(), origin);
  assert.equal(getRequestBaseUrl(new Request('https://technical-deployment.example/auth/callback', { headers })), origin);
});
for (const host of ['good.example,evil.example', 'good.example@evil.example', 'evil.example/path',
  'evil.example\\path', 'evil.example?x', 'evil.example#x', '%65vil.example', 'evil.example:444', 'not a host']) {
  test('reject malformed or unsupported Vercel Host: ' + host, () => {
    const { mocks, globals } = fixture();
    mocks['next/headers'].headers = () => ({ get: key => key === 'host' ? host : null });
    assert.equal(loadSource('lib/request-url.ts', mocks, globals).getRequestBaseUrl(), 'https://technical-deployment.example');
  });
}
test('outside Vercel, arbitrary forwarded and Host headers cannot select an action return origin', () => {
  const { mocks } = fixture();
  const globals = { process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://configured.example' } } };
  const { getRequestBaseUrl } = loadSource('lib/request-url.ts', mocks, globals);
  assert.equal(getRequestBaseUrl(), 'https://configured.example');
  assert.equal(getRequestBaseUrl(new Request('https://incoming.example/auth/callback')), 'https://incoming.example');
  assert.equal(getRequestBaseUrl(new Request('ftp://evil.example/auth/callback')), 'https://configured.example');
});
test('local development keeps a loopback port, but never an arbitrary LAN/public Host', () => {
  for (const [host, expected] of [['localhost:4321', 'http://localhost:4321'], ['127.0.0.1:4321', 'http://127.0.0.1:4321'],
    ['[::1]:4321', 'http://[::1]:4321'], ['evil.example', 'http://localhost:3000']]) {
    const { mocks } = fixture('fr', host);
    assert.equal(loadSource('lib/request-url.ts', mocks, { process: { env: { NODE_ENV: 'development' } } }).getRequestBaseUrl(), expected);
  }
});


test('Next loopback URL normalization must not change the cookie host', () => {
  for (const [host, expected] of [['127.0.0.1:4321', 'http://127.0.0.1:4321'],
    ['evil.example:4321', 'http://localhost:4321'], ['127.0.0.1:9876', 'http://localhost:4321']]) {
    const { mocks } = fixture('fr', host);
    const { getRequestBaseUrl } = loadSource('lib/request-url.ts', mocks, { process: { env: { NODE_ENV: 'production' } } });
    assert.equal(getRequestBaseUrl(new Request('http://localhost:4321/auth/callback', { headers: { host } })), expected);
  }
});

test('localized middleware rewrite keeps the raw request origin, including loopback IPs', async () => {
  const { NextRequest } = require('next/server');
  const { default: config } = await import('../next.config.mjs');
  const previous = process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;
  // Match Next's runtime flag derived from the project's existing config.
  process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = config.skipMiddlewareUrlNormalize ? '1' : '';
  try {
    const { middleware } = loadSource('middleware.ts', { 'next/server': { NextResponse } }, { Headers });
    for (const base of ['http://127.0.0.1:4321', 'http://[::1]:4321', 'https://branch-alias.example']) {
      const request = new NextRequest(base + '/fr/auth/callback?code=local-only&tag=a&tag=b');
      const response = middleware(request);
      assert.equal(response.headers.get('x-middleware-rewrite'), base + '/auth/callback?code=local-only&tag=a&tag=b');
    }
  } finally {
    if (previous === undefined) delete process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE;
    else process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE = previous;
  }
});
