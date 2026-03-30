# VacationStatsWidget

## 개요
휴가 통계를 보여주는 위젯

## 사용법
```javascript
{
  id: 'unique-widget-id',
  type: 'vacation-stats',
  position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
  config: {
    title: '위젯 제목',
    subtitle: '위젯 부제목',
    apiEndpoint: '/api/admin/vacation-stats'
  }
}
```

## Props
- **widget**: 위젯 설정 정보
- **user**: 현재 사용자 정보

## Config 옵션
- **title**: 위젯 제목 (기본값: '휴가 통계를 보여주는 위젯')
- **subtitle**: 위젯 부제목 (선택사항)
- **apiEndpoint**: API 엔드포인트 (기본값: '/api/admin/vacation-stats')

## API 연동
- **엔드포인트**: `/api/admin/vacation-stats`
- **메서드**: GET
- **응답 형식**: JSON

## 스타일링
CSS 클래스: `.widget-vacation-stats`

## 테스트
```bash
npm test -- VacationStatsWidget.test.js
```

## 스토리북
```bash
npm run storybook
```

## 생성 정보
- **생성일**: 2025-11-28
- **타입**: admin
- **API 사용**: 예
