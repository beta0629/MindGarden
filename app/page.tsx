import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import GalleryMarquee from '@/components/GalleryMarquee';
import Footer from '@/components/Footer';
import SectionTabs from '@/components/SectionTabs';
import ConsultationForm from '@/components/ConsultationForm';
import HashScroll from '@/components/HashScroll';
import { getApiService } from '@/lib/api';
import { getDbConnection } from '@/lib/db';

// 동적 렌더링 강제 (갤러리 이미지가 실시간으로 변경될 수 있으므로)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 갤러리 이미지 조회 (서버 사이드에서 직접 DB 조회)
async function getGalleryImages() {
  let connection;
  try {
    connection = await getDbConnection();
    
    const [rows] = await connection.execute(
      `SELECT image_url, alt_text 
       FROM gallery_images
       WHERE is_active = 1
       ORDER BY display_order ASC, created_at ASC`
    );

    const images = (rows as any[]).map((row: any) => ({
      url: row.image_url,
      alt: row.alt_text || '갤러리 이미지',
    }));

    console.log('Gallery images loaded:', images.length, images);
    return images.length > 0 ? images : null;
  } catch (error) {
    console.error('Failed to load gallery images:', error);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 서버 컴포넌트에서 데이터 가져오기
async function getHomeData() {
  try {
    const apiService = getApiService();
    const homeData = await apiService.getHomeData();
    const videoUrl = await apiService.getHeroVideo();
    
    // 갤러리 이미지 조회 (DB에서 관리자가 등록한 이미지)
    const galleryImages = await getGalleryImages();
    
    // 기본 이미지 (갤러리 이미지가 없을 때 사용)
    const defaultGallery = [
      { url: '/assets/images/gallery_1.png', alt: '따뜻한 상담 공간' },
      { url: '/assets/images/gallery_2.png', alt: '편안한 치료실' },
      { url: '/assets/images/gallery_3.png', alt: '평화로운 공간' },
      { url: '/assets/images/gallery_4.png', alt: '따뜻한 조명의 공간' },
    ];
    
    return {
      slogan: homeData.slogan || {
        sub: 'ADHD 전문 상담과 함께',
        main: '마인드 가든\nADHD 전문 상담소'
      },
      videoUrl: videoUrl || null,
      gallery: galleryImages || defaultGallery,
    };
  } catch (error) {
    console.error('Failed to load home data:', error);
    return {
      slogan: {
        sub: 'ADHD 전문 상담과 함께',
        main: '마인드 가든\nADHD 전문 상담소'
      },
      videoUrl: null,
      gallery: [
        { url: '/assets/images/gallery_1.png', alt: '따뜻한 상담 공간' },
        { url: '/assets/images/gallery_2.png', alt: '편안한 치료실' },
        { url: '/assets/images/gallery_3.png', alt: '평화로운 공간' },
        { url: '/assets/images/gallery_4.png', alt: '따뜻한 조명의 공간' },
      ],
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

      <SectionTabs />

      <div className="content-shell">
        <div className="content-main">
          <section id="about" className="content-section">
            <h2 className="section-title">마인드 가든 소개</h2>
            <p className="section-desc">
              ADHD 전문 상담으로 일상의 집중과 감정 조절, 관계의 균형을 함께 만들어갑니다. 밝고 편안한 공간에서
              당신의 속도에 맞춰 동행합니다.
            </p>
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-title">전문성</div>
                <div className="feature-body">ADHD 특성을 이해하는 맞춤 상담과 코칭</div>
              </div>
              <div className="feature-card">
                <div className="feature-title">따뜻한 환경</div>
                <div className="feature-body">불안이 줄고 편안해지는 밝은 상담실</div>
              </div>
              <div className="feature-card">
                <div className="feature-title">지속 가능한 변화</div>
                <div className="feature-body">일상에 적용 가능한 루틴/실행 전략 중심</div>
              </div>
            </div>
          </section>

          <section id="programs" className="content-section">
            <h2 className="section-title">프로그램</h2>
            <p className="section-desc">개인 특성에 따라 아래 프로그램을 조합해 진행할 수 있어요.</p>
            <div className="program-grid">
              <div className="program-card">
                <div className="program-title">ADHD 개인 상담</div>
                <div className="program-body">집중·충동·감정 조절을 함께 다루는 1:1 상담</div>
              </div>
              <div className="program-card">
                <div className="program-title">코칭(실행 전략)</div>
                <div className="program-body">루틴 설계, 시간관리, 실행력 향상 중심 코칭</div>
              </div>
              <div className="program-card">
                <div className="program-title">가족/부모 상담</div>
                <div className="program-body">가정 내 소통과 역할 조정, 지지 환경 만들기</div>
              </div>
            </div>
          </section>

          <section id="gallery" className="content-section content-section-full">
            <GalleryMarquee images={homeData.gallery} />
          </section>

          <section id="contact" className="content-section">
            <h2 className="section-title">문의 / 예약</h2>
            <p className="section-desc">
              아래 폼을 작성해주시면 빠른 시일 내에 연락드리겠습니다.
            </p>
            
            <div className="contact-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '40px' }}>
              <div>
                <ConsultationForm />
              </div>
              
              <div>
                <div className="contact-card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', color: 'var(--text-main)' }}>
                    연락처 정보
                  </h3>
                  <div className="contact-row">
                    <div className="contact-label">전화</div>
                    <div className="contact-value">010-0000-0000</div>
                  </div>
                  <div className="contact-row">
                    <div className="contact-label">카카오</div>
                    <div className="contact-value">mindgarden (채널)</div>
                  </div>
                  <div className="contact-row">
                    <div className="contact-label">주소</div>
                    <div className="contact-value">서울시 ○○구 ○○로 00</div>
                  </div>
                  <div className="contact-row">
                    <div className="contact-label">운영시간</div>
                    <div className="contact-value">평일 09:00 - 18:00</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </main>
  );
}

