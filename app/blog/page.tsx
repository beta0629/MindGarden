import Image from 'next/image';
import { SiteShell } from '@/components/layout/SiteShell';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { getLatestBlogPosts } from '@/lib/feeds';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: '블로그',
  description: '마인드가든 공식 블로그의 최근 글입니다.',
  path: '/blog',
});

export default async function BlogPage() {
  const posts = await getLatestBlogPosts(6);

  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          블로그
          <ConfirmNeeded />
        </h1>
        <p>마인드가든 공식 블로그의 최근 글입니다.</p>
        <a
          className="text-link"
          href={SITE.blogUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          블로그 전체 보기 ↗
        </a>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container media-grid">
          {posts.map((post) => (
            <a
              key={post.url}
              className="news-card"
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="news-card__media">
                {post.thumb ? (
                  <Image
                    src={post.thumb}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="placeholder-media" style={{ minHeight: '100%' }}>
                    <div className="placeholder-media__label">제목 카드</div>
                  </div>
                )}
              </div>
              <strong>{post.title}</strong>
              <time className="muted" dateTime={post.date}>
                {post.date}
              </time>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
