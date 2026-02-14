'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogPostView from '@/components/BlogPostView';
import type { BlogPostViewPost } from '@/components/BlogPostView';

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [post, setPost] = useState<BlogPostViewPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) {
      setFailed(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`/api/blog/posts/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) setFailed(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data?.id) {
          const p: BlogPostViewPost = {
            id: data.id,
            title: data.title,
            content: data.content ?? '',
            summary: data.summary ?? null,
            thumbnailImageUrl: data.thumbnailImageUrl ?? null,
            publishedAt: data.publishedAt ?? null,
            createdAt: data.createdAt ?? '',
            isHomepageOnly: data.isHomepageOnly,
            images: Array.isArray(data.images) ? data.images : undefined,
          };
          setPost(p);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (failed || (!loading && !post)) {
    notFound();
  }

  if (loading || !post) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <div
              className="blog-post"
              style={{
                paddingTop: '120px',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center',
                color: 'var(--text-sub)',
              }}
            >
              로딩 중...
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <BlogPostView post={post} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
