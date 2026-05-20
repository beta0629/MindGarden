# Locales — i18n Phase 1 가이드

본 디렉터리는 프론트엔드(React SPA, `frontend/`) i18n 리소스를 보관합니다.
전략 합의는 `docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md`(예정)·본 README 를 SSOT 로 따릅니다.

## 구조

```
frontend/src/locales/
├── ko/
│   ├── common.json     # 공통 라벨(액션·상태) — Phase 1 시범
│   └── admin.json      # 어드민 도메인 (Phase 2 이후 확장)
└── README.md           # 본 문서
```

- 디렉터리 규칙: `frontend/src/locales/{lang}/{namespace}.json`
- 주 언어: `ko` (한국어). 영어 등 추가 언어는 Phase 2 이후 합의 후 도입.
- namespace 단위로 파일을 분리합니다. (Phase 1: `common`, `admin`)

## 키 명명 규칙

`domain.feature.element.purpose` 형식의 dot-notation 을 사용합니다.

| 예시 키                              | 의미                                |
| ------------------------------------ | ----------------------------------- |
| `action.save`                        | 공통 액션: 저장                     |
| `action.cancel`                      | 공통 액션: 취소                     |
| `status.loading`                     | 공통 상태: 로딩 중                  |
| `admin.dashboard.summary.title`      | 어드민 대시보드 요약 카드 제목 (예) |
| `admin.user.list.empty`              | 어드민 사용자 목록 빈 상태 (예)     |

- 키는 항상 소문자·dot 구분.
- 공통 도메인(액션·상태·날짜 등)은 `common` namespace.
- 화면/도메인 종속 라벨은 해당 도메인 namespace (`admin`, `client`, `consultant`, `schedule` 등).
- 너무 짧거나 의미가 모호한 키(예: `title`, `name`) 금지. 항상 도메인·맥락을 포함합니다.

## 사용법

```javascript
import { useTranslation } from 'react-i18next';

function SaveButton() {
  const { t } = useTranslation('common');
  return <button>{t('action.save', '저장')}</button>;
}
```

- 두 번째 인자는 **fallback 한글 문자열** 입니다. Phase 1 단계에서 권장합니다.
- 키가 누락되어도 fallback 한글이 렌더링되어 회귀(빈 문자열·키 노출)를 막을 수 있습니다.
- 다른 namespace 를 함께 사용하려면 `useTranslation(['common', 'admin'])` 후 `t('admin:dashboard.summary.title', '요약')` 처럼 prefix 를 사용합니다.

## 점진 도입 절차 (Phase 1 → Phase 2)

1. **Phase 1 (현재)** — 부트스트랩 + `common` namespace 시범 (≤ 3건). 기능 회귀 0 목표.
2. **Phase 2** — 핵심 화면 namespace 확장. 우선순위 예:
   - `admin.dashboard` (어드민 대시보드 카드·요약 라벨)
   - `schedule` (스케줄 표/필터 라벨)
   - `payment` (결제 흐름 라벨)
3. **언어 추가** — Phase 2 종료 후 영어/일본어 등 추가 여부 합의. 추가 시 `frontend/src/locales/en/...` 식으로 디렉터리 추가 + `src/i18n/index.js` `resources` 등록.

## 키 추가 절차

1. 적절한 namespace 파일(예: `ko/common.json`) 에 키-값 추가.
2. 동일 키를 다른 언어 namespace 파일에도 동일 키로 추가 (Phase 2 이후 다국어 도입 시).
3. 사용처에서 `t('key', '한글 fallback')` 으로 호출.
4. 빌드(`npm run build:ci`) 통과 + 기존 단위 테스트 통과 확인.

## 금지·주의

- 한글 fallback 없이 키만 호출(`t('action.save')`) 하지 않습니다. (Phase 1 한정)
- namespace 가 너무 커지면(>500 키) 도메인 단위로 분할합니다.
- 백엔드 메시지(서버 응답 message/code) 는 본 디렉터리 범위가 아닙니다. 별도 합의 후 도입.
- `expo-app/`, `frontend-trinity/`, `frontend-ops/` 는 본 i18n 범위에 포함되지 않습니다.

## 참조

- `frontend/src/i18n/index.js` — 초기화 코드
- `react-i18next` 공식 문서: https://react.i18next.com/
