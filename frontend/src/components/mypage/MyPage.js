import React, { useState, useEffect, useCallback } from 'react';
import { sessionManager } from '../../utils/sessionManager';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import mypageApi from '../../utils/mypageApi';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import ProfileSection from './components/ProfileSection';
import SettingsSection from './components/SettingsSection';
import SecuritySection from './components/SecuritySection';
import SocialAccountsSection from './components/SocialAccountsSection';
import PrivacyConsentSection from './components/PrivacyConsentSection';
import PasswordResetModal from './components/PasswordResetModal';
import PasswordChangeModal from './components/PasswordChangeModal';
import './MyPage.css';

const MyPage = () => {
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
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
      // 세션에서 사용자 정보 먼저 가져오기
      const currentUser = sessionManager.getUser();
      if (!currentUser) {
        throw new Error('세션에 사용자 정보가 없습니다');
      }

      console.log('🔍 MyPage - 사용자 정보 로드 시작, 역할:', currentUser.role, 'ID:', currentUser.id);
      
      // 사용자 역할에 따라 다른 API 엔드포인트 사용
      const response = await mypageApi.getProfileInfo(currentUser.role, currentUser.id);
      
      if (response) {
        setUser(response);
        setFormData({
          username: response.username || response.name || '',
          nickname: response.nickname || '',
          email: response.email || '',
          phone: response.phone || response.phoneNumber || '',
          gender: response.gender || '',
          postalCode: response.postalCode || '',
          address: response.address || '',
          addressDetail: response.addressDetail || '',
          profileImage: response.profileImage || response.profileImageUrl || null,
          profileImageType: response.profileImageType || 'DEFAULT_ICON',
          socialProvider: response.socialProvider || null,
          socialProfileImage: response.socialProfileImage || null
        });
        console.log('✅ MyPage - 사용자 정보 로드 완료');
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
      const currentUser = sessionManager.getUser();
      if (!currentUser) {
        setSocialAccounts([]);
        return;
      }
      
      const response = await mypageApi.getSocialAccounts(currentUser.role, currentUser.id);
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
        notificationManager.show(`✅ ${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동 완료!`, 'success');
        // 소셜 계정 목록 새로고침
        loadSocialAccounts();
        // URL 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (linkStatus === 'error') {
        notificationManager.show(`❌ ${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동 실패: ${message}`, 'error');
        // URL 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 소셜 계정 탭이 활성화될 때 데이터 로드
  useEffect(() => {
    if (activeTab === 'social') {
      loadSocialAccounts();
    }
  }, [activeTab]); // activeTab이 변경될 때만 실행

  // formData 상태 변화 추적 (개발용 - 필요시 주석 해제)
  // useEffect(() => {
  //   console.log('🔄 formData 상태 변경:', formData);
  // }, [formData]);



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
        notificationManager.show('이미지 업로드는 프로필 정보 탭에서 가능합니다.', 'info');
      } else {
        notificationManager.show('이미지 파일만 업로드 가능합니다.', 'warning');
      }
    }
  };



  const handleSubmit = withFormSubmit(async (e, formDataToUpdate) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // 최신 formData를 사용하도록 수정
    const dataToUpdate = formDataToUpdate || formData;
    console.log('🚀 백엔드로 전송할 데이터:', dataToUpdate);
    console.log('🔍 프로필 이미지 확인:', {
      profileImage: dataToUpdate.profileImage ? dataToUpdate.profileImage.substring(0, 50) + '...' : 'null',
      profileImageType: dataToUpdate.profileImageType
    });
    
    // 크롭된 이미지도 백엔드에 저장하도록 수정
    if (dataToUpdate.profileImage && dataToUpdate.profileImage.startsWith('data:image/')) {
      console.log('🖼️ 크롭된 이미지 감지 - 백엔드에 저장 진행');
    }
    
    // 사용자 역할에 따라 다른 API 엔드포인트 사용
    const currentUser = sessionManager.getUser();
    if (!currentUser) {
      throw new Error('세션에 사용자 정보가 없습니다');
    }
    
    // 백엔드 DTO에 맞게 데이터 변환
    const requestData = {
      ...dataToUpdate,
      profileImageUrl: dataToUpdate.profileImage, // profileImage를 profileImageUrl로 매핑
      // 필요한 다른 필드들도 매핑
      gender: dataToUpdate.gender,
      memo: dataToUpdate.memo || '',
      // 상담사 전용 필드들 (필요시)
      specialty: dataToUpdate.specialty || '',
      qualifications: dataToUpdate.qualifications || '',
      experience: dataToUpdate.experience || '',
      availableTime: dataToUpdate.availableTime || '',
      detailedIntroduction: dataToUpdate.detailedIntroduction || '',
      education: dataToUpdate.education || '',
      awards: dataToUpdate.awards || '',
      research: dataToUpdate.research || '',
      hourlyRate: dataToUpdate.hourlyRate || null
    };
    
    console.log('🔄 변환된 요청 데이터:', {
      ...requestData,
      profileImageUrl: requestData.profileImageUrl ? requestData.profileImageUrl.substring(0, 50) + '...' : 'null'
    });
    
    const response = await mypageApi.updateProfileInfo(currentUser.role, currentUser.id, requestData);
    console.log('✅ 백엔드 응답:', response);
    console.log('📝 백엔드 응답 필드 확인:');
    console.log('  - username:', response.username);
    console.log('  - nickname:', response.nickname);
    console.log('  - phone:', response.phone);
    console.log('  - gender:', response.gender);
    console.log('  - profileImage:', response.profileImage);
    
              // 사용자 정보 업데이트 (크롭된 이미지는 프론트엔드 데이터 우선 사용)
          setUser(prev => ({
            ...prev,
            username: response.username || dataToUpdate.username,
            nickname: response.nickname || dataToUpdate.nickname,
            phone: response.phone || dataToUpdate.phone,
            gender: response.gender || dataToUpdate.gender,
            // 크롭된 이미지는 프론트엔드 데이터 우선 사용
            profileImage: dataToUpdate.profileImage || response.profileImage,
            profileImageType: dataToUpdate.profileImageType || response.profileImageType
          }));

          // formData도 크롭된 이미지 우선으로 업데이트
          setFormData({
            ...dataToUpdate,
            profileImage: dataToUpdate.profileImage || response.profileImage,
            profileImageType: dataToUpdate.profileImageType || response.profileImageType
          });
    
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
    
    notificationManager.show('프로필이 성공적으로 업데이트되었습니다.', 'success');
    
    // 사용자에게 페이지 새로고침 안내
    setTimeout(() => {
      notificationManager.show('페이지를 새로고침하여 저장된 데이터를 확인해보세요.', 'info');
    }, 2000);
  });

  const handlePasswordReset = () => {
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetSuccess = () => {
    notificationManager.show('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.', 'success');
  };

  const handlePasswordChange = () => {
    setShowPasswordChangeModal(true);
  };

  const handlePasswordChangeSuccess = () => {
    notificationManager.show('비밀번호가 성공적으로 변경되었습니다.', 'success');
  };

  const handleLinkSocialAccount = async (provider) => {
    try {
      console.log('🚀 소셜 계정 연동 시작:', provider);
      
      // 연동 시작 알림
      notificationManager.show(`${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동을 시작합니다...`, 'info');
      
      console.log('📡 mypageApi.getOAuth2Url 호출 중...');
      const oauthUrl = await mypageApi.getOAuth2Url(provider);
      console.log('🔗 받은 OAuth2 URL:', oauthUrl);
      
      // 연동 진행 중 알림
      notificationManager.show(`${provider === 'KAKAO' ? '카카오' : '네이버'}에서 권한을 승인해주세요.`, 'system');
      
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
      notificationManager.show('소셜 계정 연동을 시작할 수 없습니다: ' + error.message, 'error');
    }
  };

  const handleUnlinkSocialAccount = async (provider, accountId) => {
    if (!window.confirm(`${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await mypageApi.unlinkSocialAccount(provider, accountId);
      notificationManager.show('소셜 계정 연동이 해제되었습니다.', 'success');
      // 소셜 계정 목록 새로고침
      loadSocialAccounts();
    } catch (error) {
      console.error('소셜 계정 연동 해제 실패:', error);
      notificationManager.show('소셜 계정 연동 해제에 실패했습니다: ' + error.message, 'error');
    }
  };



  // displayUser가 null이면 로딩 상태로 처리
  if (!displayUser) {
    return (
      <SimpleLayout title="마이페이지">
        <div className="mypage-container">
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
    <SimpleLayout title="마이페이지">
      <div className={`mypage-container mypage ${isProfileEditing ? 'editing' : 'readonly'}`}>

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
            <button
              className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              개인정보 동의
            </button>
          </div>
        </div>

        <div className="mypage-main-content">
          {activeTab === 'profile' && (
                    <ProfileSection
          user={user}
          formData={formData}
          onFormDataChange={setFormData}
          onUserChange={setUser}
          onSave={handleSubmit}
          formatPhoneNumber={formatPhoneNumber}
          onEditingChange={setIsProfileEditing}
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
                  <button 
                    className="setting-btn" 
                    onClick={() => notificationManager.show('알림 설정 기능은 개발 예정입니다. 곧 출시될 예정이니 조금만 기다려주세요!', 'info')}
                  >
                    설정
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>언어 설정</h3>
                    <p>사용 언어를 변경합니다</p>
                  </div>
                  <button 
                    className="setting-btn" 
                    onClick={() => notificationManager.show('언어 설정 기능은 개발 예정입니다. 곧 출시될 예정이니 조금만 기다려주세요!', 'info')}
                  >
                    설정
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>테마 설정</h3>
                    <p>화면 테마를 변경합니다</p>
                  </div>
                  <button 
                    className="setting-btn" 
                    onClick={() => notificationManager.show('테마 설정 기능은 개발 예정입니다. 곧 출시될 예정이니 조금만 기다려주세요!', 'info')}
                  >
                    설정
                  </button>
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
                  <button className="security-btn" onClick={handlePasswordChange}>변경</button>
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
                  <button 
                    className="security-btn" 
                    onClick={() => notificationManager.show('2단계 인증 기능은 개발 예정입니다. 곧 출시될 예정이니 조금만 기다려주세요!', 'info')}
                  >
                    설정
                  </button>
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
                            <i className="bi bi-chat-dots-fill social-icon social-icon--kakao"></i>
                          ) : account.provider === 'NAVER' ? (
                            <i className="bi bi-n-circle-fill social-icon social-icon--naver"></i>
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

          {activeTab === 'privacy' && (
            <PrivacyConsentSection />
          )}
        </div>
      </div>
      </div>

      {/* 비밀번호 재설정 모달 */}
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        onSuccess={handlePasswordResetSuccess}
      />

      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </SimpleLayout>
  );
};

export default MyPage;
