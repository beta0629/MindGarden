import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogAdminActions from '@/components/BlogAdminActions';
import { getApiService } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPost {
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

async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    const apiService = getApiService();
    const post = await apiService.getBlogPost(parseInt(id));
    return post;
  } catch (error) {
    console.error('Failed to load blog post:', error);
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <article className="blog-post" style={{ paddingTop: '120px', maxWidth: '800px', margin: '0 auto' }}>
            <Link 
              href="/blog" 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '2rem',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#B8956A',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A0825A';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#B8956A';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span>←</span>
              <span>블로그 목록으로</span>
            </Link>

            <header className="blog-post-header" style={{ marginBottom: '48px' }}>
              <h1 className="blog-post-title" style={{ 
                fontSize: '36px',
                fontWeight: '700',
                lineHeight: '1.4',
                marginBottom: '16px',
                color: 'var(--text-main)'
              }}>
                {post.title}
              </h1>
              
              {post.publishedAt && (
                <time 
                  dateTime={post.publishedAt}
                  style={{
                    display: 'block',
                    color: 'var(--text-sub)',
                    fontSize: '14px'
                  }}
                >
                  {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              )}
            </header>

            {post.thumbnailImageUrl && (
              <div className="blog-post-thumbnail" style={{ 
                marginBottom: '48px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <img 
                  src={post.thumbnailImageUrl} 
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>
            )}

            <div 
              className="blog-post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: 'var(--text-main)'
              }}
            />

            {post.images && post.images.length > 0 && (
              <div className="blog-post-images" style={{ marginTop: '48px' }}>
                {post.images
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((image) => (
                    <div 
                      key={image.id}
                      style={{
                        marginBottom: '32px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                      }}
                    >
                      <img 
                        src={image.imageUrl} 
                        alt={image.altText || post.title}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}

            <BlogAdminActions postId={post.id} postTitle={post.title} />

            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-soft)' }}>
              <Link 
                href="/blog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#B8956A',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A0825A';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8956A';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <span>←</span>
                <span>블로그 목록으로</span>
              </Link>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  );
}

