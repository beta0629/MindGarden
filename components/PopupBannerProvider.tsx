'use client';

import { useState, useEffect } from 'react';
import PopupModal from './PopupModal';
import Banner from './Banner';

export default function PopupBannerProvider() {
  const [popup, setPopup] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopupAndBanner();
  }, []);

  const loadPopupAndBanner = async () => {
    try {
      setLoading(true);
      
      // 팝업과 배너를 동시에 조회
      const [popupResponse, bannerResponse] = await Promise.all([
        fetch('/api/popups'),
        fetch('/api/banners'),
      ]);

      const popupData = await popupResponse.json();
      const bannerData = await bannerResponse.json();

      console.log('Popup data:', popupData);
      console.log('Banner data:', bannerData);

      if (popupData.success && popupData.popup) {
        setPopup(popupData.popup);
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
