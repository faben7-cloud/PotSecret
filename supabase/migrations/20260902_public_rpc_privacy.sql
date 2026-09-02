-- Public RPCs deliberately expose display data only. Internal identifiers, amounts,
-- Stripe fields and raw contributor identities remain unavailable to anon callers.

drop function if exists public.get_public_pot_by_share_token(text);
create function public.get_public_pot_by_share_token(p_share_token text)
returns table (
  title text,
  description text,
  event_type public.pot_event_type,
  event_date date,
  currency text,
  goal_amount integer,
  mystery_mode boolean,
  is_open boolean,
  revealed boolean,
  messages_visible_to_beneficiary boolean,
  confirmed_total_amount bigint,
  confirmed_contribution_count bigint
)
language sql security definer set search_path = public as $$
  select p.title, p.description, p.event_type, p.event_date, p.currency, p.goal_amount,
    p.mystery_mode, p.status = 'open', p.revealed, p.messages_visible_to_beneficiary,
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint,
    count(c.id) filter (where c.status = 'confirmed')::bigint
  from public.pots p left join public.contributions c on c.pot_id = p.id
  where p.share_token = p_share_token and p.status in ('open', 'closed', 'completed') group by p.id;
$$;

drop function if exists public.get_public_pot_reveal_contributions(text);
create function public.get_public_pot_reveal_contributions(p_share_token text)
returns table (
  message_body text,
  created_at timestamptz,
  visible_identity text,
  visible_hint_level_1 text,
  visible_hint_level_2 text,
  visible_hint_level_3 text,
  visible_mystery_hint text,
  pot_progress_percentage numeric
)
language sql security definer set search_path = public as $$
  select nullif(trim(m.body), ''), c.created_at,
    case when c.is_anonymous then null when p.mystery_mode and not p.revealed then null else nullif(trim(c.contributor_display_name), '') end,
    case when p.mystery_mode and public.get_pot_progress_percentage(p.id) >= 25 then c.hint_level_1 else null end,
    case when p.mystery_mode and public.get_pot_progress_percentage(p.id) >= 50 then c.hint_level_2 else null end,
    case when p.mystery_mode and public.get_pot_progress_percentage(p.id) >= 75 then c.hint_level_3 else null end,
    case when p.mystery_mode and public.get_pot_progress_percentage(p.id) >= 25 then nullif(trim(m.mystery_hint), '') else null end,
    public.get_pot_progress_percentage(p.id)
  from public.contributions c join public.pots p on p.id = c.pot_id
  left join public.messages m on m.contribution_id = c.id
  where p.share_token = p_share_token and p.status in ('open', 'closed', 'completed') and c.status = 'confirmed'
  order by c.created_at desc;
$$;

revoke all on function public.get_public_pot_by_share_token(text) from public;
revoke all on function public.get_public_pot_reveal_contributions(text) from public;
grant execute on function public.get_public_pot_by_share_token(text) to anon, authenticated;
grant execute on function public.get_public_pot_reveal_contributions(text) to anon, authenticated;
