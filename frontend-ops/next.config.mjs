const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "accelerometer=(), autoplay=(), camera=(), microphone=(), geolocation=()"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 환경(CI/CD)에서는 정적 export, 로컬 개발에서는 middleware 사용
  output: process.env.BUILD_STANDALONE === "true" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  async rewrites() {
    // 로컬 개발 환경에서만 rewrites 사용 (정적 export에서는 지원 안 됨)
    if (process.env.BUILD_STANDALONE === "true") {
      return [];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8081/api/v1/:path*'
      }
    ];
  }
};

export default nextConfig;
