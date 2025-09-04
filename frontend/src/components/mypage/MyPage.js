import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../utils/sessionManager';
import mypageApi from '../../utils/mypageApi';
import { notification } from '../../utils/scripts';
import SimpleLayout from '../layout/SimpleLayout';
import ProfileSection from './components/ProfileSection';
import SettingsSection from './components/SettingsSection';
import SecuritySection from './components/SecuritySection';
import SocialAccountsSection from './components/SocialAccountsSection';
import './MyPage.css';

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    gender: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    profileImage: null,
    profileImageType: 'DEFAULT_ICON',
    socialProvider: null,
    socialProfileImage: null
  });

  // 휴대폰 번호 포맷팅 함수
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // 숫자만 추출
    const numbers = phone.replace(/[^0-9]/g, '');
    
    // 길이에 따라 하이픈 추가
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 사용자 정보 로드
  const loadUserInfo = useCallback(async () => {
    try {
      const response = await mypageApi.getMyPageInfo();
      if (response) {
        setUser(response);
        setFormData({
          username: response.username || '',
          nickname: response.nickname || '',
          email: response.email || '',
          phone: response.phone || '',
          gender: response.gender || '',
          postalCode: response.postalCode || '',
          address: response.address || '',
          addressDetail: response.addressDetail || '',
          profileImage: response.profileImage || null,
          profileImageType: response.profileImageType || 'DEFAULT_ICON',
          socialProvider: response.socialProvider || null,
          socialProfileImage: response.socialProfileImage || null
        });
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      // API 호출 실패 시 세션에서 기본 정보 사용
      const currentUser = sessionManager.getUser();
      if (currentUser) {
        console.log('🔄 세션에서 사용자 데이터 로드:', currentUser);
        console.log('📝 로드된 필드 확인:');
        console.log('  - username:', currentUser.username);
        console.log('  - nickname:', currentUser.nickname);
        console.log('  - email:', currentUser.email);
        console.log('  - phone:', currentUser.phone);
        console.log('  - phoneNumber:', currentUser.phoneNumber);
        console.log('  - gender:', currentUser.gender);
        console.log('  - profileImage:', currentUser.profileImage);
        console.log('  - profileImageUrl:', currentUser.profileImageUrl);
        console.log('🔍 모든 필드:', Object.keys(currentUser));
        
        const formDataToSet = {
          username: currentUser.username || currentUser.name || '',
          nickname: currentUser.nickname || '',
          email: currentUser.email || '',
          phone: currentUser.phone || currentUser.phoneNumber || '',
          gender: currentUser.gender || '',
          profileImage: currentUser.profileImage || currentUser.profileImageUrl || null,
          profileImageType: currentUser.profileImageType || 'DEFAULT_ICON',
          socialProvider: currentUser.socialProvider || null,
          socialProfileImage: currentUser.socialProfileImage || null
        };
        
        console.log('🎯 설정할 formData:', formDataToSet);
        
        setUser(currentUser);
        setFormData(formDataToSet);
      }
    }
  }, []); // 의존성 배열을 비워서 한 번만 생성
  
  const loadSocialAccounts = useCallback(async () => {
    try {
      const response = await mypageApi.getSocialAccounts();
      setSocialAccounts(response || []);
    } catch (error) {
      console.error('소셜 계정 정보 로드 실패:', error);
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setSocialAccounts([]);
    }
  }, []);

  // localStorage에서 사용자 정보 확인 (백업)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setLocalUser(parsedUser);
        console.log('🔍 MyPage - localStorage 사용자:', parsedUser);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
  }, []);

  // user prop이 없으면 localStorage에서 가져온 사용자 정보 사용
  const displayUser = user || localUser;

  useEffect(() => {
    loadUserInfo();
    loadSocialAccounts();
    
    // URL 파라미터에서 연동 결과 확인
    const urlParams = new URLSearchParams(window.location.search);
    const linkStatus = urlParams.get('link');
    const provider = urlParams.get('provider');
    const message = urlParams.get('message');
    
    if (linkStatus && provider && message) {
      // 연동 결과에 따른 알림 표시
      if (linkStatus === 'success') {
        notification.showToast(`✅ ${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동 완료!`, 'success');
        // 소셜 계정 목록 새로고침
        loadSocialAccounts();
        // URL 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (linkStatus === 'error') {
        notification.showToast(`❌ ${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동 실패: ${message}`, 'error');
        // URL 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [loadUserInfo, loadSocialAccounts]);

  // 소셜 계정 탭이 활성화될 때 데이터 로드
  useEffect(() => {
    if (activeTab === 'social') {
      loadSocialAccounts();
    }
  }, [activeTab, loadSocialAccounts]);

  // formData 상태 변화 추적
  useEffect(() => {
    console.log('🔄 formData 상태 변경:', formData);
  }, [formData]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  // 드래그 앤 드롭 핸들러들
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCropImage(e.target.result);
          setIsCropping(true);
        };
        reader.readAsDataURL(file);
      } else {
        notification.showToast('이미지 파일만 업로드 가능합니다.', 'warning');
      }
    }
  };

  // 크롭 이미지 처리
  const handleCropImage = () => {
    if (cropImage) {
      // 실제 크롭 로직은 Canvas API를 사용하여 구현
      // 여기서는 간단히 이미지를 그대로 사용
      setFormData(prev => ({
        ...prev,
        profileImage: cropImage
      }));
      setIsCropping(false);
      setCropImage(null);
    }
  };

  // 이미지 파일 선택 시 크롭 모달 열기
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e, formDataToUpdate) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    try {
      const dataToUpdate = formDataToUpdate || formData;
      console.log('🚀 백엔드로 전송할 데이터:', dataToUpdate);
      
      const response = await mypageApi.updateMyPageInfo(dataToUpdate);
      console.log('✅ 백엔드 응답:', response);
      console.log('📝 백엔드 응답 필드 확인:');
      console.log('  - username:', response.username);
      console.log('  - nickname:', response.nickname);
      console.log('  - phone:', response.phone);
      console.log('  - gender:', response.gender);
      console.log('  - profileImage:', response.profileImage);
      
      // 사용자 정보 업데이트 (모든 필드 포함)
      setUser(prev => ({
        ...prev,
        username: dataToUpdate.username,
        nickname: dataToUpdate.nickname,
        phone: dataToUpdate.phone,
        gender: dataToUpdate.gender,
        profileImage: dataToUpdate.profileImage
      }));
      
      // formData도 업데이트
      setFormData(dataToUpdate);
      
      // 세션 매니저의 사용자 정보 즉시 업데이트 (모든 필드 포함)
      if (sessionManager.user) {
        sessionManager.user = {
          ...sessionManager.user,
          username: dataToUpdate.username,
          nickname: dataToUpdate.nickname,
          phone: dataToUpdate.phone,
          gender: dataToUpdate.gender,
          profileImage: dataToUpdate.profileImage
        };
        // 즉시 세션 상태 변경 알림
        sessionManager.notifyListeners();
      }
      
      // 백엔드에서 최신 정보 가져오기
      await sessionManager.checkSession();
      
      // 백엔드 응답이 불완전하므로 원본 데이터로 상태 유지
      console.log('백엔드 응답이 불완전하여 원본 데이터로 상태 유지');
      console.log('원본 업데이트 데이터:', dataToUpdate);
      
      // 사용자 상태를 원본 데이터로 업데이트 (백엔드 응답 대신)
      setUser(prev => ({
        ...prev,
        ...dataToUpdate
      }));
      
      // formData도 원본 데이터로 유지
      setFormData(dataToUpdate);
      
      console.log('상태 업데이트 완료 - 원본 데이터 사용');
      
      notification.showToast('프로필이 성공적으로 업데이트되었습니다.', 'success');
      
      // 사용자에게 페이지 새로고침 안내
      setTimeout(() => {
        notification.showToast('페이지를 새로고침하여 저장된 데이터를 확인해보세요.', 'info');
      }, 2000);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      notification.showToast('프로필 업데이트에 실패했습니다: ' + error.message, 'error');
    }
  };

  const handlePasswordReset = async () => {
    try {
      const email = displayUser?.email;
      if (!email) {
        notification.showToast('이메일 정보가 없습니다.', 'warning');
        return;
      }
      
      await mypageApi.requestPasswordReset(email);
              notification.showToast('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.', 'success');
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
              notification.showToast('비밀번호 재설정 요청에 실패했습니다: ' + error.message, 'error');
    }
  };

  const handleLinkSocialAccount = async (provider) => {
    try {
      console.log('🚀 소셜 계정 연동 시작:', provider);
      
      // 연동 시작 알림
      notification.showToast(`${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동을 시작합니다...`, 'info');
      
      console.log('📡 mypageApi.getOAuth2Url 호출 중...');
      const oauthUrl = await mypageApi.getOAuth2Url(provider);
      console.log('🔗 받은 OAuth2 URL:', oauthUrl);
      
      // 연동 진행 중 알림
      notification.showToast(`${provider === 'KAKAO' ? '카카오' : '네이버'}에서 권한을 승인해주세요.`, 'system');
      
      console.log('🔄 페이지 리다이렉트 중...');
      console.log('📍 리다이렉트 URL:', oauthUrl);
      
      // 잠시 대기 후 리다이렉트 (로그 확인을 위해)
      setTimeout(() => {
        console.log('🚀 리다이렉트 실행!');
        console.log('📍 최종 OAuth2 URL:', oauthUrl);
        // 현재 창에서 연동 진행 (새 창 대신)
        window.location.href = oauthUrl;
      }, 1000);
      
    } catch (error) {
      console.error('❌ 소셜 계정 연동 URL 생성 실패:', error);
      notification.showToast('소셜 계정 연동을 시작할 수 없습니다: ' + error.message, 'error');
    }
  };

  const handleUnlinkSocialAccount = async (provider, accountId) => {
    if (!window.confirm(`${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await mypageApi.unlinkSocialAccount(provider, accountId);
      notification.showToast('소셜 계정 연동이 해제되었습니다.', 'success');
      // 소셜 계정 목록 새로고침
      loadSocialAccounts();
    } catch (error) {
      console.error('소셜 계정 연동 해제 실패:', error);
      notification.showToast('소셜 계정 연동 해제에 실패했습니다: ' + error.message, 'error');
    }
  };



  // displayUser가 null이면 로딩 상태로 처리
  if (!displayUser) {
    return (
      <SimpleLayout>
        <div className="mypage-container">
          <div className="mypage-header">
            <h1>마이페이지</h1>
          </div>
          <div className="mypage-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="mypage-container">
      <div className="mypage-header">
        <h1>마이페이지</h1>
        <p>{displayUser?.username || displayUser?.name || displayUser?.nickname || '사용자'}님의 정보를 관리하세요</p>
      </div>

      <div className="mypage-content">
        <div className="mypage-top-nav">
          <div className="mypage-nav">
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              프로필 정보
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              설정
            </button>
            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              보안
            </button>
            <button
              className={`nav-item ${activeTab === 'social' ? 'active' : ''}`}
              onClick={() => setActiveTab('social')}
            >
              소셜 계정
            </button>
          </div>
        </div>

        <div className="mypage-main-content">
          {activeTab === 'profile' && (
            <ProfileSection
              user={user}
              formData={formData}
              onFormDataChange={setFormData}
              onSave={handleSubmit}
              formatPhoneNumber={formatPhoneNumber}
            />
          )}

          {activeTab === 'settings' && (
            <div className="mypage-section">
              <h2>설정</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>알림 설정</h3>
                    <p>이메일 및 푸시 알림을 관리합니다</p>
                  </div>
                  <button className="setting-btn">설정</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>언어 설정</h3>
                    <p>사용 언어를 변경합니다</p>
                  </div>
                  <button className="setting-btn">설정</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>테마 설정</h3>
                    <p>화면 테마를 변경합니다</p>
                  </div>
                  <button className="setting-btn">설정</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="mypage-section">
              <h2>보안</h2>
              <div className="security-list">
                <div className="security-item">
                  <div className="security-info">
                    <h3>비밀번호 변경</h3>
                    <p>현재 비밀번호를 변경합니다</p>
                  </div>
                  <button className="security-btn">변경</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>비밀번호 찾기</h3>
                    <p>비밀번호를 잊어버린 경우 재설정합니다</p>
                  </div>
                  <button className="security-btn" onClick={handlePasswordReset}>
                    재설정
                  </button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h3>2단계 인증</h3>
                    <p>추가 보안을 위해 2단계 인증을 설정합니다</p>
                  </div>
                  <button className="security-btn">설정</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="mypage-section">
              <h2>소셜 계정 관리</h2>
              <div className="social-accounts-list">
                {socialAccounts.length > 0 ? (
                  socialAccounts.map((account) => (
                    <div key={account.id} className="social-account-item">
                      <div className="social-account-info">
                        <div className="social-provider-icon">
                          {account.provider === 'KAKAO' ? (
                            <i className="bi bi-chat-dots-fill" style={{ color: '#FEE500' }}></i>
                          ) : account.provider === 'NAVER' ? (
                            <i className="bi bi-n-circle-fill" style={{ color: '#03C75A' }}></i>
                          ) : (
                            <i className="bi bi-person-circle"></i>
                          )}
                        </div>
                        <div className="social-account-details">
                          <h3>{account.provider === 'KAKAO' ? '카카오' : account.provider === 'NAVER' ? '네이버' : account.provider} 계정</h3>
                          <p>{account.providerUsername || '사용자명 없음'}</p>
                          {account.providerProfileImage && (
                            <div className="social-profile-image">
                              <img 
                                src={account.providerProfileImage} 
                                alt="소셜 프로필 이미지"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="social-account-actions">
                        <button 
                          className="unlink-btn"
                          onClick={() => handleUnlinkSocialAccount(account.provider, account.id)}
                        >
                          연동 해제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-social-accounts">
                    <p>연동된 소셜 계정이 없습니다.</p>
                  </div>
                )}
                
                <div className="link-new-account">
                  <h3>새로운 소셜 계정 연동</h3>
                  <div className="link-options">
                    <button 
                      className="link-btn kakao"
                      onClick={() => handleLinkSocialAccount('KAKAO')}
                    >
                      <i className="bi bi-chat-dots-fill"></i>
                      카카오 계정 연동
                    </button>
                    <button 
                      className="link-btn naver"
                      onClick={() => handleLinkSocialAccount('NAVER')}
                    >
                      <i className="bi bi-n-circle-fill"></i>
                      네이버 계정 연동
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </SimpleLayout>
  );
};

export default MyPage;
