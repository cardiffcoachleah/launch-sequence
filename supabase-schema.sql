-- Launch Sequence Database Schema
-- Run this in your Supabase SQL editor

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Briefings (onboarding context)
create table public.briefings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null,
  company_stage text not null,
  team_situation text not null,
  reporting_to text not null,
  team_size text not null,
  start_date date not null,
  biggest_concern text,
  what_success_looks_like text,
  created_at timestamptz default now()
);

alter table public.briefings enable row level security;

create policy "Users can manage own briefings"
  on public.briefings for all
  using (auth.uid() = user_id);

-- Plans (generated flight plans)
create table public.plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  briefing_id uuid references public.briefings(id) on delete cascade not null,
  plan_data jsonb not null,
  created_at timestamptz default now()
);

alter table public.plans enable row level security;

create policy "Users can manage own plans"
  on public.plans for all
  using (auth.uid() = user_id);

-- Systems Checks (wellbeing check-ins) — Phase 2
create table public.systems_checks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  energy_level integer not null check (energy_level between 1 and 4),
  weighing_on_you text,
  went_well text,
  ai_response text,
  created_at timestamptz default now()
);

alter table public.systems_checks enable row level security;

create policy "Users can manage own checks"
  on public.systems_checks for all
  using (auth.uid() = user_id);

-- Captain's Log (reflections) — Phase 2
create table public.captains_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  phase text not null,
  prompt text,
  entry text not null,
  created_at timestamptz default now()
);

alter table public.captains_log enable row level security;

create policy "Users can manage own log entries"
  on public.captains_log for all
  using (auth.uid() = user_id);
