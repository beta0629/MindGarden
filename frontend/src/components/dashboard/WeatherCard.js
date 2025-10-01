import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 날씨 정보 카드 컴포넌트
 * 실시간 날씨 정보를 표시합니다
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
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
          <span style={{ color: '#6c757d', fontSize: 'var(--font-size-sm)' }}>날씨 정보 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (weatherData.error) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <i className="bi bi-exclamation-triangle" style={{
            color: '#ffc107',
            fontSize: 'var(--font-size-xl)'
          }}></i>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: '#6c757d'
          }}>
            날씨 정보 오류
          </span>
        </div>
        <button
          onClick={fetchWeatherData}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    }}
    onClick={fetchWeatherData}
    title="클릭하여 날씨 정보 새로고침"
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: getTemperatureColor(weatherData.temperature),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <i className={`bi ${weatherData.icon}`} style={{
            color: 'white',
            fontSize: 'var(--font-size-xl)'
          }}></i>
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: '600',
            color: '#2c3e50',
            margin: '0 0 8px 0',
            lineHeight: '1.3'
          }}>
            오늘의 날씨
          </h3>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontSize: 'var(--font-size-xxl)',
              fontWeight: '700',
              color: getTemperatureColor(weatherData.temperature),
              marginRight: '8px'
            }}>
              {weatherData.temperature}°C
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: '#6c757d'
            }}>
              {weatherData.description}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: 'var(--font-size-xs)',
            color: '#6c757d'
          }}>
            <span>
              <i className="bi bi-droplet" style={{ marginRight: '4px' }}></i>
              습도 {weatherData.humidity}%
            </span>
            <span>
              <i className="bi bi-wind" style={{ marginRight: '4px' }}></i>
              바람 {weatherData.windSpeed}m/s
            </span>
          </div>
          
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: '#6c757d',
              fontWeight: '500'
            }}>
              {weatherData.location}
            </span>
            <i className="bi bi-arrow-clockwise" style={{
              fontSize: 'var(--font-size-xs)',
              color: '#6c757d'
            }}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
