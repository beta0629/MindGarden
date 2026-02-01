// 카카오톡 공식 로고 SVG 아이콘
export default function KakaoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C6.48 3 2 6.48 2 11c0 2.84 1.95 5.43 4.78 6.78L6 21l3.22-2.78C10.07 18.43 11.01 18.5 12 18.5c5.52 0 10-3.48 10-7.5S17.52 3 12 3z"
        fill="currentColor"
      />
    </svg>
  );
}
