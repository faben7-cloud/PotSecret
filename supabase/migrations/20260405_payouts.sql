create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.pots(id) on delete cascade,
  gross_amount integer not null check (gross_amount >= 0),
  commission_amount integer not null check (commission_amount >= 0),
  net_amount integer not null check (net_amount >= 0),
  status text not null default 'paid' check (status in ('paid')),
  paid_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  check (gross_amount = commission_amount + net_amount)
);

comment on table public.payouts is
'Tracks beneficiary payouts made from confirmed pot contributions.';

comment on column public.payouts.gross_amount is
'Stored in minor currency units. Represents the gross confirmed pot amount included in this payout.';

comment on column public.payouts.commission_amount is
'Stored in minor currency units. Represents the 4% platform commission retained at payout time.';

comment on column public.payouts.net_amount is
'Stored in minor currency units. Represents the net amount effectively paid to the beneficiary.';

create index if not exists payouts_pot_paid_at_idx on public.payouts (pot_id, paid_at desc);

alter table public.payouts enable row level security;

drop policy if exists "payouts_select_owner" on public.payouts;
create policy "payouts_select_owner"
on public.payouts
for select
to authenticated
using (
  exists (
    select 1
    from public.pots p
    where p.id = payouts.pot_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists "payouts_insert_owner" on public.payouts;
create policy "payouts_insert_owner"
on public.payouts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pots p
    where p.id = payouts.pot_id
      and p.owner_user_id = auth.uid()
  )
);
