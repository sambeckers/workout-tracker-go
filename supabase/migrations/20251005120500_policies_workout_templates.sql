-- Security & RLS policies for workout_templates

alter table workout_templates enable row level security;
alter table workout_template_exercises enable row level security;

-- Allow owners full access
create policy "own templates select" on workout_templates
  for select using (auth.uid() = user_id);
create policy "own templates insert" on workout_templates
  for insert with check (auth.uid() = user_id);
create policy "own templates update" on workout_templates
  for update using (auth.uid() = user_id);
create policy "own templates delete" on workout_templates
  for delete using (auth.uid() = user_id);

create policy "own template exercises select" on workout_template_exercises
  for select using (
    exists (select 1 from workout_templates t where t.template_id = workout_template_exercises.template_id and t.user_id = auth.uid())
  );
create policy "own template exercises insert" on workout_template_exercises
  for insert with check (
    exists (select 1 from workout_templates t where t.template_id = workout_template_exercises.template_id and t.user_id = auth.uid())
  );
create policy "own template exercises update" on workout_template_exercises
  for update using (
    exists (select 1 from workout_templates t where t.template_id = workout_template_exercises.template_id and t.user_id = auth.uid())
  );
create policy "own template exercises delete" on workout_template_exercises
  for delete using (
    exists (select 1 from workout_templates t where t.template_id = workout_template_exercises.template_id and t.user_id = auth.uid())
  );
