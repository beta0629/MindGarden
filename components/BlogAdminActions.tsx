'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiService } from '@/lib/api';
import Link from 'next/link';

interface BlogAdminActionsProps {
  postId: number;
  postTitle: string;
}

export default function BlogAdminActions({ postId, postTitle }: BlogAdminActionsProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        setAuthenticated(data.authenticated);
      } catch (err) {
        setAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleDelete = async () => {
    if (!confirm(`"${postTitle}" 글을 정말 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const apiService = getApiService();
      await apiService.deleteBlogPost(postId);
      alert('글이 삭제되었습니다.');
      router.push('/blog');
    } catch (err) {
      alert('글 삭제에 실패했습니다.');
      console.error('Delete post error:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (authenticated === null || !authenticated) {
    return null;
  }

  return (
    <div style={{
      marginTop: '32px',
      padding: '20px',
      backgroundColor: 'var(--bg-pastel-1)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        marginBottom: '12px',
        color: 'var(--text-sub)'
      }}>
        관리자 메뉴
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link
          href={`/admin/blog/edit/${postId}`}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--accent-sky)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          수정
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fcc',
            color: '#c33',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: deleting ? 'not-allowed' : 'pointer',
            opacity: deleting ? 0.6 : 1
          }}
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
        <Link
          href="/admin/blog"
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: 'var(--text-sub)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          관리 목록
        </Link>
      </div>
    </div>
  );
}

