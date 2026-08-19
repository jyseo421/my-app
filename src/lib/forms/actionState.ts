// useActionState와 함께 쓰는 서버 액션들의 공통 반환 타입.
// error/ok를 모두 선택적으로 둬야 초기값({})이 타입에 맞고, useActionState의
// 오버로드 추론(2번째 인자 payload 유무 판단)도 애매해지지 않는다.
export type ActionState = {
  error?: string;
  ok?: boolean;
};
