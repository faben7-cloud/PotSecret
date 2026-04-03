do $$
begin
  alter type public.pot_privacy_mode add value if not exists 'total_only';
exception
  when duplicate_object then null;
end $$;

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
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint as confirmed_total_amount,
    count(c.id) filter (where c.status = 'confirmed')::bigint as confirmed_contribution_count,
    p.created_at
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.id = p_pot_id
    and p.owner_user_id = auth.uid()
  group by p.id;
$$;

create or replace function public.get_my_pot_messages(p_pot_id uuid)
returns table (
  id uuid,
  contribution_id uuid,
  body text,
  author_display_name text,
  is_anonymous boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.contribution_id,
    m.body,
    case
      when p.privacy_mode = 'blind_to_owner' then null
      when m.is_anonymous then null
      else m.author_display_name
    end as author_display_name,
    m.is_anonymous,
    m.created_at
  from public.messages m
  inner join public.pots p on p.id = m.pot_id
  where m.pot_id = p_pot_id
    and p.owner_user_id = auth.uid()
  order by m.created_at desc;
$$;

grant execute on function public.get_my_pot_detail(uuid) to authenticated;
grant execute on function public.get_my_pot_messages(uuid) to authenticated;
