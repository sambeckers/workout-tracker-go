-- Migration: create workout templates and related table
-- Creates tables: workout_templates, workout_template_exercises
-- Assumes existing users, exercises tables

create table if not exists workout_templates (
  template_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_name text not null,
  notes text,
  use_count integer not null default 0,
  last_used timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workout_template_exercises (
  id bigserial primary key,
  template_id uuid not null references workout_templates(template_id) on delete cascade,
  exercise_id uuid not null references exercises(exercise_id) on delete cascade,
  exercise_order integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_templates_user on workout_templates(user_id);
create index if not exists idx_workout_template_exs_template on workout_template_exercises(template_id);
create index if not exists idx_workout_template_exs_order on workout_template_exercises(template_id, exercise_order);

-- Updated at trigger
create or replace function trg_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_workout_templates on workout_templates;
create trigger set_timestamp_workout_templates
before update on workout_templates
for each row execute function trg_set_timestamp();
