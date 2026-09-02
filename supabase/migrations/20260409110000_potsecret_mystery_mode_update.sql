alter table public.pots
  add column if not exists mystery_mode boolean not null default false,
  add column if not exists revealed_at timestamptz;

alter table public.messages
  add column if not exists mystery_hint text;

comment on column public.pots.mystery_mode is
'When true, the pot uses PotSecret mystery mode and public contribution displays should prefer hints over identities until the pot is revealed.';

comment on column public.pots.revealed_at is
'UTC timestamp marking when the organizer triggered the final reveal for the whole pot.';

comment on column public.messages.mystery_hint is
'Optional friendly clue associated with the contribution message for mystery-mode public displays.';

update public.pots p
set mystery_mode = true
where exists (
  select 1
  from public.contributions c
  where c.pot_id = p.id
    and coalesce(c.mystery_mode, false) = true
);

update public.pots
set revealed_at = coalesce(revealed_at, timezone('utc', now()))
where revealed = true
  and revealed_at is null;

drop function if exists public.get_my_pot_detail(uuid);
create function public.get_my_pot_detail(p_pot_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  event_type public.pot_event_type,
  event_date date,
  currency text,
  goal_amount integer,
  privacy_mode public.pot_privacy_mode,
  mystery_mode boolean,
  status public.pot_status,
  share_token text,
  revealed boolean,
  revealed_at timestamptz,
  messages_visible_to_beneficiary boolean,
  confirmed_total_amount bigint,
  confirmed_contribution_count bigint,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.title,
    p.description,
    p.event_type,
    p.event_date,
    p.currency,
    p.goal_amount,
    p.privacy_mode,
    p.mystery_mode,
    p.status,
    p.share_token,
    p.revealed,
    p.revealed_at,
    p.messages_visible_to_beneficiary,
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint as confirmed_total_amount,
    count(c.id) filter (where c.status = 'confirmed')::bigint as confirmed_contribution_count,
    p.created_at
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.id = p_pot_id
    and p.owner_user_id = auth.uid()
  group by p.id;
$$;

drop function if exists public.get_public_pot_by_share_token(text);
create function public.get_public_pot_by_share_token(p_share_token text)
returns table (
  id uuid,
  share_token text,
  title text,
  description text,
  event_type public.pot_event_type,
  event_date date,
  currency text,
  goal_amount integer,
  privacy_mode public.pot_privacy_mode,
  mystery_mode boolean,
  status public.pot_status,
  revealed boolean,
  revealed_at timestamptz,
  messages_visible_to_beneficiary boolean,
  confirmed_total_amount bigint,
  confirmed_contribution_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.share_token,
    p.title,
    p.description,
    p.event_type,
    p.event_date,
    p.currency,
    p.goal_amount,
    p.privacy_mode,
    p.mystery_mode,
    p.status,
    p.revealed,
    p.revealed_at,
    p.messages_visible_to_beneficiary,
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint as confirmed_total_amount,
    count(c.id) filter (where c.status = 'confirmed')::bigint as confirmed_contribution_count
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.share_token = p_share_token
    and p.status in ('open', 'closed', 'completed')
  group by p.id;
$$;

-- PostgreSQL cannot alter existing view columns through CREATE OR REPLACE.
-- Recreate the prior reveal projection before adding message-backed fields.
drop view if exists public.contribution_reveal_view;

create view public.contribution_reveal_view
with (security_invoker = true)
as
select
  c.id,
  c.pot_id,
  c.amount,
  c.currency,
  c.status,
  coalesce(m.body, c.message_body) as message_body,
  m.id as message_id,
  m.mystery_hint,
  c.is_anonymous,
  c.contributor_display_name,
  p.mystery_mode,
  c.hint_level_1,
  c.hint_level_2,
  c.hint_level_3,
  p.revealed as pot_revealed,
  p.revealed_at,
  c.created_at,
  public.get_pot_progress_percentage(c.pot_id) as pot_progress_percentage,
  case
    when c.is_anonymous then null
    when p.mystery_mode = false then c.contributor_display_name
    when p.revealed then c.contributor_display_name
    else null
  end as visible_identity,
  case
    when p.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 25 then c.hint_level_1
    else null
  end as visible_hint_level_1,
  case
    when p.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 50 then c.hint_level_2
    else null
  end as visible_hint_level_2,
  case
    when p.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 75 then c.hint_level_3
    else null
  end as visible_hint_level_3,
  case
    when p.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 25
      then nullif(trim(coalesce(m.mystery_hint, '')), '')
    else null
  end as visible_mystery_hint
from public.contributions c
join public.pots p on p.id = c.pot_id
left join public.messages m on m.contribution_id = c.id
where c.status = 'confirmed';

create or replace function public.get_public_pot_reveal_contributions(p_share_token text)
returns table (
  id uuid,
  pot_id uuid,
  amount integer,
  currency text,
  status public.contribution_status,
  message_body text,
  message_id uuid,
  mystery_hint text,
  is_anonymous boolean,
  contributor_display_name text,
  mystery_mode boolean,
  hint_level_1 text,
  hint_level_2 text,
  hint_level_3 text,
  pot_revealed boolean,
  revealed_at timestamptz,
  created_at timestamptz,
  pot_progress_percentage numeric,
  visible_identity text,
  visible_hint_level_1 text,
  visible_hint_level_2 text,
  visible_hint_level_3 text,
  visible_mystery_hint text
)
language sql
security definer
set search_path = public
as $$
  select
    v.id,
    v.pot_id,
    v.amount,
    v.currency,
    v.status,
    v.message_body,
    v.message_id,
    v.mystery_hint,
    v.is_anonymous,
    v.contributor_display_name,
    v.mystery_mode,
    v.hint_level_1,
    v.hint_level_2,
    v.hint_level_3,
    v.pot_revealed,
    v.revealed_at,
    v.created_at,
    v.pot_progress_percentage,
    v.visible_identity,
    v.visible_hint_level_1,
    v.visible_hint_level_2,
    v.visible_hint_level_3,
    v.visible_mystery_hint
  from public.contribution_reveal_view v
  join public.pots p on p.id = v.pot_id
  where p.share_token = p_share_token
    and p.status in ('open', 'closed', 'completed')
  order by v.created_at desc;
$$;

grant execute on function public.get_my_pot_detail(uuid) to authenticated;
grant execute on function public.get_public_pot_by_share_token(text) to anon, authenticated;
grant execute on function public.get_public_pot_reveal_contributions(text) to anon, authenticated;
