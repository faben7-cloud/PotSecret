alter table public.contributions
  add column if not exists message_body text,
  add column if not exists hint_level_1 text,
  add column if not exists hint_level_2 text,
  add column if not exists hint_level_3 text,
  add column if not exists mystery_mode boolean not null default false;

comment on column public.contributions.message_body is
'Optional contributor message stored directly on the contribution row for lightweight form submissions.';

comment on column public.contributions.hint_level_1 is
'Optional first identity hint for mystery mode experiences.';

comment on column public.contributions.hint_level_2 is
'Optional second identity hint for mystery mode experiences.';

comment on column public.contributions.hint_level_3 is
'Optional third identity hint for mystery mode experiences.';

comment on column public.contributions.mystery_mode is
'When true, the contribution is intended to be displayed in mystery mode with progressive hints.';
