-- Supabase Table Editor 왼쪽 목록은 항상 알파벳순으로 고정 정렬되고 수동으로
-- 순서를 바꿀 수 없다. 대시보드에서 보기 좋게 원하는 순서(설정 → 마스터 → 모델
-- → 매핑 → 일정 결과)로 보이도록 테이블 이름 앞에 번호를 붙인다. (사용자 요청)

alter table app_setting rename to "00_app_setting";
alter table corporation rename to "01_corporation";
alter table spec_group rename to "02_spec_group";
alter table reliability_test rename to "03_reliability_test";
alter table shipping_destination rename to "04_shipping_destination";
alter table model rename to "05_model";
alter table model_test rename to "06_model_test";
alter table schedule_run rename to "07_schedule_run";
alter table schedule_result rename to "08_schedule_result";
