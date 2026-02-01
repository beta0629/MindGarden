'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import PopupModal from './PopupModal';
import Banner from './Banner';

export default function PopupBannerProvider() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 관리자 페이지에서는 팝업과 배너를 표시하지 않음
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    if (!isAdminPage) {
      loadPopupAndBanner();
    } else {
      setLoading(false);
    }
  }, [isAdminPage]);

  // 쿠키에서 팝업 숨김 여부 확인
  const isPopupHidden = (popupId: number): boolean => {
    if (typeof document === 'undefined') return false;
    const cookies = document.cookie.split(';');
    const cookieName = `popup_hidden_${popupId}`;
    return cookies.some(cookie => {
      const [name] = cookie.trim().split('=');
      return name === cookieName;
    });
  };

  const loadPopupAndBanner = async () => {
    try {
      setLoading(true);
      
      // 팝업과 배너를 동시에 조회 (캐시 방지를 위해 timestamp 추가)
      const timestamp = Date.now();
      const [popupResponse, bannerResponse] = await Promise.all([
        fetch(`/api/popups?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/banners?t=${timestamp}`, { cache: 'no-store' }),
      ]);

      const popupData = await popupResponse.json();
      const bannerData = await bannerResponse.json();

      console.log('Popup data:', popupData);
      console.log('Banner data:', bannerData);

      if (popupData.success && popupData.popup) {
        // 팝업 데이터 상세 로깅
        console.log('Popup details:', {
          id: popupData.popup.id,
          title: popupData.popup.title,
          contentLength: popupData.popup.content?.length || 0,
          hasImageInContent: popupData.popup.content?.includes('<img') || false,
          content: popupData.popup.content?.substring(0, 100) + '...',
        });
        
        // 쿠키 확인: 24시간 동안 보지 않기로 설정된 팝업은 표시하지 않음
        if (!isPopupHidden(popupData.popup.id)) {
          setPopup(popupData.popup);
          console.log('Popup set to state:', popupData.popup);
        } else {
          console.log('Popup is hidden by cookie:', popupData.popup.id);
        }
      } else {
        console.log('No popup to display:', { success: popupData.success, popup: popupData.popup });
      }

      if (bannerData.success && bannerData.banners && bannerData.banners.length > 0) {
        console.log('Setting banners:', bannerData.banners);
        setBanners(bannerData.banners);
      } else {
        console.log('No banners to display:', { success: bannerData.success, banners: bannerData.banners });
      }
    } catch (error) {
      console.error('Failed to load popup/banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setPopup(null);
  };

  // 관리자 페이지에서는 아무것도 렌더링하지 않음
  if (isAdminPage) {
    return null;
  }

  if (loading) {
    return null;
  }

  console.log('PopupBannerProvider render:', { bannersCount: banners.length, banners });

  return (
    <>
      {/* 배너는 네비게이션 아래에 fixed로 표시 (롤링) */}
      {banners.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: '96px', // 네비게이션 높이 (padding 2rem = 32px * 2 = 64px + 내용 높이 약 32px)
          left: 0,
          right: 0,
          zIndex: 999,
          width: '100%'
        }}>
          <Banner banners={banners} />
        </div>
      )}
      {/* 배너가 있을 때 본문 콘텐츠에 여백 추가 (네비게이션 + 배너 높이) */}
      {banners.length > 0 && <div style={{ height: '156px' }} />}
      {/* 팝업은 모달로 표시 */}
      {popup && <PopupModal popup={popup} onClose={handleClosePopup} />}
    </>
  );
}
