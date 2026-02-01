import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getDbConnection } from '@/lib/db';
import Link from 'next/link';

// 동적 렌더링 강제 (캐시 방지)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPost {
  id: number;
  title: string;
  summary: string | null;
  thumbnailImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  isHomepageOnly?: boolean;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  let connection;
  try {
    connection = await getDbConnection();
    
    // published 상태의 포스트만 조회 (최신순 정렬)
    const [rows] = await connection.execute(
      `SELECT id, title, content, summary, thumbnail_image_url, status, 
              published_at, created_at, is_homepage_only
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY published_at DESC, created_at DESC
       LIMIT 20`
    );

    const posts = (rows as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      thumbnailImageUrl: row.thumbnail_image_url,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      isHomepageOnly: row.is_homepage_only === 1,
    }));

    return posts;
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    return [];
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px' }}>
            <h1 className="section-title" style={{ marginBottom: '24px' }}>블로그</h1>
            <p className="section-desc" style={{ marginBottom: '48px' }}>
              마인드 가든의 소식과 정보를 전달합니다.
            </p>

            {posts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: 'var(--text-sub)'
              }}>
                <p>아직 작성된 글이 없습니다.</p>
              </div>
            ) : (
              <div className="blog-grid">
                {posts.map((post: BlogPost) => (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.id}`}
                    className="blog-card"
                  >
                    {post.thumbnailImageUrl && (
                      <div className="blog-card-image">
                        <img 
                          src={post.thumbnailImageUrl} 
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
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

