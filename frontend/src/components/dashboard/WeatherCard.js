import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { CloudSun, Droplet, Wind, RefreshCw, AlertTriangle } from 'lucide-react';
import '../../styles/mindgarden-design-system.css';

/**
 * 날씨 정보 카드 컴포넌트
 * 실시간 날씨 정보를 표시합니다
 * 디자인 시스템 v2.0 적용
 */
const WeatherCard = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    description: '',
    humidity: null,
    windSpeed: null,
    location: '서울',
    icon: 'bi-cloud-sun',
    loading: true,
    error: null
  });

  // 날씨 아이콘 매핑
  const getWeatherIcon = (weatherCode) => {
    const iconMap = {
      0: 'bi-sun',           // 맑음
      1: 'bi-cloud-sun',     // 대체로 맑음
      2: 'bi-cloud-sun',     // 부분적으로 흐림
      3: 'bi-cloud',         // 흐림
      45: 'bi-cloud-fog',    // 안개
      48: 'bi-cloud-fog',    // 서리 안개
      51: 'bi-cloud-drizzle', // 가벼운 이슬비
      53: 'bi-cloud-drizzle', // 보통 이슬비
      55: 'bi-cloud-drizzle', // 진한 이슬비
      61: 'bi-cloud-rain',   // 가벼운 비
      63: 'bi-cloud-rain',   // 보통 비
      65: 'bi-cloud-rain',   // 진한 비
      71: 'bi-snow',         // 가벼운 눈
      73: 'bi-snow',         // 보통 눈
      75: 'bi-snow',         // 진한 눈
      77: 'bi-snow',         // 눈송이
      80: 'bi-cloud-drizzle', // 가벼운 소나기
      81: 'bi-cloud-rain',   // 보통 소나기
      82: 'bi-cloud-rain',   // 진한 소나기
      85: 'bi-snow',         // 가벼운 눈보라
      86: 'bi-snow',         // 진한 눈보라
      95: 'bi-cloud-lightning', // 뇌우
      96: 'bi-cloud-lightning', // 약한 뇌우와 우박
      99: 'bi-cloud-lightning'  // 진한 뇌우와 우박
    };
    
    return iconMap[weatherCode] || 'bi-cloud-sun';
  };

  // 날씨 설명 한글 변환
  const getWeatherDescription = (weatherCode) => {
    const descriptionMap = {
      0: '맑음',
      1: '대체로 맑음',
      2: '부분적으로 흐림',
      3: '흐림',
      45: '안개',
      48: '서리 안개',
      51: '가벼운 이슬비',
      53: '보통 이슬비',
      55: '진한 이슬비',
      61: '가벼운 비',
      63: '보통 비',
      65: '진한 비',
      71: '가벼운 눈',
      73: '보통 눈',
      75: '진한 눈',
      77: '눈송이',
      80: '가벼운 소나기',
      81: '보통 소나기',
      82: '진한 소나기',
      85: '가벼운 눈보라',
      86: '진한 눈보라',
      95: '뇌우',
      96: '약한 뇌우',
      99: '진한 뇌우'
    };
    
    return descriptionMap[weatherCode] || '알 수 없음';
  };

  // 날씨 데이터 가져오기
  const fetchWeatherData = async () => {
    try {
      setWeatherData(prev => ({ ...prev, loading: true, error: null }));
      
      // OpenWeatherMap API 사용 (무료 API)
      // 실제 구현 시에는 환경변수로 API 키를 관리해야 합니다
      const API_KEY = 'your_api_key_here'; // 실제 API 키로 교체 필요
      const lat = 37.5665; // 서울 위도
      const lon = 126.9780; // 서울 경도
      
      // Mock 데이터 사용 (실제 API 호출 대신)
      // 실제 환경에서는 아래 주석을 해제하고 mock 데이터 부분을 제거하세요
      
      /*
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`
      );
      
      if (!response.ok) {
        throw new Error('날씨 정보를 가져올 수 없습니다');
      }
      
      const data = await response.json();
      */
      
      // Mock 데이터 (실제 구현 시 제거)
      const mockWeatherData = {
        main: {
          temp: Math.round(Math.random() * 20 + 5), // 5-25도 랜덤
          humidity: Math.round(Math.random() * 40 + 40) // 40-80% 랜덤
        },
        weather: [{
          id: [0, 1, 2, 3, 61, 63, 65][Math.floor(Math.random() * 7)] // 랜덤 날씨 코드
        }],
        wind: {
          speed: Math.round(Math.random() * 10 + 1) // 1-11 m/s 랜덤
        },
        name: '서울'
      };
      
      const data = mockWeatherData;
      
      const weatherCode = data.weather[0].id;
      const temperature = Math.round(data.main.temp);
      const description = getWeatherDescription(weatherCode);
      const humidity = data.main.humidity;
      const windSpeed = data.wind.speed;
      const icon = getWeatherIcon(weatherCode);
      
      setWeatherData({
        temperature,
        description,
        humidity,
        windSpeed,
        location: data.name,
        icon,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('날씨 데이터 로드 오류:', error);
      setWeatherData(prev => ({
        ...prev,
        loading: false,
        error: '날씨 정보를 불러올 수 없습니다'
      }));
    }
  };

  // 컴포넌트 마운트 시 날씨 데이터 로드
  useEffect(() => {
    fetchWeatherData();
    
    // 10분마다 날씨 데이터 새로고침
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 온도에 따른 색상 결정
  const getTemperatureColor = (temp) => {
    if (temp < 0) return '#2196f3'; // 파란색 (매우 추움)
    if (temp < 10) return '#03a9f4'; // 연한 파란색 (추움)
    if (temp < 20) return '#4caf50'; // 초록색 (시원함)
    if (temp < 30) return '#ff9800'; // 주황색 (따뜻함)
    return '#f44336'; // 빨간색 (더움)
  };

  if (weatherData.loading) {
    return (
      <div className="mg-v2-card mg-v2-card-hover">
        <div className="mg-v2-card-body">
          <UnifiedLoading text="날씨 정보 로딩 중..." />
        </div>
      </div>
    );
  }

  if (weatherData.error) {
    return (
      <div className="mg-v2-card">
        <div className="mg-v2-card-body">
          <div className="mg-v2-empty-state">
            <AlertTriangle className="mg-v2-empty-state-icon" />
            <div className="mg-v2-empty-state-text">
              <h3>날씨 정보 오류</h3>
              <button
                className="mg-v2-button mg-v2-button--text mg-v2-button--sm"
                onClick={fetchWeatherData}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-card mg-v2-card-hover" onClick={fetchWeatherData} title="클릭하여 날씨 정보 새로고침">
      <div className="mg-v2-card-body">
        <div className="mg-v2-weather-container">
          <div 
            className="mg-v2-weather-icon"
            style={{ background: getTemperatureColor(weatherData.temperature) }}
          >
            <CloudSun size={24} color="white" />
          </div>
          
          <div className="mg-v2-weather-content">
            <h3 className="mg-v2-h3 mg-mb-sm">오늘의 날씨</h3>
            
            <div className="mg-v2-weather-temp">
              <span 
                className="mg-v2-temp-value"
                style={{ color: getTemperatureColor(weatherData.temperature) }}
              >
                {weatherData.temperature}°C
              </span>
              <span className="mg-v2-temp-description">{weatherData.description}</span>
            </div>
            
            <div className="mg-v2-weather-details">
              <span className="mg-v2-weather-detail">
                <Droplet size={14} />
                습도 {weatherData.humidity}%
              </span>
              <span className="mg-v2-weather-detail">
                <Wind size={14} />
                바람 {weatherData.windSpeed}m/s
              </span>
            </div>
            
            <div className="mg-v2-weather-location">
              <span className="mg-v2-text-xs mg-v2-color-text-secondary">{weatherData.location}</span>
              <RefreshCw size={12} className="mg-v2-color-text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
