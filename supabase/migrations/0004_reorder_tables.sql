-- 대시보드 테이블 목록 순서를 다시 조정 (사용자 요청).
-- 02_model / 03_spec_group / 05_reliability_test 세 개만 번호가 바뀌므로
-- 이름 충돌을 피하려고 임시 이름을 한 번 거쳐서 순서를 맞바꾼다.

alter table "02_spec_group" rename to "tmp_spec_group";
alter table "05_model" rename to "02_model";
alter table "03_reliability_test" rename to "05_reliability_test";
alter table "tmp_spec_group" rename to "03_spec_group";
