'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    blogPosts: 0,
    pendingConsultations: 0,
    activePopups: 0,
    activeBanners: 0,
  });

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadStats();
        } else {
          setAuthenticated(false);
          router.push('/admin/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setAuthenticated(false);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  // 통계 로드
  const loadStats = async () => {
    try {
      // 블로그 포스트 수 (관리자용: 모든 상태 포함)
      const blogResponse = await fetch('/api/blog/posts?limit=100&includeAllStatus=true');
      const blogData = await blogResponse.json();
      
      // 대기 중인 상담 문의 수
      const consultationResponse = await fetch('/api/consultation?status=pending');
      const consultationData = await consultationResponse.json();
      
      // 활성 팝업 수
      const popupResponse = await fetch('/api/popups');
      const popupData = await popupResponse.json();
      
      // 활성 배너 수
      const bannerResponse = await fetch('/api/banners');
      const bannerData = await bannerResponse.json();

      setStats({
        blogPosts: blogData.success && blogData.posts ? blogData.posts.length : (blogData.pagination?.total || 0),
        pendingConsultations: consultationData.success && consultationData.inquiries ? consultationData.inquiries.length : 0,
        activePopups: popupData.success && popupData.popup ? 1 : 0,
        activeBanners: bannerData.success && bannerData.banners ? bannerData.banners.length : 0,
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch('/api/blog/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authenticated === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const menuItems = [
    {
      title: '블로그 관리',
      description: '블로그 글 작성, 수정, 삭제',
      href: '/admin/blog',
      icon: '📝',
      color: '#3b82f6',
    },
    {
      title: '상담 문의 관리',
      description: '상담 예약 확인 및 관리',
      href: '/admin/consultation',
      icon: '💬',
      color: '#10b981',
      badge: stats.pendingConsultations > 0 ? stats.pendingConsultations : undefined,
    },
    {
      title: '팝업 관리',
      description: '팝업 창 설정 및 관리',
      href: '/admin/popups',
      icon: '🔔',
      color: '#f59e0b',
    },
    {
      title: '배너 관리',
      description: '배너 설정 및 관리',
      href: '/admin/banners',
      icon: '📢',
      color: '#8b5cf6',
    },
    {
      title: '갤러리 관리',
      description: '갤러리 이미지 관리',
      href: '/admin/gallery',
      icon: '🖼️',
      color: '#ec4899',
    },
    {
      title: '히어로 비디오 관리',
      description: '메인 페이지 비디오 관리',
      href: '/admin/videos',
      icon: '🎬',
      color: '#06b6d4',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              관리자 대시보드
            </h1>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>블로그 글</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.blogPosts}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>대기 중인 상담</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.pendingConsultations}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>활성 팝업</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.activePopups}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>활성 배너</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{stats.activeBanners}</div>
          </div>
        </div>

        {/* 메뉴 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'all 0.2s',
                border: '2px solid transparent',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  {item.badge}
                </span>
              )}
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
