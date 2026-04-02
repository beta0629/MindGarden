'use client';

import Link from 'next/link';
import BlogAdminActions from '@/components/BlogAdminActions';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';

export interface BlogPostViewPost {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  thumbnailImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  isHomepageOnly?: boolean;
  images?: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    displayOrder: number;
  }>;
}

interface BlogPostViewProps {
  post: BlogPostViewPost;
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  const thumb = resolveMediaUrl(post.thumbnailImageUrl);
  const sortedImages = post.images
    ? [...post.images].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  return (
    <article
      className="blog-post"
      style={{ paddingTop: '120px', maxWidth: '800px', margin: '0 auto' }}
    >
      <Link href="/blog" className="blog-back-link">
        <span>←</span>
        <span>블로그 목록으로</span>
      </Link>

      <header
        className="blog-post-header"
        style={{ marginBottom: '48px' }}
      >
        <h1
          className="blog-post-title"
          style={{
            fontSize: '36px',
            fontWeight: '700',
            lineHeight: '1.4',
            marginBottom: '16px',
            color: 'var(--text-main)',
          }}
        >
          {post.title}
        </h1>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            style={{
              display: 'block',
              color: 'var(--text-sub)',
              fontSize: '14px',
            }}
          >
            {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}
      </header>

      {thumb && (
        <div
          className="blog-post-thumbnail"
          style={{
            marginBottom: '48px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <img
            src={thumb}
            alt={post.title}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      )}

      <div
        className="blog-post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{
          fontSize: '16px',
          lineHeight: '1.8',
          color: 'var(--text-main)',
        }}
      />

      {sortedImages.length > 0 && (
        <div className="blog-post-images" style={{ marginTop: '48px' }}>
          {sortedImages.map((image) => (
            <div
              key={image.id}
              style={{
                marginBottom: '32px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <img
                src={resolveMediaUrl(image.imageUrl) ?? image.imageUrl}
                alt={image.altText || post.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}

      <BlogAdminActions postId={post.id} postTitle={post.title} />

      <div
        style={{
          marginTop: '32px',
          paddingTop: '32px',
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <Link
          href="/blog"
          className="blog-back-link blog-back-link-bottom"
        >
          <span>←</span>
          <span>블로그 목록으로</span>
        </Link>
      </div>
    </article>
  );
}
