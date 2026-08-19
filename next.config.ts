import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // next dev가 CLAUDE.md에 자체 안내 블록을 자동 추가하는 기능을 끔
  // (이 프로젝트의 CLAUDE.md는 프로젝트 규칙서로 직접 관리하므로 덮어써지면 안 됨)
  agentRules: false,
};

export default nextConfig;
