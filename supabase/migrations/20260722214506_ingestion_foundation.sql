-- App V360 / Diamond League - ingestion foundation

create extension if not exists pgcrypto;

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  triggered_by text not null default 'system',
  total_jobs integer not null default 0 check (total_jobs >= 0),
  successful_jobs integer not null default 0 check (successful_jobs >= 0),
  failed_jobs integer not null default 0 check (failed_jobs >= 0),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ingestion_runs(id) on delete set null,
  job_type text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','success','temporary_error','permanent_error','needs_review')),
  priority integer not null default 100,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_until timestamptz,
  locked_by text,
  last_error_code text,
  last_error_message text,
  source_url text,
  parser_version text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_attempts (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.ingestion_jobs(id) on delete cascade,
  run_id uuid references public.ingestion_runs(id) on delete set null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('success','temporary_error','permanent_error','needs_review')),
  http_status integer,
  error_code text,
  error_message text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (job_id, attempt_number)
);

create table public.data_issues (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  issue_type text not null,
  severity text not null default 'warning' check (severity in ('info','warning','error','critical')),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  details jsonb not null default '{}'::jsonb,
  source_url text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index ingestion_jobs_active_dedupe_idx on public.ingestion_jobs (job_type, entity_type, entity_id) where status in ('pending','processing','temporary_error');
create index ingestion_jobs_claim_idx on public.ingestion_jobs (priority, next_attempt_at, created_at) where status in ('pending','temporary_error');
create index ingestion_jobs_lock_idx on public.ingestion_jobs (locked_until) where status = 'processing';
create index ingestion_jobs_run_idx on public.ingestion_jobs (run_id);
create index ingestion_attempts_job_idx on public.ingestion_attempts (job_id, attempt_number desc);
create index data_issues_open_idx on public.data_issues (severity, detected_at desc) where status in ('open','reviewing');

create or replace function public.ingestion_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingestion_jobs_set_updated_at before update on public.ingestion_jobs for each row execute function public.ingestion_set_updated_at();
create trigger data_issues_set_updated_at before update on public.data_issues for each row execute function public.ingestion_set_updated_at();

create or replace function public.claim_ingestion_jobs(p_worker_id text, p_limit integer default 10, p_lock_seconds integer default 240)
returns setof public.ingestion_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id
    from public.ingestion_jobs
    where (
          (status in ('pending','temporary_error') and next_attempt_at <= now())
          or (status = 'processing' and locked_until < now())
        )
      and attempt_count < max_attempts
    order by priority asc, next_attempt_at asc, created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 100))
  )
  update public.ingestion_jobs j
  set status = 'processing',
      locked_at = now(),
      locked_until = now() + make_interval(secs => greatest(30, coalesce(p_lock_seconds, 240))),
      locked_by = p_worker_id,
      attempt_count = j.attempt_count + 1,
      updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;

revoke all on function public.claim_ingestion_jobs(text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ingestion_jobs(text, integer, integer) to service_role;

alter table public.ingestion_runs enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.ingestion_attempts enable row level security;
alter table public.data_issues enable row level security;

comment on table public.ingestion_jobs is 'Durable relational queue for automated ingestion jobs.';
comment on function public.claim_ingestion_jobs(text, integer, integer) is 'Atomically claims eligible jobs using row locks and SKIP LOCKED.';
