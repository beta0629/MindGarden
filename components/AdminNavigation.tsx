'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavigation() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: '관리자 홈' },
    { href: '/admin/blog', label: '칼럼 관리' },
    { href: '/admin/consultation', label: '상담 문의 관리' },
    { href: '/admin/popups', label: '팝업 관리' },
    { href: '/admin/banners', label: '배너 관리' },
    { href: '/admin/gallery', label: '갤러리 관리' },
    { href: '/admin/videos', label: '히어로 비디오 관리' },
    { href: '/admin/reviews', label: '후기 관리' },
    { href: '/admin/counselors', label: '상담사 관리' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isActive ? '#3b82f6' : '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#6b7280';
              }
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
