-- 사용자 요청: 기구/성능개발 소요일은 모델별이 아니라 사양그룹별로 입력·적용한다.
-- 기존 모델에 입력되어 있던 값은 유실되지 않도록, 사양그룹당 모델이 1개뿐인
-- 현재 데이터 기준으로 그대로 옮겨 백필한다. (여러 모델이 서로 다른 값을 갖고
-- 있었다면 어느 값을 옮길지 알 수 없으므로, 이번 마이그레이션은 그 경우를
-- 가정하지 않는다 — 실행 전 직접 확인한 값 기준.)

alter table "03_spec_group" add column mechanical_dev_days integer;
alter table "03_spec_group" add column performance_dev_days integer;

update "03_spec_group" sg
set mechanical_dev_days = m.mechanical_dev_days,
    performance_dev_days = m.performance_dev_days
from "02_model" m
where m.spec_group_id = sg.id
  and sg.mechanical_dev_days is null;

-- 모델이 하나도 없는 사양그룹은 옮겨올 값이 없으므로 임시값 1로 채운다.
-- (마스터 관리 > 사양그룹 화면에서 실제 값으로 수정 필요)
update "03_spec_group"
set mechanical_dev_days = coalesce(mechanical_dev_days, 1),
    performance_dev_days = coalesce(performance_dev_days, 1);

alter table "03_spec_group" alter column mechanical_dev_days set not null;
alter table "03_spec_group" alter column performance_dev_days set not null;
alter table "03_spec_group" add constraint spec_group_mechanical_dev_days_check check (mechanical_dev_days > 0);
alter table "03_spec_group" add constraint spec_group_performance_dev_days_check check (performance_dev_days > 0);

alter table "02_model" drop column mechanical_dev_days;
alter table "02_model" drop column performance_dev_days;
