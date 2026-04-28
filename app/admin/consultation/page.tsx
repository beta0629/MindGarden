'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
import ConsultationNotifyEmailsCard from '@/components/admin/ConsultationNotifyEmailsCard';

interface ConsultationInquiry {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  preferredContactMethod: string;
  inquiryType: string;
  referralSource: string | null;
  message: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  tags: string[]; // 해시태그 배열 추가
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function ConsultationAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [inquiries, setInquiries] = useState<ConsultationInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadInquiries();
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

  // 상담 문의 목록 로드
  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = statusFilter === 'all' 
        ? '/api/consultation'
        : `/api/consultation?status=${statusFilter}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        setError(`서버 오류 (${response.status}): ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.success) {
        setInquiries(data.inquiries || []);
      } else {
        console.error('API returned error:', data);
        setError(data.error || '상담 문의 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Load inquiries error:', err);
      setError(err.message || '상담 문의 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태 필터 변경 시
  useEffect(() => {
    if (authenticated) {
      loadInquiries();
    }
  }, [statusFilter, authenticated]);

  // 상태 업데이트
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/consultation/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        loadInquiries(); // 목록 새로고침
      } else {
        alert(data.error || '상태 업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 상태 한글 변환
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '대기 중',
      contacted: '연락 완료',
      completed: '완료',
      cancelled: '취소',
    };
    return labels[status] || status;
  };

  // 선호 연락 방법 한글 변환
  const getContactMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      phone: '전화',
      email: '이메일',
      kakao: '카카오톡',
    };
    return labels[method] || method;
  };

  // 문의 유형 한글 변환
  const getInquiryTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      general: '일반 상담',
      adhd: 'ADHD 개인 상담',
      coaching: '코칭(실행 전략)',
      family: '가족/부모 상담',
    };
    return labels[type] || type;
  };

  // 희망 시간 한글 변환
  const getPreferredTimeLabel = (time: string) => {
    const labels: { [key: string]: string } = {
      morning: '오전',
      afternoon: '오후',
      evening: '저녁',
    };
    return labels[time] || time;
  };

  // 유입 경로 한글 변환
  const getReferralSourceLabel = (source: string | null) => {
    if (!source) return '미입력';
    const labels: { [key: string]: string } = {
      homepage: '홈페이지',
      search_google: '검색엔진 (구글)',
      search_naver: '검색엔진 (네이버)',
      sns_instagram: 'SNS (인스타그램)',
      sns_facebook: 'SNS (페이스북)',
      sns_kakao: 'SNS (카카오톡)',
      blog: '블로그',
      mom_cafe: '맘카페',
      referral: '지인 소개',
      other: '기타',
    };
    return labels[source] || source;
  };

  // 날짜 포맷팅 (가독성 있게)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      // ISO 형식 또는 다른 형식의 날짜를 파싱
      const date = new Date(dateString);
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return dateString; // 파싱 실패 시 원본 반환
      }
      
      // 한국어 형식으로 변환 (예: 2026년 2월 2일)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString; // 에러 발생 시 원본 반환
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#f59e0b',
      contacted: '#3b82f6',
      completed: '#598e3e',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (authenticated === null || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
              상담 문의 관리
            </h1>
            <AdminNavigation />
          </div>

          <ConsultationNotifyEmailsCard />

          {/* 상태 필터 */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['all', 'pending', 'contacted', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: statusFilter === status ? '#3b82f6' : 'white',
                  color: statusFilter === status ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: statusFilter === status ? '600' : '400',
                }}
              >
                {status === 'all' ? '전체' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* 상담 문의 목록 */}
        {inquiries.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              {statusFilter === 'all' ? '등록된 상담 문의가 없습니다.' : `${getStatusLabel(statusFilter)} 상태의 문의가 없습니다.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        {inquiry.name}
                      </h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: getStatusColor(inquiry.status),
                          color: 'white',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>전화 {inquiry.phone}</span>
                      {inquiry.email && <span>✉️ {inquiry.email}</span>}
                      <span>접수 {new Date(inquiry.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={inquiry.status}
                      onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="pending">대기 중</option>
                      <option value="contacted">연락 완료</option>
                      <option value="completed">완료</option>
                      <option value="cancelled">취소</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <strong style={{ color: '#374151' }}>선호 연락 방법:</strong>
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        {getContactMethodLabel(inquiry.preferredContactMethod)}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>문의 유형:</strong>
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        {getInquiryTypeLabel(inquiry.inquiryType)}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#374151' }}>유입 경로:</strong>
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        {getReferralSourceLabel(inquiry.referralSource)}
                      </span>
                    </div>
                    {inquiry.preferredDate && (
                      <div>
                        <strong style={{ color: '#374151' }}>희망 일자:</strong>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                          {formatDate(inquiry.preferredDate)}
                        </span>
                      </div>
                    )}
                    {inquiry.preferredTime && (
                      <div>
                        <strong style={{ color: '#374151' }}>희망 시간:</strong>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                          {getPreferredTimeLabel(inquiry.preferredTime)}
                        </span>
                      </div>
                    )}
                    {inquiry.tags && inquiry.tags.length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong style={{ color: '#374151' }}>선택한 항목:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {inquiry.tags.map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                backgroundColor: '#A8D5BA',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {inquiry.message && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                      <strong style={{ color: '#374151', display: 'block', marginBottom: '0.5rem' }}>문의 내용:</strong>
                      <p style={{ color: '#6b7280', margin: 0, whiteSpace: 'pre-wrap' }}>{inquiry.message}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
