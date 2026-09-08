const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest, NextResponse } = require('next/server');
const { loadSource } = require('./helpers/p0-runtime.cjs');
const origin = 'https://preview.example.invalid';
const { locales, localizePathname } = loadSource('lib/i18n.ts');
const { middleware } = loadSource('middleware.ts', { 'next/server': { NextResponse } }, { Headers });
const token = 'Opaque.Token_123';
const destination = '/dashboard?tag=a&tag=b&value=%2B#section';
const redirect = url => { throw new Error('REDIRECT:' + url); };
function context(pathname) {
  const response = middleware(new NextRequest(origin + pathname));
  const locale = response.headers.get('x-middleware-request-x-potsecret-locale');
  const headers = new Headers();
  if (locale) headers.set('x-potsecret-locale', locale);
  return { 'next/headers': { headers: () => headers },
    'next/navigation': { redirect, notFound() { throw new Error('NOT_FOUND'); } },
    'next/link': 'a', 'next/server': { NextResponse },
    '@/lib/env': { getBaseUrl: () => origin } };
}
function nodes(tree) {
  if (tree == null || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function hrefs(tree) { return nodes(tree).filter(n => n.props?.href).map(n => n.props.href); }
function clientState() {
  const state = { loggedIn: false, exchanged: [], signedOut: 0 };
  const client = { auth: {
    getUser: async () => ({ data: { user: state.loggedIn ? { id: 'owner', email: 'local@example.invalid' } : null }, error: null }),
    getSession: async () => ({ data: { session: state.loggedIn ? { user: { id: 'owner' } } : null }, error: null }),
    exchangeCodeForSession: async code => { state.exchanged.push(code); state.loggedIn = true; return { error: null }; },
    signOut: async () => { state.loggedIn = false; state.signedOut++; return { error: null }; },
  } };
  return { state, client };
}
function assertRedirect(action, expected) {
  return assert.rejects(action, error => error.message === 'REDIRECT:' + expected);
}

for (const locale of locales) {
  const localizedNext = localizePathname(destination, locale);
  test(locale + ': home/header/menu/owner/public navigation keeps the locale', async () => {
    const { client } = clientState();
    const mocks = { ...context('/' + locale),
      '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
      '@/components/auth/user-menu': { UserMenu: 'user-menu' }, 'next/image': 'img',
      '@/app/auth/actions': { signOutAction() {} },
    };
    const header = await loadSource('components/layout/site-header.tsx', mocks).SiteHeader();
    for (const path of ['/', '/login', '/dashboard/pots/new']) assert.ok(hrefs(header).includes(localizePathname(path, locale)));
    const menu = loadSource('components/auth/user-menu.tsx', mocks).UserMenu({ email: 'local@example.invalid' });
    assert.ok(hrefs(menu).includes('/' + locale + '/dashboard'));
    const paymentHeader = loadSource('components/layout/payment-page-header.tsx', mocks).PaymentPageHeader({ shareToken: token });
    assert.deepEqual(hrefs(paymentHeader), ['/' + locale, '/' + locale + '/cagnotte/' + token]);
    const list = loadSource('components/pot/pot-list.tsx', { ...mocks,
      '@/components/ui/status-badge': { StatusBadge: 'status-badge' },
    }).PotList({ pots: [{ id: 'pot-id', title: 'Local', share_token: token, currency: 'EUR',
      created_at: '2026-09-01', event_type: 'birthday', privacy_mode: 'standard', status: 'open',
      confirmed_total_amount: 500, confirmed_contribution_count: 2 }] });
    assert.ok(hrefs(list).includes('/' + locale + '/dashboard/pots/pot-id'));
    for (const pagePath of ['app/p/[shareToken]/cancel/page.tsx', 'app/p/[shareToken]/success/page.tsx']) {
      const page = loadSource(pagePath, { ...mocks,
        '@/lib/pots': { getPublicPotByToken: async () => ({ title: 'Local', currency: 'EUR', event_type: 'birthday' }) },
        '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { retrieve() { throw Error('Unexpected Stripe access'); } } } }) },
        '@/lib/supabase/admin': { createSupabaseAdminClient: () => ({ from() { throw Error('Unexpected private lookup'); } }) },
      }).default;
      const links = hrefs(await page({ params: Promise.resolve({ shareToken: token }) }));
      assert.ok(links.includes('/' + locale + '/cagnotte/' + token));
      assert.ok(links.includes('/' + locale));
    }
  });

  test(locale + ': login/signup -> OTP -> localized callback -> safe destination', async () => {
    const { state, client } = clientState();
    for (const [mode, alternate] of [['login', 'signup'], ['signup', 'login']]) {
      state.loggedIn = false;
      const mocks = { ...context('/' + locale + '/' + mode),
        '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
        '@/components/auth/login-form': { EmailAuthForm: 'email-auth-form' },
      };
      const page = loadSource('app/' + mode + '/page.tsx', mocks).default;
      const tree = await page({ searchParams: Promise.resolve({ next: destination }) });
      assert.ok(hrefs(tree).includes('/' + locale + '/' + alternate + '?next=' + encodeURIComponent(localizedNext)));
      const formProps = nodes(tree).find(n => n.type === 'email-auth-form').props;
      assert.equal(formProps.locale, locale);
      assert.equal(formProps.next, localizedNext);
      let otp;
      let stateIndex = 0;
      const form = loadSource('components/auth/login-form.tsx', {
        react: { useState: initial => [stateIndex++ === 0 ? 'local@example.invalid' : initial, () => {}] },
        '@/lib/supabase/browser': { createSupabaseBrowserClient: () => ({ auth: {
          signInWithOtp: async args => { otp = args; return { error: null }; },
        } }) },
      }, { window: { location: { origin } } }).EmailAuthForm(formProps);
      await form.props.onSubmit({ preventDefault() {} });
      const callback = new URL(otp.options.emailRedirectTo);
      assert.equal(callback.pathname, '/' + locale + '/auth/callback');
      assert.equal(callback.searchParams.get('next'), localizedNext);
      assert.equal(callback.searchParams.get('mode'), mode);
      callback.searchParams.set('code', 'fake-local-code');
      const get = loadSource('app/auth/callback/route.ts', {
        ...context(callback.pathname), '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
      }).GET;
      const response = await get(new Request(callback));
      assert.equal(response.headers.get('location'), origin + localizedNext);
      assert.equal(state.exchanged.at(-1), 'fake-local-code');
      await assertRedirect(page({ searchParams: Promise.resolve({ next: destination }) }), localizedNext);
    }
  });

  test(locale + ': protected access and sign-out retain locale', async () => {
    const { state, client } = clientState();
    const mocks = { ...context('/' + locale + '/dashboard'),
      '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
    };
    const { requireUser } = loadSource('lib/auth.ts', mocks);
    await assertRedirect(requireUser('/dashboard'), '/' + locale + '/login?next=' + encodeURIComponent('/' + locale + '/dashboard'));
    state.loggedIn = true;
    assert.equal((await requireUser('/dashboard')).id, 'owner');
    await assertRedirect(loadSource('app/auth/actions.ts', mocks).signOutAction(), '/' + locale);
    assert.equal(state.signedOut, 1);
  });

  test(locale + ': payment server context controls Stripe return URLs, not form fields', async () => {
    let stripePayload, pending;
    const action = loadSource('app/p/[shareToken]/actions.ts', {
      ...context('/' + locale + '/cagnotte/' + token + '/payment'),
      '@/lib/pots': { getPotForCheckoutByShareToken: async () => ({ id: 'canonical-pot', title: 'Local', currency: 'EUR', status: 'open' }) },
      '@/lib/logger': { logServerWarn() {}, logServerError() {} },
      '@/lib/supabase/admin': { createSupabaseAdminClient: () => ({ from: () => ({
        insert: async data => { pending = data; return { error: null }; },
      }) }) },
      '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { create: async data => {
        stripePayload = data; return { id: 'cs_local', url: 'https://checkout.stripe.com/local-only', payment_intent: null };
      } } } }) },
    }).prepareContributionAction;
    const form = new FormData();
    for (const [key, value] of Object.entries({ share_token: token, amount: '2.50', consent: 'on',
      locale: 'unsupported', success_url: 'https://untrusted.invalid', cancel_url: 'https://untrusted.invalid' })) form.set(key, value);
    await assertRedirect(action({}, form), 'https://checkout.stripe.com/local-only');
    assert.equal(stripePayload.success_url, origin + '/' + locale + '/cagnotte/' + token + '/success?session_id={CHECKOUT_SESSION_ID}');
    assert.equal(stripePayload.cancel_url, origin + '/' + locale + '/cagnotte/' + token + '/cancel');
    assert.equal(stripePayload.line_items[0].price_data.unit_amount, 250);
    assert.equal(pending.amount, 250);
    assert.equal(pending.pot_id, 'canonical-pot');
    assert.equal(pending.status, 'pending');
    assert.deepEqual(JSON.parse(JSON.stringify(stripePayload.metadata)), {
      pot_id: 'canonical-pot', share_token: token, contributor_display_name: '', is_anonymous: 'false', message_body: '',
    });
    assert.deepEqual(JSON.parse(JSON.stringify(stripePayload.payment_intent_data.metadata)), JSON.parse(JSON.stringify(stripePayload.metadata)));
  });

  test(locale + ': created pot redirects to localized owner detail', async () => {
    const { client } = clientState();
    client.auth.getUser = async () => ({ data: { user: { id: 'owner' } } });
    client.from = () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'new-pot' }, error: null }) }) }) });
    const action = loadSource('app/dashboard/pots/new/actions.ts', {
      ...context('/' + locale + '/dashboard/pots/new'),
      '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
    }).createDashboardPotAction;
    const form = new FormData(); form.set('title', 'Local routing test');
    await assertRedirect(action({}, form), '/' + locale + '/dashboard/pots/new-pot');
  });

  test(locale + ': path localization preserves suffixes, tokens and technical paths', () => {
    const path = '/p/Opaque.Token_%2B123/success?session_id=cs_x%2By&tag=a&tag=b&next=%2Fdashboard#receipt';
    const expected = '/' + locale + '/cagnotte/Opaque.Token_%2B123/success?session_id=cs_x%2By&tag=a&tag=b&next=%2Fdashboard#receipt';
    assert.equal(localizePathname(path, locale), expected);
    assert.equal(localizePathname(expected, locale), expected);
    assert.equal(localizePathname('/?tag=a&tag=b#home', locale), '/' + locale + '?tag=a&tag=b#home');
    for (const technical of ['/api/stripe/webhook', '/api/stripe/create-checkout-session', '/_next/static/app.js', '/logo.png', '/health']) {
      assert.equal(localizePathname(technical, locale), technical);
    }
    assert.equal(localizePathname('#participate', locale), '#participate');
  });
}
for (const next of ['https://external.invalid', '//external.invalid', '/\\external.invalid', '/\r\nexternal.invalid']) {
  test('callback keeps open-redirect protection for ' + JSON.stringify(next), async () => {
    const get = loadSource('app/auth/callback/route.ts', {
      ...context('/en/auth/callback'),
      '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession() { throw Error('Unexpected'); } } }) },
    }).GET;
    const response = await get(new Request(origin + '/en/auth/callback?next=' + encodeURIComponent(next)));
    assert.equal(response.headers.get('location'), origin + '/en/dashboard');
  });
}
test('legacy unprefixed navigation stays usable with the default locale', async () => {
  const { client } = clientState();
  const { requireUser } = loadSource('lib/auth.ts', { ...context('/dashboard'),
    '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
  });
  await assertRedirect(requireUser('/dashboard'), '/fr/login?next=%2Ffr%2Fdashboard');
});
