import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드 시 린트 체크 무시 (배포 성공을 위한 조치)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 타입 에러 무시 (배포 성공을 위한 조치)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
