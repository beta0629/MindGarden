import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogPostView from '@/components/BlogPostView';
import { getApiService } from '@/lib/api';
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

export default async function BlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getBlogPost(params.id);

  if (!post) {
    notFound();
  }

  // 서버→클라이언트 직렬화 오류 방지: 순수 데이터만 전달
  const serializablePost = {
    id: post.id,
    title: post.title,
    content: post.content,
    summary: post.summary,
    thumbnailImageUrl: post.thumbnailImageUrl,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    isHomepageOnly: post.isHomepageOnly,
    images: post.images
      ? post.images.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          altText: img.altText,
          displayOrder: img.displayOrder,
        }))
      : undefined,
  };

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <BlogPostView post={serializablePost} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
