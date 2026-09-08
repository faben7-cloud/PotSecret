const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Stripe = require('stripe');
const { ids, loadSource, createDatabase, seed, adapter, contribution, textContent } = require('./helpers/p0-runtime.cjs');

let db;
before(async () => { db = await createDatabase(); });
after(async () => { await db?.close(); });
beforeEach(async () => { await seed(db); });

const secret = 'whsec_local_fixture_only';
const stripe = new Stripe('sk_test_local_fixture_only');
const session = (overrides = {}) => ({ id: 'cs_local', object: 'checkout.session', amount_total: 2000,
  currency: 'eur', payment_status: 'paid', payment_intent: 'pi_local',
  metadata: { pot_id: ids.pot, message_body: 'Bravo !' }, ...overrides });
const quietLogger = { logServerError() {}, logServerWarn() {} };
function webhook(client = adapter(db)) {
  return loadSource('app/api/stripe/webhook/route.ts', {
    '@/lib/stripe': { getStripe: () => stripe },
    '@/lib/env': { getStripeWebhookSecret: () => secret },
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => client },
    '@/lib/logger': quietLogger,
  }).POST;
}
function request(type, checkout = session(), signatureOverride) {
  const payload = JSON.stringify({ id: 'evt_local', object: 'event', type, data: { object: checkout } });
  const signature = signatureOverride ?? stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request('https://local.invalid/api/stripe/webhook', { method: 'POST', body: payload,
    headers: signature === '' ? {} : { 'stripe-signature': signature } });
}
async function rows(table) { return (await db.query(`select * from ${table}`)).rows; }

test('HTTP completed confirms canonical contribution and persists exactly one attached message', async () => {
  const original = await contribution(db);
  const response = await webhook()(request('checkout.session.completed'));
  assert.equal(response.status, 200);
  const [stored] = await rows('contributions');
  assert.equal(stored.id, original.id);
  assert.equal(stored.pot_id, ids.pot);
  assert.equal(stored.amount, 2000);
  assert.equal(stored.currency, 'EUR');
  assert.equal(stored.status, 'confirmed');
  assert.equal(stored.stripe_payment_intent_id, 'pi_local');
  const messages = await rows('messages');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].contribution_id, original.id);
  assert.equal(messages[0].pot_id, ids.pot);
  assert.equal(messages[0].body, 'Bravo !');
});

test('HTTP same-event replay and concurrent delivery leave one contribution and one message', async () => {
  await contribution(db);
  const post = webhook();
  assert.equal((await post(request('checkout.session.completed'))).status, 200);
  const beforeReplay = JSON.stringify(await rows('contributions'));
  const responses = await Promise.all(Array.from({ length: 3 }, () => post(request('checkout.session.completed'))));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(JSON.stringify(await rows('contributions')), beforeReplay);
  assert.equal((await rows('messages')).length, 1);
});

test('HTTP retry repairs a message persistence failure without another confirmation', async () => {
  await contribution(db);
  let failMessage = true;
  const client = adapter(db, { fail: table => table === 'messages' && failMessage });
  const post = webhook(client);
  assert.equal((await post(request('checkout.session.completed'))).status, 500);
  assert.equal((await rows('contributions'))[0].status, 'confirmed');
  failMessage = false;
  assert.equal((await post(request('checkout.session.completed'))).status, 200);
  assert.equal((await rows('messages')).length, 1);
});

for (const type of ['checkout.session.expired', 'checkout.session.async_payment_failed']) {
  test(`HTTP ${type} only fails pending contributions and is idempotent`, async () => {
    await contribution(db);
    const post = webhook();
    assert.equal((await post(request(type, session({ payment_status: 'unpaid' })))).status, 200);
    assert.equal((await post(request(type, session({ payment_status: 'unpaid' })))).status, 200);
    assert.equal((await rows('contributions'))[0].status, 'failed');
    assert.equal((await rows('messages')).length, 0);
    await db.exec("update contributions set status = 'confirmed'");
    assert.equal((await post(request(type))).status, 200);
    assert.equal((await rows('contributions'))[0].status, 'confirmed');
  });
}

for (const [type, payment_status] of [['customer.created', 'paid'], ['checkout.session.updated', 'paid'], ['checkout.session.completed', 'unpaid']]) {
  test(`HTTP ${type}/${payment_status} returns 200 without database access`, async () => {
    const client = adapter(db);
    assert.equal((await webhook(client)(request(type, session({ payment_status })))).status, 200);
    assert.equal(client.calls.length, 0);
  });
}

for (const signature of ['', 't=123,v1=invalid']) {
  test(`HTTP ${signature ? 'invalid' : 'missing'} signature is rejected with 400 before database access`, async () => {
    const client = adapter(db);
    assert.equal((await webhook(client)(request('checkout.session.completed', session(), signature))).status, 400);
    assert.equal(client.calls.length, 0);
  });
}

test('HTTP unknown completed session is rejected; unknown expired session is a no-op', async () => {
  const post = webhook();
  assert.equal((await post(request('checkout.session.completed'))).status, 400);
  assert.equal((await post(request('checkout.session.expired'))).status, 200);
  assert.equal((await rows('contributions')).length, 0);
  assert.equal((await rows('messages')).length, 0);
});

for (const [label, changes] of [['amount', { amount_total: 2001 }], ['currency', { currency: 'usd' }],
  ['missing currency', { currency: null }], ['pot', { metadata: { pot_id: ids.otherPot, message_body: 'wrong' } }]]) {
  test(`HTTP inconsistent ${label} is rejected with 400 and no mutation`, async () => {
    await contribution(db);
    assert.equal((await webhook()(request('checkout.session.completed', session(changes)))).status, 400);
    assert.equal((await rows('contributions'))[0].status, 'pending');
    assert.equal((await rows('messages')).length, 0);
  });
}

test('HTTP async success confirms; failed/refunded contributions cannot be resurrected', async () => {
  await contribution(db);
  assert.equal((await webhook()(request('checkout.session.async_payment_succeeded'))).status, 200);
  await db.exec("update contributions set status = 'refunded'");
  assert.equal((await webhook()(request('checkout.session.completed'))).status, 409);
  assert.equal((await rows('contributions'))[0].status, 'refunded');
});

function checkoutAction(client, checkoutStripe) {
  const pots = loadSource('lib/pots.ts', {
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => client },
    '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
  });
  return loadSource('app/p/[shareToken]/actions.ts', {
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => client },
    '@/lib/pots': pots,
    '@/lib/stripe': { getStripe: () => checkoutStripe },
    '@/lib/env': { getBaseUrl: () => 'https://preview.example.invalid' },
    '@/lib/logger': quietLogger,
    'next/navigation': { redirect: url => { throw new Error(`REDIRECT:${url}`); } },
  }).prepareContributionAction;
}
function checkoutForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ share_token: ids.token, amount: '20,00', display_name: 'Alice',
    message: 'Bravo !', consent: 'on', pot_id: ids.otherPot, currency: 'USD' })) form.set(key, value);
  return form;
}

test('closed pot refuses Checkout with a business error, zero Stripe calls and zero pending insert', async () => {
  await db.query("update pots set status = 'closed' where id = $1", [ids.pot]);
  let stripeCalls = 0;
  const client = adapter(db);
  const action = checkoutAction(client, { checkout: { sessions: { create() { stripeCalls++; throw new Error('Unexpected'); } } } });
  const result = await action({}, checkoutForm());
  const { getCopy } = loadSource('lib/getCopy.ts');
  assert.equal(result.error, getCopy().errors.potUnavailable);
  assert.equal(stripeCalls, 0);
  assert.equal((await rows('contributions')).length, 0);
  assert.ok(client.calls.every(call => call.op === 'select'));
});

test('canonical Checkout ignores caller pot/currency and persists a matching pending contribution', async () => {
  let captured;
  const action = checkoutAction(adapter(db), { checkout: { sessions: { async create(payload) {
    captured = payload; return { id: 'cs_local', payment_intent: null, url: 'https://checkout.stripe.com/local-fixture' };
  } } } });
  await assert.rejects(action({}, checkoutForm()), /REDIRECT:https:\/\/checkout.stripe.com\/local-fixture/);
  const [stored] = await rows('contributions');
  assert.equal(stored.status, 'pending');
  assert.equal(stored.pot_id, ids.pot);
  assert.equal(stored.amount, 2000);
  assert.equal(stored.currency, 'EUR');
  assert.equal(captured.metadata.pot_id, ids.pot);
  assert.equal(captured.line_items[0].price_data.currency, 'eur');
  assert.equal(captured.line_items[0].price_data.unit_amount, 2000);
  assert.ok(captured.success_url.startsWith('https://preview.example.invalid/'));
});

test('pending persistence failure expires the created Checkout and does not redirect', async () => {
  const expired = [];
  const action = checkoutAction(adapter(db, { fail: (table, op) => table === 'contributions' && op === 'insert' }),
    { checkout: { sessions: {
      async create() { return { id: 'cs_local', url: 'https://checkout.stripe.com/local-fixture' }; },
      async expire(id) { expired.push(id); },
    } } });
  assert.ok((await action({}, checkoutForm())).error);
  assert.deepEqual(expired, ['cs_local']);
  assert.equal((await rows('contributions')).length, 0);
});

function dashboardActions(client, invalidated) {
  return loadSource('app/dashboard/pots/[id]/actions.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
    '@/lib/logger': quietLogger,
    'next/cache': { revalidatePath: path => invalidated.push(path) },
  });
}
function potForm() { const form = new FormData(); form.set('pot_id', ids.pot); return form; }

test('owner reveal sets flag/timestamp, preserves timestamp on replay and revalidates public routes', async () => {
  const invalidated = [];
  await db.exec('set role authenticated');
  const action = dashboardActions(adapter(db), invalidated).revealDashboardPotAction;
  await action(potForm());
  const first = (await rows('pots'))[0];
  assert.equal(first.revealed, true);
  assert.ok(Number.isFinite(Date.parse(first.revealed_at)));
  await action(potForm());
  const second = (await rows('pots'))[0];
  assert.equal(String(second.revealed_at), String(first.revealed_at));
  assert.ok(invalidated.includes(`/dashboard/pots/${ids.pot}`));
  assert.ok(invalidated.includes(`/p/${ids.token}`));
  assert.ok(invalidated.includes(`/p/${ids.token}/reveal`));
});

for (const user of [ids.outsider, null]) {
  test(`reveal refuses ${user ? 'non-owner' : 'unauthenticated caller'} without mutation`, async () => {
    const invalidated = [];
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
    await db.exec('set role authenticated');
    await assert.rejects(dashboardActions(adapter(db, { user }), invalidated).revealDashboardPotAction(potForm()));
    await db.exec('reset role');
    const [pot] = (await db.query('select * from pots where id=$1', [ids.pot])).rows;
    assert.equal(pot.revealed, false);
    assert.equal(pot.revealed_at, null);
    assert.equal(invalidated.length, 0);
  });
}

for (const checked of [false, true]) {
  test(`creation parses and persists mystery_mode=${checked}, without private payload logs`, async () => {
    const logs = [];
    const action = loadSource('app/dashboard/pots/new/actions.ts', {
      '@/lib/supabase/server': { createSupabaseServerClient: async () => adapter(db) },
      'next/navigation': { redirect: url => { throw new Error(`REDIRECT:${url}`); } },
    }, { console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) } }).createDashboardPotAction;
    const form = new FormData();
    form.set('title', 'Private birthday title');
    if (checked) form.set('mystery_mode', 'on');
    await assert.rejects(action({}, form), /REDIRECT:\/dashboard\/pots\/[0-9a-f-]+/);
    const [pot] = (await db.query("select * from pots where title='Private birthday title'")).rows;
    assert.equal(pot.mystery_mode, checked);
    assert.equal(logs.length, 0, 'Creation must not log private title, owner UUID or share token');
  });
}

test('organizer list returns confirmed aggregates and excludes other owners', async () => {
  await contribution(db, { status: 'confirmed' });
  await contribution(db, { stripe_checkout_session_id: 'cs_pending', amount: 9000 });
  await contribution(db, { stripe_checkout_session_id: 'cs_failed', status: 'failed', amount: 8000 });
  await contribution(db, { stripe_checkout_session_id: 'cs_refunded', status: 'refunded', amount: 7000 });
  await db.exec('set role authenticated');
  const pots = loadSource('lib/pots.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => adapter(db) },
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => { throw new Error('Unexpected admin'); } },
  });
  const result = await pots.getMyPots();
  assert.equal(result.length, 1);
  assert.equal(Number(result[0].confirmed_total_amount), 2000);
  assert.equal(Number(result[0].confirmed_contribution_count), 1);
});

for (const privacy of ['standard', 'total_only', 'blind_to_owner']) {
  test(`dashboard detail ${privacy} displays confirmed total even when individual rows are hidden by RLS`, async () => {
    await db.query('update pots set privacy_mode=$1 where id=$2', [privacy, ids.pot]);
    await contribution(db, { status: 'confirmed' });
    await contribution(db, { stripe_checkout_session_id: 'cs_pending', amount: 9000 });
    await contribution(db, { stripe_checkout_session_id: 'cs_failed', status: 'failed', amount: 8000 });
    await contribution(db, { stripe_checkout_session_id: 'cs_refunded', status: 'refunded', amount: 7000 });
    await db.exec('set role authenticated');
    const page = loadSource('app/dashboard/pots/[id]/page.tsx', {
      '@/lib/supabase/server': { createSupabaseServerClient: async () => adapter(db) },
      '@/lib/env': { getBaseUrl: () => 'https://preview.example.invalid' },
      './actions': { revealDashboardPotAction() {} },
      'next/link': 'a', 'next/navigation': { notFound() { throw new Error('Not found'); }, redirect() { throw new Error('Redirect'); } },
    }, { process: { env: { NEXT_PUBLIC_SITE_URL: 'https://preview.example.invalid' } } }).default;
    const text = textContent(await page({ params: { id: ids.pot } }));
    assert.match(text, /Total collecté\s+20(?:[,.]00)?\s*€/);
    assert.match(text, /Contributions\s+1\s+Panier moyen\s+20(?:[,.]00)?\s*€/);
    assert.doesNotMatch(text, /(?:90|80|70|260)(?:[,.]00)?\s*€/);
  });
}

test('public page displays RPC-authorized identity outside mystery mode', async () => {
  const page = loadSource('app/p/[shareToken]/page.tsx', {
    '@/lib/pots': {
      getPublicPotByToken: async () => ({ title: 'Test pot', currency: 'EUR', mystery_mode: false,
        is_open: true, event_type: 'birthday', confirmed_total_amount: 2000, confirmed_contribution_count: 1 }),
      getPublicPotRevealContributions: async () => [{ visible_identity: 'Alice', created_at: '2026-09-07', pot_progress_percentage: 100 }],
    },
    '@/lib/i18n-server': { getRequestLocale: () => 'fr' },
    '@/components/pot/contribution-form': { ContributionForm: 'contribution-form' },
    'next/link': 'a', 'next/navigation': { notFound() { throw new Error('Not found'); } },
  }).default;
  assert.match(textContent(await page({ params: Promise.resolve({ shareToken: ids.token }) })), /Alice/);
});

test('payout page uses confirmed aggregate when RLS hides individual contributions', async () => {
  await db.query("update pots set privacy_mode='total_only' where id=$1", [ids.pot]);
  await contribution(db, { status: 'confirmed' });
  await contribution(db, { stripe_checkout_session_id: 'cs_pending', amount: 9000 });
  await contribution(db, { stripe_checkout_session_id: 'cs_failed', status: 'failed', amount: 8000 });
  await contribution(db, { stripe_checkout_session_id: 'cs_refunded', status: 'refunded', amount: 7000 });
  await db.exec('set role authenticated');
  const page = loadSource('app/dashboard/pots/[id]/payout/page.tsx', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => adapter(db) },
    'next/cache': { revalidatePath() {} },
    'next/link': 'a', 'next/navigation': { notFound() { throw new Error('Not found'); }, redirect() { throw new Error('Redirect'); } },
  }).default;
  assert.match(textContent(await page({ params: Promise.resolve({ id: ids.pot }) })), /Total validé\s+20(?:[,.]00)?\s*€/);
});

test('success page never falls back to private contribution data when Stripe verification fails', async () => {
  await contribution(db, { status: 'confirmed', contributor_display_name: 'PRIVATE_ALICE' });
  const client = adapter(db);
  const page = loadSource('app/p/[shareToken]/success/page.tsx', {
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => client },
    '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { async retrieve() { throw new Error('Stripe unavailable'); } } } }) },
    '@/lib/pots': { getPublicPotByToken: async () => ({ title: 'Other pot', currency: 'EUR', event_type: 'birthday' }) },
    '@/lib/i18n-server': { getRequestLocale: () => 'fr' },
    'next/link': 'a', 'next/navigation': { notFound() { throw new Error('Not found'); } },
  }).default;
  const output = textContent(await page({ params: Promise.resolve({ shareToken: 'other-public-test-token' }),
    searchParams: Promise.resolve({ session_id: 'cs_local' }) }));
  assert.doesNotMatch(output, /PRIVATE_ALICE/);
  assert.equal(client.calls.length, 0);
});

test('server logger redacts access tokens, session references, user IDs and raw error payloads', () => {
  const output = [];
  const logger = loadSource('lib/logger.ts', {}, {
    console: { info: (...args) => output.push(args), warn: (...args) => output.push(args), error: (...args) => output.push(args) },
  });
  logger.logServerWarn('test', 'Rejected', { shareToken: 'PRIVATE_TOKEN', sessionId: 'PRIVATE_SESSION', userId: 'PRIVATE_USER', eventType: 'checkout.session.completed' });
  logger.logServerError('test', 'Failed', { details: 'PRIVATE_SQL_ROW', message: 'PRIVATE_EMAIL' });
  assert.doesNotMatch(JSON.stringify(output), /PRIVATE_/);
  assert.match(JSON.stringify(output), /checkout.session.completed/);
});

test('logger preserves operational error codes, status and webhook failure reasons', () => {
  const output = [];
  const logger = loadSource('lib/logger.ts', {}, { console: { error: (...args) => output.push(args) } });
  logger.logServerError('stripe.webhook', 'Failed', {
    type: 'StripeAPIError', code: 'api_error', statusCode: 503,
    message: 'PRIVATE_EMAIL@example.invalid', details: 'PRIVATE_SQL',
  }, { eventType: 'checkout.session.completed', potId: ids.pot, nested: { token: 'PRIVATE_TOKEN' } });
  logger.logServerError('stripe.webhook', 'Failed', new Error('message_persistence_failed'));
  const serialized = JSON.stringify(output);
  assert.doesNotMatch(serialized, /PRIVATE_/);
  for (const value of ['StripeAPIError', 'api_error', '503', 'message_persistence_failed', ids.pot]) {
    assert.ok(serialized.includes(value), value);
  }
});

for (const source of ['pots', 'get_my_pot_detail', 'payouts']) {
  test(`payout refuses a ${source} read error instead of displaying a zero balance`, async () => {
    const client = adapter(db, { fail: name => name === source });
    const page = loadSource('app/dashboard/pots/[id]/payout/page.tsx', {
      '@/lib/supabase/server': { createSupabaseServerClient: async () => client },
      'next/cache': { revalidatePath() {} }, 'next/link': 'a',
      'next/navigation': { notFound() { throw new Error('Not found'); }, redirect() { throw new Error('Redirect'); } },
    }).default;
    await assert.rejects(page({ params: Promise.resolve({ id: ids.pot }) }), /Impossible de vérifier le solde/);
    assert.ok(client.calls.every(call => !['insert', 'update'].includes(call.op)));
  });
}

test('creation returns a business error without leaking database internals', async () => {
  const logs = [];
  const action = loadSource('app/dashboard/pots/new/actions.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: ids.owner } } }) },
      from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null,
        error: { code: '23505', message: 'PRIVATE_SQL', details: 'PRIVATE_ROW', hint: 'PRIVATE_HINT' } }) }) }) }),
    }) },
    'next/navigation': { redirect() { throw new Error('Unexpected redirect'); } },
  }, { console: { log: (...args) => logs.push(args), error: (...args) => logs.push(args) } }).createDashboardPotAction;
  const form = new FormData(); form.set('title', 'Test creation');
  const result = await action({}, form);
  assert.equal(result.error, 'Impossible de créer la cagnotte. Veuillez réessayer.');
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|23505/);
  assert.doesNotMatch(JSON.stringify(logs), /PRIVATE_/);
});

test('success page rejects a verified Stripe session belonging to another pot before private lookup', async () => {
  const client = adapter(db);
  const page = loadSource('app/p/[shareToken]/success/page.tsx', {
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => client },
    '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { async retrieve() {
      return session({ metadata: { pot_id: ids.otherPot, share_token: 'other-public-test-token' } });
    } } } }) },
    '@/lib/pots': { getPublicPotByToken: async () => ({ title: 'Test pot', currency: 'EUR', event_type: 'birthday' }) },
    'next/link': 'a', 'next/navigation': { notFound() { throw new Error('NOT_FOUND'); } },
  }).default;
  await assert.rejects(page({ params: Promise.resolve({ shareToken: ids.token }),
    searchParams: Promise.resolve({ session_id: 'cs_local' }) }), /NOT_FOUND/);
  assert.equal(client.calls.length, 0);
});

test('success page still displays the verified matching Stripe contribution', async () => {
  await contribution(db, { status: 'confirmed' });
  const page = loadSource('app/p/[shareToken]/success/page.tsx', {
    '@/lib/supabase/admin': { createSupabaseAdminClient: () => adapter(db) },
    '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { async retrieve() {
      return session({ metadata: { pot_id: ids.pot, share_token: ids.token } });
    } } } }) },
    '@/lib/pots': { getPublicPotByToken: async () => ({ title: 'Test pot', currency: 'EUR', event_type: 'birthday' }) },
    'next/link': 'a', 'next/navigation': { notFound() { throw new Error('NOT_FOUND'); } },
  }).default;
  const output = textContent(await page({ params: Promise.resolve({ shareToken: ids.token }),
    searchParams: Promise.resolve({ session_id: 'cs_local' }) }));
  assert.match(output, /Alice/);
  assert.match(output, /20(?:[,.]00)?\s*€/);
});


for (const [privacy, count] of [['total_only', 2], ['total_only', 0], ['standard', 2]]) {
  test('dashboard contribution state: ' + privacy + ', confirmed=' + count, async () => {
    await db.query('update pots set privacy_mode=$1 where id=$2', [privacy, ids.pot]);
    const created = [];
    for (let i = 0; i < count; i++) {
      created.push(await contribution(db, { status: 'confirmed', amount: 200 + i * 100,
        contributor_display_name: 'PRIVATE_PARTICIPANT_' + i,
        stripe_checkout_session_id: 'cs_private_state_' + i }));
    }
    await db.exec('set role authenticated');
    const visible = (await db.query('select * from contributions where pot_id=$1', [ids.pot])).rows;
    assert.equal(visible.length, privacy === 'standard' ? count : 0);
    const page = loadSource('app/dashboard/pots/[id]/page.tsx', {
      '@/lib/supabase/server': { createSupabaseServerClient: async () => adapter(db) },
      './actions': { revealDashboardPotAction() {} },
      'next/link': 'a', 'next/navigation': { notFound() { throw new Error('Not found'); } },
    }, { process: { env: { NEXT_PUBLIC_SITE_URL: 'https://preview.example.invalid' } } }).default;
    const output = textContent(await page({ params: { id: ids.pot } }));
    const hidden = 'Les détails des contributions sont masqués par le mode de confidentialité de cette cagnotte.';
    const empty = 'Aucune contribution pour le moment.';
    if (count === 0) {
      assert.ok(output.includes(empty));
      assert.ok(!output.includes(hidden));
    } else {
      assert.match(output, /Total collecté\s+5(?:[,.]00)?\s*€/);
      assert.match(output, /Contributions\s+2\s+Panier moyen\s+2[,.]50\s*€/);
      assert.ok(!output.includes(empty));
      if (privacy === 'total_only') {
        assert.ok(output.includes(hidden));
        assert.doesNotMatch(output, /PRIVATE_PARTICIPANT_|cs_private_state_|(?:2|3)[,.]00\s*€/);
        for (const row of created) assert.ok(!output.includes(row.id));
      } else {
        assert.ok(!output.includes(hidden));
        assert.ok(output.includes('PRIVATE_PARTICIPANT_0'));
        assert.ok(output.includes('PRIVATE_PARTICIPANT_1'));
        assert.match(output, /2[,.]00\s*€/);
        assert.match(output, /3[,.]00\s*€/);
      }
    }
  });
}
