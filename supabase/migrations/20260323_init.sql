create extension if not exists pgcrypto;

do $$
begin
 if not exists (select 1 from pg_type where typname = 'pot_event_type') then
 create type public.pot_event_type as enum ('birthday', 'farewell', 'birth', 'wedding', 'other');
 end if;

 if not exists (select 1 from pg_type where typname = 'pot_privacy_mode') then
 create type public.pot_privacy_mode as enum ('standard', 'blind_to_owner');
 end if;

 if not exists (select 1 from pg_type where typname = 'pot_status') then
 create type public.pot_status as enum ('draft', 'open', 'closed', 'completed');
 end if;

 if not exists (select 1 from pg_type where typname = 'pot_member_role') then
 create type public.pot_member_role as enum ('owner', 'participant');
 end if;

 if not exists (select 1 from pg_type where typname = 'contribution_status') then
 create type public.contribution_status as enum ('pending', 'confirmed', 'failed', 'refunded');
 end if;
end $$;

create or replace function public.generate_share_token()
returns text
language sql
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pots (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text,
  event_type public.pot_event_type not null,
  event_date date,
  currency text not null check (currency = upper(currency) and char_length(currency) = 3),
  goal_amount integer check (goal_amount is null or goal_amount > 0),
  privacy_mode public.pot_privacy_mode not null default 'standard',
  share_token text not null unique default public.generate_share_token(),
  status public.pot_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pot_members (
  pot_id uuid not null references public.pots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.pot_member_role not null default 'participant',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (pot_id, user_id)
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.pots(id) on delete cascade,
  contributor_user_id uuid references public.profiles(id) on delete set null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  amount integer not null check (amount > 0),
  currency text not null check (currency = upper(currency) and char_length(currency) = 3),
  status public.contribution_status not null default 'pending',
  contributor_display_name text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, pot_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.pots(id) on delete cascade,
  contributor_user_id uuid references public.profiles(id) on delete set null,
  contribution_id uuid references public.contributions(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  author_display_name text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

comment on column public.pots.goal_amount is 'Stored in minor currency units (for example cents).';
comment on column public.contributions.amount is 'Stored in minor currency units (for example cents).';

create index if not exists pots_owner_user_id_idx on public.pots (owner_user_id);
create index if not exists pots_status_created_at_idx on public.pots (status, created_at desc);
create index if not exists pot_members_user_id_idx on public.pot_members (user_id);
create unique index if not exists pot_members_single_owner_idx
  on public.pot_members (pot_id)
  where role = 'owner';
create index if not exists contributions_pot_status_idx on public.contributions (pot_id, status);
create index if not exists contributions_confirmed_only_idx
  on public.contributions (pot_id, created_at desc)
  where status = 'confirmed';
create index if not exists contributions_contributor_user_id_idx on public.contributions (contributor_user_id);
create index if not exists messages_pot_created_at_idx on public.messages (pot_id, created_at desc);
create index if not exists messages_contribution_id_idx on public.messages (contribution_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists set_pots_updated_at on public.pots;
create trigger set_pots_updated_at
before update on public.pots
for each row
execute function public.touch_updated_at();

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_profile();

insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

create or replace function public.sync_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pot_members (pot_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (pot_id, user_id) do update set role = excluded.role;

  return new;
end;
$$;

drop trigger if exists sync_owner_membership_on_pot on public.pots;
create trigger sync_owner_membership_on_pot
after insert on public.pots
for each row
execute function public.sync_owner_membership();

alter table public.profiles enable row level security;
alter table public.pots enable row level security;
alter table public.pot_members enable row level security;
alter table public.contributions enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "pots_select_owner" on public.pots;
create policy "pots_select_owner"
on public.pots
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "pots_insert_owner" on public.pots;
create policy "pots_insert_owner"
on public.pots
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists "pots_update_owner" on public.pots;
create policy "pots_update_owner"
on public.pots
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "pots_delete_owner" on public.pots;
create policy "pots_delete_owner"
on public.pots
for delete
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "pot_members_select_owner_and_self" on public.pot_members;
create policy "pot_members_select_owner_and_self"
on public.pot_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pots p
    where p.id = pot_members.pot_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "pot_members_insert_owner" on public.pot_members;
create policy "pot_members_insert_owner"
on public.pot_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pots p
    where p.id = pot_members.pot_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "pot_members_update_owner" on public.pot_members;
create policy "pot_members_update_owner"
on public.pot_members
for update
to authenticated
using (
  exists (
    select 1
    from public.pots p
    where p.id = pot_members.pot_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pots p
    where p.id = pot_members.pot_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "pot_members_delete_owner" on public.pot_members;
create policy "pot_members_delete_owner"
on public.pot_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.pots p
    where p.id = pot_members.pot_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "contributions_select_owner_when_standard" on public.contributions;
create policy "contributions_select_owner_when_standard"
on public.contributions
for select
to authenticated
using (
 
 exists (
    select 1
    from public.pots p
    where p.id = contributions.pot_id
      and p.owner_user_id = auth.uid()
      and p.privacy_mode = 'standard'
  )
);

drop policy if exists "messages_select_owner" on public.messages;
create policy "messages_select_owner"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.pots p
    where p.id = messages.pot_id
      and p.owner_user_id = auth.uid()
  )
);

create or replace function public.list_my_pots()
returns table (
  id uuid,
  title text,
  event_type public.pot_event_type,
  privacy_mode public.pot_privacy_mode,
  status public.pot_status,
  currency text,
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
    p.event_type,
    p.privacy_mode,
    p.status,
    p.currency,
    p.share_token,
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint as confirmed_total_amount,
    count(c.id) filter (where c.status = 'confirmed')::bigint as confirmed_contribution_count,
    p.created_at
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.owner_user_id = auth.uid()
  group by p.id
  order by p.created_at desc;
$$;

create or replace function public.get_public_pot_by_share_token(p_share_token text)
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
  status public.pot_status,
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
    p.status,
    coalesce(sum(c.amount) filter (where c.status = 'confirmed'), 0)::bigint as confirmed_total_amount,
    count(c.id) filter (where c.status = 'confirmed')::bigint as confirmed_contribution_count
  from public.pots p
  left join public.contributions c on c.pot_id = p.id
  where p.share_token = p_share_token
    and p.status in ('open', 'closed', 'completed')
  group by p.id;
$$;

grant execute on function public.list_my_pots() to authenticated;
grant execute on function public.get_public_pot_by_share_token(text) to anon, authenticated;


