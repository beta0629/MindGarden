import Link from 'next/link';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import HomeAboutSection from '@/components/HomeAboutSection';
import HomeSectionVisual from '@/components/HomeSectionVisual';
import GalleryMarquee from '@/components/GalleryMarquee';
import ReviewsList from '@/components/ReviewsList';
import Footer from '@/components/Footer';
import HomeScreeningPromo from '@/components/HomeScreeningPromo';
import SectionTabs from '@/components/SectionTabs';
import HashScroll from '@/components/HashScroll';
import { getApiService } from '@/lib/api';
import { getDbConnection } from '@/lib/db';
import { homeSectionImages } from '@/lib/home-section-images';
import { FALLBACK_GALLERY_IMAGES } from '@/lib/site-fallback-visuals';
import { PROGRAM_PAGE_ORDER, programPageContent } from '@/lib/program-pages-content';

// 동적 렌더링 강제 (갤러리 이미지가 실시간으로 변경될 수 있으므로)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 갤러리 이미지 조회 (서버 사이드에서 직접 DB 조회)
async function getGalleryImages() {
  let connection;
  try {
    connection = await getDbConnection();
    
    const [rows] = await connection.execute(
      `SELECT id, image_url, alt_text, category 
       FROM gallery_images
       WHERE is_active = 1
       ORDER BY display_order ASC, created_at ASC`
    );

    const images = (rows as any[]).map((row: any) => ({
      id: row.id,
      url: row.image_url,
      alt: row.alt_text || '갤러리 이미지',
      category: row.category || '기타',
    }));

    console.log('Gallery images loaded:', images.length, images);
    return images.length > 0 ? images : null;
  } catch (error) {
    console.error('Failed to load gallery images:', error);
    return null;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 활성 히어로 비디오 조회 (DB에서 직접 조회)
async function getHeroVideo() {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT video_url, poster_url
       FROM hero_videos
       WHERE is_active = 1
       ORDER BY display_order ASC, created_at DESC
       LIMIT 1`
    );

    const videos = rows as any[];
    if (videos.length === 0) {
      // DB에 비디오가 없으면 기본 비디오 경로 반환
      return '/assets/videos/hero-video.mp4';
    }

    return videos[0].video_url;
  } catch (error) {
    console.error('Failed to load hero video:', error);
    // 에러 발생 시에도 기본 비디오 경로 반환
    return '/assets/videos/hero-video.mp4';
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 후기 목록 조회 (전체 후기)
async function getReviews() {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute(
      `SELECT id, author_name, content, tags, ratings, like_count, created_at, updated_at
       FROM homepage_reviews
       WHERE is_approved = 1
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const reviews = (rows as any[]).map((row: any) => {
      let tags = [];
      let ratings = null;
      
      try {
        tags = row.tags ? JSON.parse(row.tags) : [];
      } catch (e) {
        tags = [];
      }
      
      try {
        ratings = row.ratings ? JSON.parse(row.ratings) : null;
      } catch (e) {
        ratings = null;
      }
      
      return {
        id: row.id,
        authorName: row.author_name,
        content: row.content,
        tags,
        ratings,
        likeCount: row.like_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return reviews;
  } catch (error) {
    console.error('Failed to load reviews:', error);
    return [];
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 서버 컴포넌트에서 데이터 가져오기
async function getHomeData() {
  try {
    const apiService = getApiService();
    const homeData = await apiService.getHomeData();
    
    // 히어로 비디오 조회 (DB에서 직접 조회)
    const videoUrl = await getHeroVideo();
    
    // 갤러리 이미지 조회 (DB에서 관리자가 등록한 이미지)
    const galleryImages = await getGalleryImages();
    console.log('getHomeData - galleryImages:', galleryImages ? galleryImages.length : 'null', galleryImages);
    
    // 후기 목록 조회
    const reviews = await getReviews();
    console.log('getHomeData - reviews:', reviews.length);
    
    const defaultGallery = [...FALLBACK_GALLERY_IMAGES];
    
    const finalGallery = galleryImages || defaultGallery;
    console.log('getHomeData - finalGallery:', finalGallery.length, finalGallery);
    
    return {
      slogan: homeData.slogan || {
        sub: '임상경험이 풍부한 검증된 전문가 . ADHD 특화.차별화된 프로그램',
        main: 'ADHD 전문.심리상담센터'
      },
      videoUrl: videoUrl || '/assets/videos/hero-video.mp4', // 기본 비디오 경로
      gallery: finalGallery,
      reviews: reviews,
    };
  } catch (error) {
    console.error('Failed to load home data:', error);
    return {
      slogan: {
        sub: '임상경험이 풍부한 검증된 전문가 . ADHD 특화.차별화된 프로그램',
        main: 'ADHD 전문.심리상담센터'
      },
      videoUrl: '/assets/videos/hero-video.mp4', // 기본 비디오 경로
      gallery: [...FALLBACK_GALLERY_IMAGES],
      reviews: [],
    };
  }
}

export default async function Home() {
  const homeData = await getHomeData();

  return (
    <main id="top">
      <HashScroll />
      <Navigation />
      <HeroSection slogan={homeData.slogan} videoUrl={homeData.videoUrl} />

      <HomeScreeningPromo />

      <SectionTabs />

      <div className="content-shell">
        <div className="content-main">
          <HomeAboutSection />

          <section id="programs" className="content-section">
            <div className="section-intro-row section-intro-row--media-first">
              <HomeSectionVisual
                src={homeSectionImages.programs.src}
                alt={homeSectionImages.programs.alt}
              />
              <div className="section-intro-copy">
                <h2 className="section-title">프로그램</h2>
                <p className="section-desc">개인 특성에 따라 아래 프로그램을 조합해 진행할 수 있어요.</p>
              </div>
            </div>
            <div className="program-grid">
              {PROGRAM_PAGE_ORDER.map((id) => {
                const p = programPageContent[id];
                return (
                  <Link key={id} href={p.href} className="program-card">
                    <div className="program-title">{p.cardTitle}</div>
                    <div className="program-body">{p.cardLead}</div>
                  </Link>
                );
              })}
              <Link href="/screening" className="program-card">
                <div className="program-title">ADHD &amp; 공존질환 체크리스트</div>
                <div className="program-body">
                  주제별 간이 체크리스트로 먼저 살펴보실 수 있어요
                </div>
              </Link>
            </div>
          </section>

          <section id="gallery" className="content-section content-section-full">
            <GalleryMarquee images={homeData.gallery} />
          </section>

          <section id="reviews" className="content-section">
            <ReviewsList reviews={homeData.reviews} />
          </section>

          {/* 문의/예약 섹션은 바텀시트로 이동 - 섹션 제거 */}

          <Footer />
        </div>
      </div>
    </main>
  );
}

