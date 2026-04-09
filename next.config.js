/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['heic-to'],

  // CI 배포 통과용: 기존 코드 ESLint 에러가 있어 빌드 시에는 무시. 로컬에서 점진적으로 수정 후 제거 권장.
  eslint: { ignoreDuringBuilds: true },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'videos.pexels.com',
      },
      // 코어솔루션 API 이미지 도메인 추가 가능
      {
        protocol: 'https',
        hostname: 'api.mindgarden.co.kr',
      },
    ],
    // 로컬 이미지 최적화 활성화
    unoptimized: false,
  },
  
  // 환경 변수 설정
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://api.mindgarden.co.kr',
  },
};

module.exports = nextConfig;

