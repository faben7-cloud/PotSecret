alter table public.pots
  add column if not exists messages_visible_to_beneficiary boolean not null default false;

comment on column public.pots.messages_visible_to_beneficiary is
  'When true, the organizer may later expose collected messages to the final beneficiary.';

create or replace function public.get_my_pot_detail(p_pot_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  event_type public.pot_event_type,
  event_date date,
  currency text,
  goal_amount integer,
  privacy_mode public.pot_privacy_mode,
  status public.pot_status,
  share_token text,
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
    p.status,
    p.share_token,
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

create or replace function public.get_my_pot_contributions(p_pot_id uuid)
returns table (
  id uuid,
  amount integer,
  contributor_display_name text,
  is_anonymous boolean,
  status public.contribution_status,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    case
      when p.privacy_mode = 'standard' then c.amount
      else null
    end as amount,
    case
      when p.privacy_mode <> 'standard' then null
      when c.is_anonymous then null
      else c.contributor_display_name
    end as contributor_display_name,
    c.is_anonymous,
    c.status,
    c.created_at
  from public.contributions c
  inner join public.pots p on p.id = c.pot_id
  where c.pot_id = p_pot_id
    and p.owner_user_id = auth.uid()
    and c.status = 'confirmed'
  order by c.created_at desc;
$$;

grant execute on function public.get_my_pot_detail(uuid) to authenticated;
grant execute on function public.get_my_pot_contributions(uuid) to authenticated;
