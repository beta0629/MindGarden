import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import MindgardenLandingSections from '@/components/about/MindgardenLandingSections';
import HomeSectionVisual from '@/components/HomeSectionVisual';
import GalleryMarquee from '@/components/GalleryMarquee';
import ReviewsList from '@/components/ReviewsList';
import Footer from '@/components/Footer';
import HomeScreeningPromo from '@/components/HomeScreeningPromo';
import SectionTabs from '@/components/SectionTabs';
import HashScroll from '@/components/HashScroll';
import HomeProgramPagesFlipGrid from '@/components/HomeProgramPagesFlipGrid';
import { getApiService } from '@/lib/api';
import { getDbConnection } from '@/lib/db';
import { homeSectionImages } from '@/lib/home-section-images';
import { FALLBACK_GALLERY_IMAGES } from '@/lib/site-fallback-visuals';

// 갤러리·후기 등 DB 기반 블록이 있어 요청 시 최신 데이터를 쓰도록 동적 렌더링 유지
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

    // 갤러리 이미지 조회 (DB에서 관리자가 등록한 이미지)
    const galleryImages = await getGalleryImages();

    // 후기 목록 조회
    const reviews = await getReviews();

    const defaultGallery = [...FALLBACK_GALLERY_IMAGES];

    const finalGallery = galleryImages || defaultGallery;
    
    return {
      slogan: (homeData && homeData.slogan) || {
        sub: '전 연령 ADHD 및 동반질환 전문 특화. 부부가족상담 전문',
        main: '나를 소중히 돌보고 가꾸는 시간,\n당신의 마음이 정원이 되는 곳',
        tagline: '— 마인드가든이 함께 합니다 —',
      },
      gallery: finalGallery,
      reviews: reviews,
    };
  } catch (error) {
    console.error('Failed to load home data:', error);
    return {
      slogan: {
        sub: '전 연령 ADHD 및 동반질환 전문 특화. 부부가족상담 전문',
        main: '나를 소중히 돌보고 가꾸는 시간,\n당신의 마음이 정원이 되는 곳',
        tagline: '— 마인드가든이 함께 합니다 —',
      },
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
      <HeroSection slogan={homeData.slogan} />

      <HomeScreeningPromo />

      <SectionTabs />

      <MindgardenLandingSections showHero={false} />

      <section className="content-shell" aria-label="프로그램, 갤러리, 후기">
        <div className="content-main">
          <section id="program-pages" className="content-section">
            <div className="section-intro-row section-intro-row--media-first">
              <HomeSectionVisual
                src={homeSectionImages.programs.src}
                alt={homeSectionImages.programs.alt}
              />
              <div className="section-intro-copy">
                <h2 className="section-title">프로그램</h2>
                <p className="section-desc">개인 특성에 따라 아래 프로그램을 조합해 진행할 수 있어요.</p>
                <p className="mg-prog-flip-hint mg-prog-flip-hint--home" role="note">
                  터치로 보실 때는 카드를 탭하면 뒷면 설명이 열립니다. 한 번 더 탭하면 앞면으로 돌아갑니다.
                </p>
              </div>
            </div>
            <HomeProgramPagesFlipGrid />
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
      </section>
    </main>
  );
}

