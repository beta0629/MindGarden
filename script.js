/**
 * Mind Garden - Interactive Logic
 * 
 * DESIGN INTENT:
 * 1. Infinite Marquee: Represents the continuous flow of emotions and time.
 *    We clone the gallery items to create a seamless loop without visual breaks.
 * 2. Scroll Interaction: The navigation changes from transparent (blending with nature) 
 *    to solid/dark (grounded) as the user enters the content area.
 * 3. Dynamic Data Loading: Loads content from Core Solution API
 */

document.addEventListener('DOMContentLoaded', () => {
    initMarquee();
    initScrollObserver();
    initDynamicContent();
});

/**
 * Initialize Infinite Marquee
 * Clones the visual elements to ensure a smooth, gap-less loop.
 */
function initMarquee() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    // Design intent: "Continuity"
    // Duplicate the content to allow seamless scrolling
    const items = track.innerHTML;
    track.innerHTML = items + items;

    // Add the animation class after cloning to ensure standard starting state
    track.classList.add('animating');
}

/**
 * Header Scroll Effect
 * Toggles class on GNB based on scroll position for better readability.
 */
function initScrollObserver() {
    const header = document.querySelector('.gnb');
    const heroSection = document.querySelector('.hero-section');
    const logo = document.querySelector('.logo');
    const lines = document.querySelectorAll('.line');

    // We want to detect when we LEAVE the hero section
    window.addEventListener('scroll', () => {
        if (!heroSection) return;

        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const scrollY = window.scrollY;

        // Design intent: "Contrast & Readability"
        // If the bottom of hero is passed (less than 50px), switch to dark text
        if (heroBottom < 50) {
            header.classList.add('scrolled');
            header.style.color = 'var(--text-main)';
            logo.style.color = 'var(--text-main)';
            lines.forEach(line => line.style.backgroundColor = 'var(--text-main)');
        } else {
            header.classList.remove('scrolled');
            header.style.color = 'var(--white)';
            logo.style.color = 'var(--white)';
            lines.forEach(line => line.style.backgroundColor = 'var(--white)');
        }
    });
}

/**
 * 동적 콘텐츠 로딩 (코어솔루션 API 연동)
 */
async function initDynamicContent() {
    try {
        // API 서비스가 로드되었는지 확인
        if (typeof getApiService === 'undefined') {
            console.warn('API service not loaded. Using static content.');
            return;
        }

        const apiService = getApiService();
        
        // 홈 데이터 로드
        const homeData = await apiService.getHomeData();
        updateHeroContent(homeData);
        
        // 갤러리 이미지 로드
        const galleryImages = await apiService.getGalleryImages();
        if (galleryImages.length > 0) {
            updateGalleryImages(galleryImages);
        }
        
    } catch (error) {
        console.error('Failed to load dynamic content:', error);
        // 오류 발생 시 정적 콘텐츠 유지
    }
}

/**
 * 히어로 섹션 콘텐츠 업데이트
 */
function updateHeroContent(data) {
    if (!data || !data.slogan) return;
    
    const sloganSub = document.querySelector('.slogan-sub');
    const sloganMain = document.querySelector('.slogan-main');
    
    if (sloganSub && data.slogan.sub) {
        sloganSub.textContent = data.slogan.sub;
    }
    
    if (sloganMain && data.slogan.main) {
        sloganMain.innerHTML = data.slogan.main.replace(/\n/g, '<br>');
    }
}

/**
 * 갤러리 이미지 업데이트
 */
function updateGalleryImages(images) {
    const marqueeTrack = document.querySelector('.marquee-track');
    if (!marqueeTrack || !images || images.length === 0) return;
    
    // 기존 이미지 제거
    marqueeTrack.innerHTML = '';
    
    // 새 이미지 추가
    images.forEach(image => {
        const item = document.createElement('div');
        item.className = 'marquee-item';
        
        const img = document.createElement('img');
        img.src = image.url || image.src;
        img.alt = image.alt || 'Gallery Image';
        img.loading = 'lazy';
        
        // 이미지 로드 실패 시 기본 이미지로 대체
        img.onerror = function() {
            this.src = 'assets/images/gallery_1.png';
        };
        
        item.appendChild(img);
        marqueeTrack.appendChild(item);
    });
    
    // 마퀴 재초기화
    initMarquee();
}
