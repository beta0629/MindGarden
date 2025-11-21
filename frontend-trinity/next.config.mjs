/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // CSP는 일단 제거하고 테스트 (토스페이먼츠 SDK 로드 확인 후 재적용)
  // async headers() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       headers: [
  //         {
  //           key: "Content-Security-Policy",
  //           value: [
  //             "default-src 'self'",
  //             "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com",
  //             "style-src 'self' 'unsafe-inline' data: blob:",
  //             "img-src 'self' data: https: blob:",
  //             "font-src 'self' data: https:",
  //             "connect-src 'self' https: wss: https://api.tosspayments.com",
  //             "media-src 'self' data: blob:",
  //             "object-src 'none'",
  //             "frame-ancestors 'none'",
  //             "base-uri 'self'",
  //             "form-action 'self'",
  //           ].join("; "),
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
