'use client';

import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';

export interface BlogCardPost {
  id: number;
  title: string;
  summary: string | null;
  thumbnailImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  isHomepageOnly?: boolean;
}

interface BlogCardProps {
  post: BlogCardPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const thumb = resolveMediaUrl(post.thumbnailImageUrl);
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Link href={`/blog/${post.id}`} className="blog-card">
      {thumb && (
        <div className="blog-card-image">
          <img
            src={thumb}
            alt={post.title}
            loading="lazy"
          />
        </div>
      )}
      <div className="blog-card-content">
        <h3 className="blog-card-title">{post.title}</h3>
        {post.summary && (
          <p className="blog-card-summary">{post.summary}</p>
        )}
        <div className="blog-card-meta">
          {dateLabel && <time dateTime={post.publishedAt!}>{dateLabel}</time>}
        </div>
      </div>
    </Link>
  );
}
