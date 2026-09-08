const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { ids, createDatabase, seed, contribution } = require('./helpers/p0-runtime.cjs');
let db;
before(async () => { db = await createDatabase(); });
after(async () => { await db?.close(); });
beforeEach(async () => { await seed(db); });
async function publicRows(name, token = ids.token) {
  await db.exec('set role anon');
  try { return (await db.query(`select * from ${name}($1)`, [token])).rows; }
  finally { await db.exec('reset role'); }
}

test('public RPC exact field allowlists omit identifiers, emails, payment fields and individual amounts', async () => {
  await contribution(db, { status: 'confirmed', contributor_user_id: ids.owner, stripe_payment_intent_id: 'pi_private' });
  const [pot] = await publicRows('get_public_pot_by_share_token');
  assert.deepEqual(Object.keys(pot).sort(), ['title', 'description', 'event_type', 'event_date', 'currency', 'goal_amount',
    'mystery_mode', 'is_open', 'revealed', 'messages_visible_to_beneficiary', 'confirmed_total_amount', 'confirmed_contribution_count'].sort());
  const [item] = await publicRows('get_public_pot_reveal_contributions');
  assert.deepEqual(Object.keys(item).sort(), ['message_body', 'created_at', 'visible_identity', 'visible_hint_level_1',
    'visible_hint_level_2', 'visible_hint_level_3', 'visible_mystery_hint', 'pot_progress_percentage'].sort());
  const serialized = JSON.stringify({ pot, item });
  for (const value of [ids.pot, ids.owner, 'pi_private', 'cs_local', 'owner@example.invalid', 'Alice']) {
    assert.ok(!serialized.includes(value), `Forbidden raw value: ${value}`);
  }
});

test('public totals/counts/progress include confirmed only and remain isolated by pot', async () => {
  await contribution(db, { status: 'confirmed' });
  await contribution(db, { stripe_checkout_session_id: 'cs_pending', amount: 9000 });
  await contribution(db, { stripe_checkout_session_id: 'cs_failed', amount: 8000, status: 'failed' });
  await contribution(db, { stripe_checkout_session_id: 'cs_refunded', amount: 7000, status: 'refunded' });
  await contribution(db, { stripe_checkout_session_id: 'cs_other', pot_id: ids.otherPot, amount: 6000, status: 'confirmed' });
  const [pot] = await publicRows('get_public_pot_by_share_token');
  assert.equal(Number(pot.confirmed_total_amount), 2000);
  assert.equal(Number(pot.confirmed_contribution_count), 1);
  const items = await publicRows('get_public_pot_reveal_contributions');
  assert.equal(items.length, 1);
  assert.equal(Number(items[0].pot_progress_percentage), 50);
});

for (const mystery of [true, false]) for (const revealed of [false, true]) for (const anonymous of [false, true]) {
  test(`RPC identity mystery=${mystery}, revealed=${revealed}, anonymous=${anonymous}`, async () => {
    await db.query('update pots set mystery_mode=$1, revealed=$2 where id=$3', [mystery, revealed, ids.pot]);
    await contribution(db, { status: 'confirmed', is_anonymous: anonymous });
    const [item] = await publicRows('get_public_pot_reveal_contributions');
    assert.equal(item.visible_identity, !anonymous && (!mystery || revealed) ? 'Alice' : null);
  });
}

for (const status of ['closed', 'completed', 'draft']) {
  test(`public RPC readability for ${status} pot`, async () => {
    await db.query('update pots set status=$1 where id=$2', [status, ids.pot]);
    await contribution(db, { status: 'confirmed' });
    const pots = await publicRows('get_public_pot_by_share_token');
    const items = await publicRows('get_public_pot_reveal_contributions');
    assert.equal(pots.length, status === 'draft' ? 0 : 1);
    assert.equal(items.length, status === 'draft' ? 0 : 1);
    if (pots.length) assert.equal(pots[0].is_open, false);
  });
}

test('unknown share token returns no public data', async () => {
  assert.deepEqual(await publicRows('get_public_pot_by_share_token', 'unknown-test-token'), []);
  assert.deepEqual(await publicRows('get_public_pot_reveal_contributions', 'unknown-test-token'), []);
});

test('beneficiary visibility flag does not hide messages from the general public RPC', async () => {
  const c = await contribution(db, { status: 'confirmed' });
  await db.query('insert into messages(pot_id, contribution_id, body) values ($1,$2,$3)', [ids.pot, c.id, 'Public message']);
  await db.query('update pots set messages_visible_to_beneficiary=false where id=$1', [ids.pot]);
  assert.equal((await publicRows('get_public_pot_reveal_contributions'))[0].message_body, 'Public message');
  await db.query('update pots set messages_visible_to_beneficiary=true where id=$1', [ids.pot]);
  assert.equal((await publicRows('get_public_pot_reveal_contributions'))[0].message_body, 'Public message');
});

test('anonymous caller cannot bypass public RPC through tables or raw reveal view', async () => {
  await contribution(db, { status: 'confirmed' });
  await db.exec('set role anon');
  for (const table of ['pots', 'contributions', 'messages', 'contribution_reveal_view']) {
    assert.equal((await db.query(`select * from ${table}`)).rows.length, 0, table);
  }
});

test('database uniqueness rejects duplicate checkout and duplicate message attachment', async () => {
  const c = await contribution(db);
  await assert.rejects(contribution(db), /duplicate key/);
  await db.query('insert into messages(pot_id, contribution_id, body) values ($1,$2,$3)', [ids.pot, c.id, 'First']);
  await assert.rejects(db.query('insert into messages(pot_id, contribution_id, body) values ($1,$2,$3)', [ids.pot, c.id, 'Duplicate']), /duplicate key/);
});
