alter table public.contributions
  add column if not exists revealed boolean not null default false;

comment on column public.contributions.revealed is
'When true, contributor identity can be fully revealed in mystery mode experiences.';

create or replace function public.get_pot_progress_percentage(p_pot_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select
    case
      when p.goal_amount is null or p.goal_amount <= 0 then
        case
          when coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0) > 0 then 100::numeric
          else 0::numeric
        end
      else least(
        100::numeric,
        round(
          coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::numeric
          / p.goal_amount::numeric
          * 100,
          2
        )
      )
    end
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.id = p_pot_id
  group by p.id, p.goal_amount;
$$;

comment on function public.get_pot_progress_percentage(uuid) is
'Returns the confirmed-funds progress percentage for a pot. If no goal exists, progress is treated as 100 once the pot has at least one confirmed contribution.';

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
  c.revealed,
  c.created_at,
  public.get_pot_progress_percentage(c.pot_id) as pot_progress_percentage,
  case
    when c.is_anonymous then null
    when c.mystery_mode = false then c.contributor_display_name
    when c.revealed then c.contributor_display_name
    when public.get_pot_progress_percentage(c.pot_id) >= 100 then c.contributor_display_name
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
where c.status = 'confirmed';

comment on view public.contribution_reveal_view is
'Projects confirmed contributions into a public-friendly mystery-mode representation with progressive hint visibility based on pot progress.';
