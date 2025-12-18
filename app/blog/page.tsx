import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getApiService } from '@/lib/api';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  summary: string | null;
  thumbnailImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  isHomepageOnly?: boolean;
}

async function getBlogPosts() {
  try {
    const apiService = getApiService();
    const posts = await apiService.getBlogPosts(1, 20);
    return posts;
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    return [];
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

