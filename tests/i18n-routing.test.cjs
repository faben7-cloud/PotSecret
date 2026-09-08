const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { getMiddlewareMatchers } = require('next/dist/build/analysis/get-page-static-info');
const { getMiddlewareRouteMatcher } = require('next/dist/shared/lib/router/utils/middleware-route-matcher');
const { loadSource, textContent } = require('./helpers/p0-runtime.cjs');

const { middleware, config } = loadSource('middleware.ts', {
  'next/server': { NextResponse },
}, { Headers });
const matches = getMiddlewareRouteMatcher(getMiddlewareMatchers(config.matcher, {}));
const i18n = loadSource('lib/i18n.ts');
const origin = 'https://preview.example.invalid';

const routes = [
  '/', '/p/Opaque.Token_123', '/p/Opaque.Token_123/cancel',
  '/p/Opaque.Token_123/success', '/p/Opaque.Token_123/payment',
  '/login', '/signup', '/auth/callback', '/dashboard', '/dashboard/pots',
  '/dashboard/pots/new', '/dashboard/pots/pot-id', '/dashboard/pots/pot-id/payout',
  '/pots', '/pots/new',
];
for (const locale of i18n.locales) {
  test('localized application routes round-trip for ' + locale, () => {
    for (const internal of routes) {
      const localized = i18n.localizePathname(internal, locale);
      assert.ok(matches(localized, {}, {}), localized);
      const response = middleware(new NextRequest(origin + localized));
      assert.equal(response.headers.get('x-middleware-rewrite'), origin + internal);
      assert.equal(response.headers.get('x-middleware-request-x-potsecret-locale'), locale);
      assert.equal(response.headers.get('location'), null, 'No redirect');
      assert.equal(matches(internal, {}, {}), false, 'Destination cannot re-enter matcher');
      assert.equal(middleware(new NextRequest(origin + internal)).headers.get('x-middleware-rewrite'), null);
    }
  });
}

test('rewrite preserves opaque token, query encoding, duplicate parameters and request headers', async () => {
  const target = '/en/cagnotte/Opaque.Token_%2B123/success?session_id=cs_fake%2Btest&next=%2Fdashboard%3Fx%3D1&tag=a&tag=b';
  const request = new NextRequest(origin + target, {
    method: 'POST', body: 'unchanged-body',
    headers: { cookie: 'fake-session=local-only', 'next-action': 'fake-action', 'x-potsecret-locale': 'de' },
  });
  const response = middleware(request);
  const rewritten = new URL(response.headers.get('x-middleware-rewrite'));
  assert.equal(rewritten.pathname, '/p/Opaque.Token_%2B123/success');
  assert.equal(rewritten.search, new URL(origin + target).search);
  assert.equal(response.headers.get('x-middleware-request-cookie'), 'fake-session=local-only');
  assert.equal(response.headers.get('x-middleware-request-next-action'), 'fake-action');
  assert.equal(response.headers.get('x-middleware-request-x-potsecret-locale'), 'en');
  assert.equal(request.method, 'POST');
  assert.equal(await request.text(), 'unchanged-body');
});

for (const pathname of [
  '/api/stripe/webhook', '/api/stripe/create-checkout-session', '/_next/static/chunk.js',
  '/_next/image', '/logo.png', '/Logo%20potsecret.png', '/favicon.ico', '/robots.txt',
  '/health', '/auth/callback', '/dashboard', '/p/token/cancel',
  '/pt', '/pt/cagnotte/token', '/english', '/FR', '/france', '/cagnotte/token',
]) {
  test('matcher and middleware leave untouched ' + pathname, () => {
    assert.equal(matches(pathname, {}, {}), false);
    assert.equal(middleware(new NextRequest(origin + pathname)).headers.get('x-middleware-rewrite'), null);
  });
}

for (const pathname of [
  '/fr/api/stripe/webhook', '/en/_next/static/chunk.js', '/fr/logo.png',
  '/fr/health', '/fr/robots.txt', '/fr/unknown', '/fr/en', '/fr/fr',
  '/fr/cagnotte', '/fr/cagnotte/token/unknown',
]) {
  test('localized non-application path is not rewritten: ' + pathname, () => {
    const response = middleware(new NextRequest(origin + pathname));
    assert.equal(response.headers.get('x-middleware-rewrite'), null);
    assert.equal(response.headers.get('location'), null);
  });
}

test('localized internal aliases also retain their existing route', () => {
  for (const pathname of ['/fr/', '/fr/p/token/cancel']) {
    const expected = pathname === '/fr/' ? '/' : '/p/token/cancel';
    assert.equal(middleware(new NextRequest(origin + pathname)).headers.get('x-middleware-rewrite'), origin + expected);
  }
});

test('rewritten request locale is consumed by the existing server locale reader', () => {
  const response = middleware(new NextRequest(origin + '/en/cagnotte/token'));
  const forwarded = new Headers({ 'x-potsecret-locale': response.headers.get('x-middleware-request-x-potsecret-locale') });
  const { getRequestLocale } = loadSource('lib/i18n-server.ts', {
    'next/headers': { headers: () => forwarded },
  });
  assert.equal(getRequestLocale(), 'en');
});

for (const pathname of ['/p/token/payment', '/fr/cagnotte/token/payment', '/en/cagnotte/token/payment', '/fr/dashboard']) {
  test('application shell preserves payment layout for ' + pathname, () => {
    const { AppShell } = loadSource('components/layout/app-shell.tsx', {
      'next/navigation': { usePathname: () => pathname },
    });
    const output = textContent(AppShell({ children: 'BODY', defaultHeader: 'HEADER', defaultFooter: 'FOOTER' }));
    assert.ok(output.includes('BODY'));
    assert.equal(output.includes('HEADER'), !pathname.endsWith('/payment'));
    assert.equal(output.includes('FOOTER'), !pathname.endsWith('/payment'));
  });
}

test('Next data URLs stay untouched even when the framework matcher accepts them', async () => {
  const { default: nextConfig } = await import('../next.config.mjs');
  assert.equal(nextConfig.skipMiddlewareUrlNormalize, true);
  for (const pathname of ['/_next/data/build/fr.json', '/_next/data/build/en/cagnotte/token.json']) {
    const response = middleware(new NextRequest(origin + pathname, { nextConfig }));
    assert.equal(response.headers.get('x-middleware-rewrite'), null);
    assert.equal(response.headers.get('location'), null);
  }
});
