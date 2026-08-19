-- 비밀번호 게이트용 설정 테이블 (이전 작업에서 이미 실제 DB에 적용됨, 기록용으로 보관)
create table if not exists app_setting (
  id boolean primary key default true,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint app_setting_singleton check (id)
);

alter table app_setting enable row level security;
