do $$
declare
  seed_user_id uuid;
  seed_pot_id uuid;
  seed_contribution_id uuid;
begin
  select id into seed_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if seed_user_id is null then
    raise notice 'No auth user found, skipping PotSecret seed.';
    return;
  end if;

  insert into public.profiles (id, display_name)
  values (seed_user_id, 'Organisateur demo')
  on conflict (id) do nothing;

  insert into public.pots (
    owner_user_id,
    title,
    description,
    event_type,
    event_date,
    currency,
    goal_amount,
    privacy_mode,
    status
  )
  values (
    seed_user_id,
    'Pot anniversaire surprise',
    'Premier jeu de donnees PotSecret avec un pot partage et un paiement confirme.',
    'birthday',
    current_date + interval '10 days',
    'EUR',
    30000,
    'standard',
    'open'
  )
  returning id into seed_pot_id;

  insert into public.contributions (
    pot_id,
    contributor_user_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    amount,
    currency,
    status,
    contributor_display_name,
    is_anonymous
  )
  values (
    seed_pot_id,
    seed_user_id,
    'cs_test_seed_potsecret',
    'pi_test_seed_potsecret',
    4500,
    'EUR',
    'confirmed',
    'Camille',
    false
  )
  returning id into seed_contribution_id;

  insert into public.messages (
    pot_id,
    contributor_user_id,
    contribution_id,
    body,
    author_display_name,
    is_anonymous
  )
  values (
    seed_pot_id,
    seed_user_id,
    seed_contribution_id,
    'On participe avec plaisir pour cette surprise.',
    'Camille',
    false
  );
end $$;
