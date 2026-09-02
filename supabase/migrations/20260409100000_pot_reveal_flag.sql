alter table public.pots
  add column if not exists revealed boolean not null default false;

comment on column public.pots.revealed is
'When true, the mystery reveal has been triggered for the whole pot and contributor identities may be shown where allowed.';

update public.pots p
set revealed = true
where exists (
  select 1
  from public.contributions c
  where c.pot_id = p.id
    and coalesce(c.revealed, false) = true
);

create or replace view public.contribution_reveal_view
with (security_invoker = true)
as
select
  c.id,
  c.pot_id,
  c.amount,
  c.currency,
  c.status,
  c.message_body,
  c.is_anonymous,
  c.contributor_display_name,
  c.mystery_mode,
  c.hint_level_1,
  c.hint_level_2,
  c.hint_level_3,
  p.revealed as pot_revealed,
  c.created_at,
  public.get_pot_progress_percentage(c.pot_id) as pot_progress_percentage,
  case
    when c.is_anonymous then null
    when c.mystery_mode = false then c.contributor_display_name
    when p.revealed then c.contributor_display_name
    else null
  end as visible_identity,
  case
    when c.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 25 then c.hint_level_1
    else null
  end as visible_hint_level_1,
  case
    when c.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 50 then c.hint_level_2
    else null
  end as visible_hint_level_2,
  case
    when c.mystery_mode = true and public.get_pot_progress_percentage(c.pot_id) >= 75 then c.hint_level_3
    else null
  end as visible_hint_level_3
from public.contributions c
join public.pots p on p.id = c.pot_id
where c.status = 'confirmed';

comment on view public.contribution_reveal_view is
'Projects confirmed contributions into a public-friendly mystery-mode representation with progressive hint visibility based on pot progress and final identity reveal controlled at the pot level.';
