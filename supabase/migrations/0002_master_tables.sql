-- PLAN.md 4번: 법인/사양그룹/신뢰성 시험/출향지·규격 마스터, 모델, 모델-시험 매핑,
-- 일정 계산 결과(schedule_run/schedule_result) 테이블. 모두 서버(service role)에서만
-- 접근하므로 RLS는 켜두고 별도 정책은 추가하지 않는다.

create extension if not exists pgcrypto;

-- 법인: 법인명, 주간 Capa(그 법인 소속 모델이 한 주에 완료될 수 있는 최대 개수)
create table if not exists corporation (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  weekly_capa integer not null check (weekly_capa > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table corporation enable row level security;

-- 사양그룹: 그룹명, 기구/성능개발 진행 방식(병렬/직렬),
-- Capa 초과 시 1차 정렬 기준이 되는 우선순위(낮을수록 우선)
create table if not exists spec_group (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  dev_mode text not null check (dev_mode in ('parallel', 'serial')),
  priority integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table spec_group enable row level security;

-- 신뢰성 시험 마스터: 항목별 소요시간(일)과 병렬/직렬 여부
create table if not exists reliability_test (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  duration_days integer not null check (duration_days > 0),
  execution_mode text not null check (execution_mode in ('parallel', 'serial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table reliability_test enable row level security;

-- 출향지·규격 마스터: 출향지별 규격취득 소요시간(주),
-- Capa 초과 시 2차(동일 그룹 내) 정렬 기준이 되는 우선순위(낮을수록 우선)
create table if not exists shipping_destination (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  priority integer not null unique,
  certification_weeks integer not null check (certification_weeks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table shipping_destination enable row level security;

-- 모델: 그룹/출향지/법인은 필수, 기구·성능개발 소요시간(일)은 모델별 직접 입력값
create table if not exists model (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  spec_group_id uuid not null references spec_group(id),
  shipping_destination_id uuid not null references shipping_destination(id),
  corporation_id uuid not null references corporation(id),
  mechanical_dev_days integer not null check (mechanical_dev_days > 0),
  performance_dev_days integer not null check (performance_dev_days > 0),
  certification_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists model_spec_group_idx on model (spec_group_id);
create index if not exists model_shipping_destination_idx on model (shipping_destination_id);
create index if not exists model_corporation_idx on model (corporation_id);
alter table model enable row level security;

-- 모델-시험 매핑: 기본키(model_id, test_id) 자체가 동일 항목 중복 입력을 막아준다
create table if not exists model_test (
  model_id uuid not null references model (id) on delete cascade,
  test_id uuid not null references reliability_test (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (model_id, test_id)
);
alter table model_test enable row level security;

-- 일정 계산 실행(run) 이력: 실행할 때마다 한 행씩 쌓여 이전/이후 비교 기준이 된다
create table if not exists schedule_run (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  created_at timestamptz not null default now()
);
alter table schedule_run enable row level security;

-- 일정 계산 결과: run 1건 x 모델 1건 = 1행. 완료일과 완료 주(월요일 시작 기준)까지 저장
create table if not exists schedule_result (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references schedule_run (id) on delete cascade,
  model_id uuid not null references model (id) on delete cascade,
  mechanical_start date not null,
  mechanical_end date not null,
  performance_start date not null,
  performance_end date not null,
  reliability_test_end date not null,
  certification_end date,
  completion_date date not null,
  completion_week date not null,
  created_at timestamptz not null default now()
);
create index if not exists schedule_result_run_idx on schedule_result (run_id);
create index if not exists schedule_result_model_idx on schedule_result (model_id);
alter table schedule_result enable row level security;
