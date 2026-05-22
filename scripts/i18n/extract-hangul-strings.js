#!/usr/bin/env node

/**
 * i18n Phase 2.1a — 빈도 상위 한글 문자열 추출 스크립트 (dry-run 전용)
 *
 * 합의: docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md §6.1 C-i3
 *   - 자동 추출 + 휴먼 리뷰 채택
 *   - 본 스크립트는 추출/리포트만 수행하며, 소스 코드를 절대 수정하지 않는다.
 *
 * 입력: frontend/src/**\/*.{js,jsx,ts,tsx}
 * 출력: scripts/i18n/reports/extracted-hangul-{YYYYMMDD-HHmm}.json
 *
 * 차단(무시 대상):
 *   - 주석(//, /* * /, JSDoc) 내부 문자열
 *   - import/require 경로
 *   - 이미 t(...) / i18n.t(...) 1번째 인자에 들어 있는 키 형태
 *   - console.* / logger.* 인자 (디버그 메시지)
 *   - 테스트 파일(*.test.*, __tests__/, *.spec.*)
 *   - 스토리북(*.stories.*)
 *   - .json/.md/.yaml/.css 등 비코드 파일
 *
 * namespace 휴리스틱(§3 namespace 분할):
 *   - components/admin -> admin
 *   - components/auth  -> auth
 *   - components/client -> client
 *   - components/wellness, components/meditation -> wellness
 *   - components/erp, components/billing, components/payment -> erp
 *   - components/consultation, components/clinical, components/psych -> clinical
 *   - 그 외(common, base, ui, hooks, utils, constants ...) -> common
 *
 * §6.2 보강 매핑 (2026-05-22 사용자 컨펌, common 비중 ≤ 45% 목표):
 *   - components/consultant -> clinical    (상담사 도구 = 임상 도메인)
 *   - components/schedule   -> common 유지 (cross-cutting: 어드민·내담자 양쪽 공유)
 *   - components/dashboard  -> admin       (어드민 대시보드 위주)
 *   - components/settings   -> admin       (설정 페이지 = 어드민)
 *   - components/community  -> client      (커뮤니티 = 내담자)
 *   - components/academy    -> client      (아카데미 = 내담자)
 *   - components/shop       -> client      (쇼핑몰 = 내담자)
 *   - components/statistics -> admin       (통계 = 어드민)
 *
 * §6.3 추가 보강 매핑 (2026-05-22 사용자 컨펌, common 비중 ≤ 45% 목표 재시도):
 *   - components/dashboard-v2 -> admin     (어드민 대시보드 V2)
 *   - components/tenant       -> admin     (테넌트 관리 = 어드민)
 *   - components/super-admin  -> admin     (슈퍼 어드민)
 *   - components/compliance   -> admin     (컴플라이언스 = 어드민)
 *   - components/ops          -> admin     (운영 도구 = 어드민)
 *   - components/finance      -> erp       (재무 = ERP 도메인)
 *   - components/training     -> client    (교육/학원 확장 시 academy 와 동일 도메인)
 *   - components/mypage       -> common 유지 (cross-cutting: 사용자 공통)
 *   - components/notifications-> common 유지 (cross-cutting: 알림은 전 영역 공유)
 *
 * 사용:
 *   node scripts/i18n/extract-hangul-strings.js
 *   node scripts/i18n/extract-hangul-strings.js --report-only
 *
 * @author Core Solution
 * @since 2026-05-22
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCAN_ROOT = path.join(ROOT, 'frontend', 'src');
const REPORT_DIR = path.join(__dirname, 'reports');
const TOP_PER_NAMESPACE = 50;

const ALL_NAMESPACES = ['common', 'admin', 'clinical', 'client', 'erp', 'auth', 'wellness'];

const HANGUL_REGEX = /[\uac00-\ud7a3]/;
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'build',
  'dist',
  '.next',
  '.cache',
  'coverage',
  '__snapshots__'
]);

const EXCLUDED_FILE_SUFFIXES = [
  '.test.js',
  '.test.jsx',
  '.test.ts',
  '.test.tsx',
  '.spec.js',
  '.spec.jsx',
  '.spec.ts',
  '.spec.tsx',
  '.stories.js',
  '.stories.jsx',
  '.stories.ts',
  '.stories.tsx',
  '.d.ts'
];

const EXCLUDED_DIR_SEGMENTS = ['__tests__', '__mocks__'];

// 호출형 휴리스틱(콘솔/로거 등) — 한글 인자라도 i18n 후보에서 제외
const LOG_CALL_PATTERNS = [
  /\bconsole\s*\.\s*(log|warn|error|info|debug|trace)\b/,
  /\blogger\s*\.\s*(log|warn|error|info|debug|trace)\b/
];

const TRANSLATE_CALL_PATTERNS = [
  /\bt\s*\(/,
  /\bi18n\s*\.\s*t\s*\(/
];

const TRANSLATE_KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/;

const ACTION_KEYWORDS = [
  '저장', '취소', '확인', '닫기', '삭제', '수정', '추가', '편집',
  '등록', '조회', '검색', '필터', '리셋', '초기화', '복사', '붙여넣기',
  '업로드', '다운로드', '내보내기', '가져오기', '인쇄', '발송', '전송',
  '승인', '반려', '거절', '결제', '환불', '취소요청', '로그인', '로그아웃',
  '회원가입', '뒤로', '다음', '이전', '완료', '시작', '재시작', '중지'
];

const LABEL_KEYWORDS = [
  '이름', '이메일', '전화', '연락처', '주소', '제목', '내용', '설명',
  '날짜', '시간', '기간', '상태', '유형', '구분', '카테고리', '분류',
  '비밀번호', '아이디', '권한', '역할', '소속', '지점', '부서',
  '가격', '금액', '수량', '단위', '비고', '메모', '코드', '번호'
];

const MESSAGE_HINTS = [
  '입니다', '되었습니다', '없습니다', '있습니다', '하시겠습니까', '주세요',
  '바랍니다', '실패', '성공', '오류', '완료', '확인해', '필요합니다',
  '권한이', '존재하지', '동일한', '필수', '확인해주세요'
];

const PUNCT_HINTS = [/[.?!](\s|$)/, /~$/, /다\s*\.?$/];

// 1차 사전 (Phase 2.1a 초기 합의분) — 기존 항목 무수정 유지
// 2026-05-22 사용자 컨펌: 본 라인 60단어는 절대 덮어쓰지 않는다.
const BASE_TRANSLATIONS = {
  '저장': 'save',
  '취소': 'cancel',
  '확인': 'confirm',
  '닫기': 'close',
  '삭제': 'delete',
  '수정': 'edit',
  '추가': 'add',
  '편집': 'edit',
  '등록': 'register',
  '조회': 'search',
  '검색': 'search',
  '필터': 'filter',
  '리셋': 'reset',
  '초기화': 'reset',
  '복사': 'copy',
  '업로드': 'upload',
  '다운로드': 'download',
  '내보내기': 'export',
  '가져오기': 'import',
  '인쇄': 'print',
  '발송': 'send',
  '전송': 'send',
  '승인': 'approve',
  '반려': 'reject',
  '거절': 'reject',
  '결제': 'pay',
  '환불': 'refund',
  '로그인': 'login',
  '로그아웃': 'logout',
  '회원가입': 'signup',
  '뒤로': 'back',
  '다음': 'next',
  '이전': 'prev',
  '완료': 'done',
  '시작': 'start',
  '재시작': 'restart',
  '중지': 'stop',
  '이름': 'name',
  '이메일': 'email',
  '전화': 'phone',
  '연락처': 'contact',
  '주소': 'address',
  '제목': 'title',
  '내용': 'content',
  '설명': 'description',
  '날짜': 'date',
  '시간': 'time',
  '기간': 'period',
  '상태': 'status',
  '유형': 'type',
  '구분': 'type',
  '카테고리': 'category',
  '분류': 'category',
  '비밀번호': 'password',
  '아이디': 'userId',
  '권한': 'permission',
  '역할': 'role',
  '소속': 'affiliation',
  '지점': 'branch',
  '부서': 'department',
  '가격': 'price',
  '금액': 'amount',
  '수량': 'quantity',
  '단위': 'unit',
  '비고': 'note',
  '메모': 'memo',
  '코드': 'code',
  '번호': 'number'
};

// 2차 사전 — actions 카테고리 (동사형, `<ns>.actions.<key>`)
// 2026-05-22 사용자 컨펌 확장 + 7 ns Top 50 4차 보강
const ACTION_DICTIONARY = {
  '새로고침': 'refresh',
  '붙여넣기': 'paste',
  '잘라내기': 'cut',
  '되돌리기': 'undo',
  '다시실행': 'redo',
  '더보기': 'viewMore',
  '접기': 'collapse',
  '펼치기': 'expand',
  '선택': 'select',
  '해제': 'deselect',
  '처음': 'first',
  '마지막': 'last',
  '종료': 'end',
  '일시정지': 'pause',
  '재개': 'resume',
  '공유': 'share',
  '보내기': 'send',
  '답장': 'reply',
  '전달': 'forward',
  '비밀번호변경': 'changePassword',
  '재생': 'play',
  '보기': 'view',
  '숨기기': 'hide',
  '가입': 'join',
  '다시 시도': 'retry',
  '상세 보기': 'viewDetail',
  '전체 보기': 'viewAll',
  '데이터 새로고침': 'refreshData',
  '목록 새로고침': 'refreshList',
  '기분 선택': 'moodSelect',
  '기간 선택': 'periodSelect',
  '본사 로그인': 'headquartersLogin',
  '지점 로그인': 'branchLogin',
  '간편 회원가입': 'easySignup',
  '계정 활성화': 'accountActivation',
  '계정 통합': 'accountIntegration',
  '기관 코드 입력': 'enterOrgCode',
  '구매 요청 거부': 'rejectPurchaseRequest',
  '걱정 시간 정하기': 'setWorryTime',
  '건강한 경계 설정하기': 'setHealthyBoundary'
};

// 2차 사전 — labels 카테고리 (명사형, `<ns>.labels.<key>`)
// 2026-05-22 사용자 컨펌 확장 + 7 ns Top 50 4차 보강
const LABEL_DICTIONARY = {
  '내담자': 'client',
  '상담사': 'consultant',
  '활성': 'active',
  '비활성': 'inactive',
  '알 수 없음': 'unknown',
  '없음': 'none',
  '있음': 'exists',
  '기타': 'other',
  '전체': 'all',
  '전화번호': 'phoneNumber',
  '생년월일': 'birthDate',
  '성별': 'gender',
  '남성': 'male',
  '여성': 'female',
  '메시지': 'message',
  '알림': 'notification',
  '설정': 'settings',
  '프로필': 'profile',
  '결제 내역': 'paymentHistory',
  '회기 관리': 'sessionManagement',
  '정보 없음': 'noInformation',
  '데이터 없음': 'noData',
  '구매 관리': 'purchaseManagement',
  '운영 현황': 'operationStatus',
  '상담일지 작성': 'writeConsultationLog',
  '비밀번호 표시': 'showPassword',
  '비밀번호 숨기기': 'hidePassword',
  '웰니스 알림': 'wellnessNotification',
  '관계 스킬': 'relationshipSkill',
  '불안 관리': 'anxietyManagement',
  '인지행동 팁': 'cognitiveBehavioralTip',
  '자연소리': 'natureSound',
  '사용자': 'user',
  '관리자': 'administrator',
  '사무원': 'clerk',
  '휴가': 'vacation',
  '예약': 'reservation',
  '예약됨': 'reserved',
  '취소됨': 'cancelled',
  '거부됨': 'rejected',
  '승인됨': 'approved',
  '완료됨': 'completed',
  '미완료': 'incomplete',
  '진행중': 'inProgress',
  '대기': 'pending',
  '대기중': 'waiting',
  '미지정': 'unassigned',
  '예정': 'scheduled',
  '실패': 'failed',
  '오늘': 'today',
  '일반': 'general',
  '긴급': 'urgent',
  '중요': 'important',
  '위험': 'danger',
  '보통': 'normal',
  '높음': 'high',
  '낮음': 'low',
  '좋음': 'good',
  '나쁨': 'bad',
  '매우 좋음': 'veryGood',
  '매우 나쁨': 'veryBad',
  '불안': 'anxiety',
  '우울': 'depression',
  '스트레스': 'stress',
  '관계': 'relationship',
  '수면': 'sleep',
  '호흡': 'breathing',
  '마음챙김': 'mindfulness',
  '마음챙김 가이드': 'mindfulnessGuide',
  '자존감 향상': 'selfEsteemBoost',
  '알림 상세': 'notificationDetail',
  '4-7-8 호흡법': 'breath478',
  '북마크': 'bookmark',
  '즐겨찾기': 'favorite',
  '대시보드': 'dashboard',
  '내 대시보드': 'myDashboard',
  '내담자 대시보드': 'clientDashboard',
  '마이페이지': 'myPage',
  '스케줄': 'schedule',
  '상담': 'consultation',
  '상담료': 'consultationFee',
  '초기상담': 'initialConsultation',
  '가족상담': 'familyConsultation',
  '부부상담': 'coupleConsultation',
  '다음 상담': 'nextConsultation',
  '상담 내역': 'consultationHistory',
  '상담 리포트': 'consultationReport',
  '상담기록 조회': 'viewConsultationRecord',
  '내담자 목록': 'clientList',
  '내담자 관리': 'clientManagement',
  '사용자 관리': 'userManagement',
  '상담사 관리': 'consultantManagement',
  '권한 관리': 'permissionManagement',
  '시스템 관리': 'systemManagement',
  '시스템 설정': 'systemSettings',
  '매칭 관리': 'matchingManagement',
  '매핑 관리': 'mappingManagement',
  '세무 관리': 'taxManagement',
  '예산 관리': 'budgetManagement',
  '결제 대기': 'paymentPending',
  '결제 확인': 'paymentConfirm',
  '결제 방법': 'paymentMethod',
  '결제 상태': 'paymentStatus',
  '결제완료': 'paymentCompleted',
  '신용카드': 'creditCard',
  '계좌이체': 'bankTransfer',
  '현금': 'cash',
  '카카오': 'kakao',
  '구매 요청': 'purchaseRequest',
  '구매 요청 본문': 'purchaseRequestBody',
  '가격 정책': 'pricingPolicy',
  '시작일': 'startDate',
  '종료일': 'endDate',
  '등록일': 'registrationDate',
  '1일 전': 'oneDayAgo',
  '최근 7일': 'last7Days',
  '최근 1개월': 'last1Month',
  '최근 3개월': 'last3Months',
  '최근 1년': 'last1Year',
  '매월 말일': 'endOfMonth',
  '대체공휴일': 'substituteHoliday',
  '설날 연휴': 'lunarNewYearHolidays',
  '추석 연휴': 'chuseokHolidays',
  '월': 'monday',
  '화': 'tuesday',
  '수': 'wednesday',
  '목': 'thursday',
  '금': 'friday',
  '토': 'saturday',
  '일': 'sunday',
  '과목': 'subject',
  '강의실': 'classroom',
  '강좌명': 'courseName',
  '계산 건수': 'calculationCount',
  '급여 기산일 설정': 'salaryBaseDateSettings',
  '급여·세금 관리 콘텐츠': 'salaryTaxManagementContent',
  '감정 추이 차트': 'emotionTrendChart',
  '감정 일기': 'emotionDiary',
  '5-4-3-2-1 기법': 'technique54321',
  '갈등 해결의 윈-윈 접근법': 'winWinConflictResolution',
  '작업': 'task',
  '작업 완료': 'taskCompleted',
  '과제 안내': 'assignmentGuide',
  '후속 조치': 'followUp',
  '120분': 'minutes120',
  '120분 상담': 'consultation120Min',
  '30분': 'minutes30',
  'PG 설정 목록': 'pgSettingsList',
  'PG 설정 상세': 'pgSettingsDetail',
  'PG 설정 수정': 'editPgSettings',
  'PG 설정 승인 관리': 'pgApprovalManagement',
  '강좌 ID': 'courseId',
  '6자리 인증 코드': 'sixDigitAuthCode',
  '서브도메인': 'subdomain',
  '계정 통합 완료': 'accountIntegrationCompleted',
  '계정 활성화 완료': 'accountActivationCompleted',
  '개인정보 수집 및 이용 동의': 'privacyConsent',
  '개인정보처리방침': 'privacyPolicy'
};

// 2차 사전 — messages 카테고리 (상태·안내, `<ns>.messages.<key>`)
// 2026-05-22 사용자 컨펌 확장 + 7 ns Top 50 4차 보강
const MESSAGE_DICTIONARY = {
  '데이터를 불러오는 중...': 'loadingData',
  '공통 코드를 불러오는데 실패했습니다.': 'commonCodeLoadFailed',
  '등록되었습니다': 'registered',
  '삭제되었습니다': 'deleted',
  '저장되었습니다': 'saved',
  '수정되었습니다': 'updated',
  '카테고리를 선택하세요': 'selectCategory',
  '잠시만 기다려주세요': 'pleaseWait',
  '처리 중입니다': 'processing',
  '권한이 없습니다': 'noPermission',
  '다시 시도해주세요': 'pleaseRetry',
  '네트워크 오류': 'networkError',
  '서버 오류': 'serverError',
  '로딩 중...': 'loading',
  '로딩중...': 'loadingShort',
  '처리 중...': 'processingInline',
  '선택하세요': 'pleaseSelect',
  '접근 권한이 없습니다.': 'noAccessPermission',
  '데이터를 불러오는 중 오류가 발생했습니다.': 'dataLoadError',
  '데이터가 없습니다.': 'noDataMessage',
  '로그인이 필요합니다.': 'loginRequired',
  '로그인에 성공했습니다.': 'loginSuccess',
  '비밀번호를 입력하세요': 'enterPassword',
  '이메일을 입력하세요': 'enterEmail',
  '이메일을 입력해주세요.': 'pleaseEnterEmail',
  '이메일과 비밀번호를 입력해주세요.': 'enterEmailAndPassword',
  '비밀번호가 일치하지 않습니다.': 'passwordMismatch',
  '비밀번호는 8자 이상이어야 합니다.': 'passwordMinLength',
  '6자리 인증 코드를 입력하세요': 'enterSixDigitAuthCode',
  '8자 이상 입력하세요': 'enterEightOrMore',
  '테넌트 정보가 없습니다': 'noTenantInfo',
  '지점 목록을 불러오는데 실패했습니다.': 'branchListLoadFailed',
  '회원가입에 실패했습니다.': 'signupFailed',
  '간편 회원가입이 필요합니다': 'easySignupRequired',
  '개인정보 수집 및 이용 동의와 이용약관에 동의해주세요.': 'agreePrivacyAndTerms',
  '개인정보처리방침에 동의해주세요.': 'agreePrivacyPolicy',
  '계정 통합 중 오류가 발생했습니다.': 'accountIntegrationError',
  '계정 통합에 실패했습니다.': 'accountIntegrationFailed',
  '계정 통합이 완료되었습니다!': 'accountIntegrationCompletedMsg',
  '계정을 활성화합니다': 'activateAccount',
  '계정이 활성화되었습니다. 다시 로그인해주세요.': 'accountActivatedRelogin',
  '구글 로그인을 시작할 수 없습니다.': 'googleLoginFailed',
  '기관 코드 확인 중 오류가 발생했습니다.': 'orgCodeCheckError',
  '기관 코드를 입력해주세요.': 'pleaseEnterOrgCode',
  '기존 계정 비밀번호를 입력해주세요.': 'pleaseEnterExistingPassword',
  '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.': 'userInfoNotFoundRelogin',
  '환불 데이터를 불러오는 중...': 'loadingRefundData',
  '거부 처리에 실패했습니다.': 'rejectFailed',
  '승인 대기 목록을 불러오는데 실패했습니다.': 'approvalPendingListLoadFailed',
  '승인 처리에 실패했습니다.': 'approveFailed',
  '거부 사유를 입력하세요...': 'enterRejectReason',
  '계정과목을 선택해주세요.': 'pleaseSelectAccount',
  '공통 코드를 불러오는 중...': 'loadingCommonCode',
  '급여 계산 미리보기가 완료되었습니다.': 'salaryPreviewCompleted',
  '급여 계산에 실패했습니다.': 'salaryCalculationFailed',
  '기준일자는 필수입니다.': 'baseDateRequired',
  '메시지 전송 중 오류가 발생했습니다.': 'messageSendError',
  '메시지 전송에 실패했습니다.': 'messageSendFailed',
  '메시지 제목을 입력하세요': 'enterMessageTitle',
  '세션 정보를 불러오는 중...': 'loadingSessionInfo',
  '완료 처리 중 오류가 발생했습니다.': 'completeError',
  '저장 중 오류가 발생했습니다.': 'saveError',
  '✅ 저장되었습니다.': 'savedSuccess',
  '❌ 저장에 실패했습니다.': 'saveFailed',
  '알림을 불러오는 중 오류가 발생했습니다.': 'notificationLoadError',
  '알림을 불러오는데 실패했습니다.': 'notificationLoadFailed',
  '알림을 불러올 수 없습니다.': 'notificationUnavailable',
  '요청하신 알림을 찾을 수 없습니다.': 'notificationNotFound',
  '웰니스 알림을 불러오는 중...': 'loadingWellnessNotification',
  '10-15분간 계속하세요': 'continue10To15Min',
  '5-10분간 계속하세요': 'continue5To10Min',
  '15초 뒤로': 'rewind15Sec',
  '15초 앞으로': 'forward15Sec',
  '4박자로 멈춘 후 다시 시작하세요': 'pauseAndRestart4Beat',
  '4박자로 숨을 내쉬세요': 'exhale4Beat',
  '4박자로 숨을 들이마시세요': 'inhale4Beat',
  '4박자로 숨을 참으세요': 'hold4Beat',
  '가슴은 움직이지 않고 배만 움직이도록 하세요': 'moveBellyOnly',
  '가족에게 "당신은 행복하길 바란다"고 말하세요': 'tellFamilyHappiness',
  '각 부위를 5초간 긴장시킨 후 완전히 이완시키세요': 'tenseAndRelax5Sec',
  '갈등 없이 진심을 전하는 마샬 로젠버그의 대화법.': 'marshallRosenbergConversation',
  '감정을 기록하고 이해하는 방법': 'emotionRecordingMethod',
  '감정의 원인을 생각해보세요': 'thinkEmotionCause',
  '걱정을 특정 시간에 몰아서 하는 역설적 기법.': 'worryTimeTechnique'
};

// 통합 사전 — 카테고리별 사전을 머지. 기존 BASE_TRANSLATIONS 항목은 후순위 덮어쓰기를 방지하기 위해 가장 뒤에 둔다.
// (사용자 컨펌: "기존 항목 무수정 — 덮어쓰기 충돌 방지")
const COMMON_TRANSLATIONS = {
  ...ACTION_DICTIONARY,
  ...LABEL_DICTIONARY,
  ...MESSAGE_DICTIONARY,
  ...BASE_TRANSLATIONS
};

function parseArgs(argv) {
  const args = { reportOnly: false };
  for (const token of argv.slice(2)) {
    if (token === '--report-only') {
      args.reportOnly = true;
    }
  }
  return args;
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());
  return `${yyyy}${mm}${dd}-${hh}${mi}`;
}

function shouldSkipFile(absPath) {
  const lower = absPath.toLowerCase();
  for (const suffix of EXCLUDED_FILE_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return true;
    }
  }
  for (const seg of EXCLUDED_DIR_SEGMENTS) {
    if (lower.includes(`${path.sep}${seg}${path.sep}`)) {
      return true;
    }
  }
  return false;
}

function classifyNamespace(relPathFromFrontendSrc) {
  const normalized = relPathFromFrontendSrc.split(path.sep).join('/');

  // 1차 매핑 (Phase 2.1a, §3 namespace 분할)
  if (normalized.startsWith('components/admin/')) {
    return 'admin';
  }
  if (normalized.startsWith('components/auth/') || normalized.startsWith('pages/auth/')) {
    return 'auth';
  }
  if (normalized.startsWith('components/client/')) {
    return 'client';
  }
  if (normalized.startsWith('components/wellness/') || normalized.startsWith('components/meditation/')) {
    return 'wellness';
  }
  if (
    normalized.startsWith('components/erp/') ||
    normalized.startsWith('components/billing/') ||
    normalized.startsWith('components/payment/')
  ) {
    return 'erp';
  }
  // 주의: consultation 과 consultant 는 다른 prefix (`consultation/` vs `consultant/`).
  // startsWith 로 정확히 분리되므로 평가 순서 충돌 없음.
  if (
    normalized.startsWith('components/consultation/') ||
    normalized.startsWith('components/clinical/') ||
    normalized.startsWith('components/psych/')
  ) {
    return 'clinical';
  }

  // §6.2 보강 매핑 (2026-05-22 사용자 컨펌, common 비중 ≤ 45% 목표)
  // 출처: docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md §6.2
  if (normalized.startsWith('components/consultant/')) {
    // 상담사 도구 = 임상 도메인
    return 'clinical';
  }
  if (
    normalized.startsWith('components/dashboard/') ||
    normalized.startsWith('components/settings/') ||
    normalized.startsWith('components/statistics/')
  ) {
    // 어드민 대시보드/설정/통계 = 어드민 도메인
    return 'admin';
  }
  if (
    normalized.startsWith('components/community/') ||
    normalized.startsWith('components/academy/') ||
    normalized.startsWith('components/shop/')
  ) {
    // 커뮤니티/아카데미/쇼핑몰 = 내담자 도메인
    return 'client';
  }
  // components/schedule/** 는 cross-cutting 으로 의도적으로 common 유지 (§6.2 표 그대로)

  // §6.3 추가 보강 매핑 (2026-05-22 사용자 컨펌, common 비중 ≤ 45% 목표 재시도)
  // 출처: docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md §6.3
  // 주의: 'components/dashboard-v2/' 와 §6.2 의 'components/dashboard/' 는
  //       trailing '/' 분리로 startsWith 충돌이 없음 (둘 다 admin 으로 매핑되어 무해).
  //       그래도 의도 명시를 위해 dashboard-v2 를 본 §6.3 블록에 별도 선언한다.
  if (
    normalized.startsWith('components/dashboard-v2/') ||
    normalized.startsWith('components/tenant/') ||
    normalized.startsWith('components/super-admin/') ||
    normalized.startsWith('components/compliance/') ||
    normalized.startsWith('components/ops/')
  ) {
    // 어드민 대시보드 V2 / 테넌트 / 슈퍼 어드민 / 컴플라이언스 / 운영 = 어드민 도메인
    return 'admin';
  }
  if (normalized.startsWith('components/finance/')) {
    // 재무 = ERP 도메인
    return 'erp';
  }
  if (normalized.startsWith('components/training/')) {
    // 교육 카테고리, 학원 확장 시 academy 와 동일 내담자 도메인 (§6.3 사용자 자유응답)
    return 'client';
  }
  // components/mypage/**, components/notifications/** 는 cross-cutting 으로 common 유지 (§6.3 컨펌)

  return 'common';
}

function listSourceFiles(rootDir) {
  const results = [];
  if (!fs.existsSync(rootDir)) {
    return results;
  }
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (err) {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const ext = path.extname(entry.name);
      if (!SOURCE_EXTENSIONS.has(ext)) {
        continue;
      }
      if (shouldSkipFile(full)) {
        continue;
      }
      results.push(full);
    }
  }
  return results;
}

/**
 * 한 줄 단위로 주석/import/console 호출 등을 제거한 뒤,
 * 단순 문자열 리터럴 정규식으로 한글 후보를 추출한다.
 *
 * Babel 파서가 없는 환경에서도 동작하도록 정규식 폴백으로 구현.
 * (i18n 전략 합의서: 신규 라이브러리 추가 금지 — Node 내장 + 정규식 폴백 허용)
 */
function extractFromSource(source) {
  const extracted = [];
  if (!source || !HANGUL_REGEX.test(source)) {
    return extracted;
  }

  // 1) 블록 주석 / JSDoc 제거 (라인 번호 유지를 위해 줄바꿈 보존)
  const noBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\n]/g, ' ');
  });

  const lines = noBlockComments.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const lineNumber = i + 1;

    // 2) import / require / from 경로 라인은 통째로 스킵
    const importLike = /^\s*(import|export)\s|require\s*\(/;
    if (importLike.test(rawLine) && !/[\uac00-\ud7a3]/.test(rawLine.replace(/['"`][^'"`]*['"`]/g, ''))) {
      // import 라인에서도 한글은 거의 없지만, 혹시 모를 노이즈를 제거
      continue;
    }

    // 3) 라인 주석 제거 — 단, 문자열 안의 // 는 보호한다.
    const lineWithoutComment = stripLineComment(rawLine);
    if (!HANGUL_REGEX.test(lineWithoutComment)) {
      continue;
    }

    // 4) 콘솔/로거 호출 라인 통째로 스킵
    if (LOG_CALL_PATTERNS.some((re) => re.test(lineWithoutComment))) {
      continue;
    }

    // 5) 문자열 리터럴 추출 (single/double/backtick)
    const literalRegex = /(['"`])((?:\\.|(?!\1).)*?)\1/g;
    let match;
    while ((match = literalRegex.exec(lineWithoutComment)) !== null) {
      const quote = match[1];
      const rawValue = match[2];
      const matchStart = match.index;

      if (!HANGUL_REGEX.test(rawValue)) {
        continue;
      }

      // 템플릿 리터럴은 보간 식이 들어가면 추출이 부정확하므로 제외
      if (quote === '`' && /\$\{/.test(rawValue)) {
        continue;
      }

      // 5-1) 이미 t(...) 호출 1번째 인자인 경우 → 키 라인은 스킵
      if (isInsideTranslateFirstArg(lineWithoutComment, matchStart)) {
        // 1번째 인자가 키 패턴이면 키로 간주하고 스킵
        if (TRANSLATE_KEY_PATTERN.test(rawValue)) {
          continue;
        }
        // 그 외(=fallback 한글 인자)는 이미 i18n 대상이므로 스킵
        continue;
      }

      const text = normalizeLiteral(rawValue);
      if (!text) {
        continue;
      }
      // 5-2) 너무 짧거나 한글이 1자 미만이면 스킵
      if (text.replace(/\s/g, '').length === 0) {
        continue;
      }
      // 5-3) 의미 없는 한 글자만 있는 경우는 노이즈가 많으므로 스킵
      const hangulCount = (text.match(/[\uac00-\ud7a3]/g) || []).length;
      if (hangulCount === 0) {
        continue;
      }

      extracted.push({
        text,
        line: lineNumber
      });
    }
  }
  return extracted;
}

function stripLineComment(line) {
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';
    if (ch === '\\' && (inSingle || inDouble || inBacktick)) {
      i += 1; // skip escaped char
      continue;
    }
    if (ch === '\'' && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      continue;
    }
    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '/' && line[i + 1] === '/') {
        return line.slice(0, i);
      }
    }
    void prev;
  }
  return line;
}

function isInsideTranslateFirstArg(line, literalStartIndex) {
  // line 의 [0..literalStartIndex) 범위 끝부분에 `t(` 또는 `i18n.t(` 가 있고
  // 사이에 쉼표/괄호 종료가 없으면 1번째 인자로 간주한다.
  const head = line.slice(0, literalStartIndex);
  for (const re of TRANSLATE_CALL_PATTERNS) {
    const all = [...head.matchAll(new RegExp(re.source, 'g'))];
    if (all.length === 0) {
      continue;
    }
    const last = all[all.length - 1];
    const callOpenIndex = last.index + last[0].length;
    const between = head.slice(callOpenIndex);
    // 1번째 인자 판단: 사이에 쉼표/닫는 괄호 없음, 또한 열린 중첩 괄호 없음
    if (!/[,)]/.test(stripStrings(between))) {
      return true;
    }
  }
  return false;
}

function stripStrings(input) {
  return input.replace(/(['"`])(?:\\.|(?!\1).)*?\1/g, '""');
}

function normalizeLiteral(raw) {
  // \n, \t 등 이스케이프를 그대로 두고, 좌우 공백만 제거
  return raw.trim();
}

function buildAccumulator() {
  return new Map();
}

function recordOccurrence(acc, text, namespace, relFile) {
  if (!acc.has(text)) {
    acc.set(text, {
      text,
      occurrences: 0,
      namespaces: new Set(),
      files: new Set()
    });
  }
  const entry = acc.get(text);
  entry.occurrences += 1;
  entry.namespaces.add(namespace);
  entry.files.add(relFile);
}

function asciiSlug(input, fallback) {
  const trans = COMMON_TRANSLATIONS[input];
  if (trans) {
    return trans;
  }
  const onlyAscii = input.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (onlyAscii && /[A-Za-z]/.test(onlyAscii)) {
    return onlyAscii.toLowerCase();
  }
  return fallback;
}

// 동사형 종결 휴리스틱 — 사전 미매칭 시 추가 분류 단서
// (사용자 컨펌 §2: "~하기", "~합니다", "~되었습니다" 등은 actions/messages 카테고리)
const VERB_ENDING_ACTION_REGEX = /(하기|보기|넣기|닫기|열기|짓기|새로고침|되돌리기|불러오기)$/;
const VERB_ENDING_MESSAGE_REGEX = /(하세요|합니다|했습니다|되었습니다|입니다|주세요|드립니다|하시겠습니까|바랍니다|필요합니다)$/;

// 명사 끝 휴리스틱 — 사전 미매칭 시 라벨 분류 단서
// (사용자 컨펌 §2: "~자", "~사", "~인", "~점" 등 명사 종결)
const NOUN_ENDING_LABEL_REGEX = /(자|사|인|점|률|율|성|성별|일자|시각|코드|항목|건수|건|값|명|편|번|회|차|단계|상태|구분|종류|등급|단위)$/;

function classifyKind(text) {
  if (ACTION_KEYWORDS.some((kw) => text === kw || text.endsWith(kw))) {
    return 'actions';
  }
  if (MESSAGE_HINTS.some((hint) => text.includes(hint)) || PUNCT_HINTS.some((re) => re.test(text))) {
    return 'messages';
  }
  if (LABEL_KEYWORDS.some((kw) => text === kw || text.endsWith(kw))) {
    return 'labels';
  }
  // ─ fallback 휴리스틱 (사용자 컨펌 §2): 동사형 우선 → 명사 끝 → 길이 보조 ─
  if (VERB_ENDING_MESSAGE_REGEX.test(text)) {
    return 'messages';
  }
  if (VERB_ENDING_ACTION_REGEX.test(text)) {
    return 'actions';
  }
  if (NOUN_ENDING_LABEL_REGEX.test(text)) {
    return 'labels';
  }
  if (text.length <= 8) {
    return 'labels';
  }
  return 'messages';
}

function suggestKey(text, namespace, index) {
  const kind = classifyKind(text);
  const fallbackSlug = `auto_${String(index).padStart(4, '0')}`;
  const slug = asciiSlug(text, fallbackSlug);
  return `${namespace}.${kind}.${slug}`;
}

function topItems(list, limit) {
  return list.slice(0, limit);
}

function serializeEntry(entry, namespace, indexSeed) {
  return {
    text: entry.text,
    occurrences: entry.occurrences,
    namespaces: Array.from(entry.namespaces).sort(),
    files: Array.from(entry.files).sort(),
    suggestedKey: suggestKey(entry.text, namespace, indexSeed)
  };
}

function main() {
  const args = parseArgs(process.argv);
  void args; // reportOnly 는 dry-run 강조용. 본 스크립트는 항상 dry-run.

  if (!fs.existsSync(SCAN_ROOT)) {
    console.error(`[i18n-extract] 스캔 대상 경로가 존재하지 않습니다: ${SCAN_ROOT}`);
    process.exit(1);
  }
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const files = listSourceFiles(SCAN_ROOT);
  console.log(`[i18n-extract] 스캔 대상 파일 수: ${files.length}`);

  const perNamespace = new Map();
  for (const ns of ALL_NAMESPACES) {
    perNamespace.set(ns, buildAccumulator());
  }

  let totalOccurrences = 0;
  for (const filePath of files) {
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      continue;
    }
    if (!HANGUL_REGEX.test(source)) {
      continue;
    }
    const relFromSrc = path.relative(SCAN_ROOT, filePath);
    const relFromRoot = path.relative(ROOT, filePath).split(path.sep).join('/');
    const namespace = classifyNamespace(relFromSrc);
    const acc = perNamespace.get(namespace);
    const items = extractFromSource(source);
    for (const item of items) {
      recordOccurrence(acc, item.text, namespace, relFromRoot);
      totalOccurrences += 1;
    }
  }

  let totalUniqueStrings = 0;
  const byNamespace = {};
  const topByNamespace = {};
  const all = [];
  let indexCounter = 0;

  for (const ns of ALL_NAMESPACES) {
    const acc = perNamespace.get(ns);
    const entries = Array.from(acc.values()).sort((a, b) => {
      if (b.occurrences !== a.occurrences) {
        return b.occurrences - a.occurrences;
      }
      return a.text.localeCompare(b.text);
    });
    byNamespace[ns] = entries.length;
    totalUniqueStrings += entries.length;
    const serialized = entries.map((entry) => {
      indexCounter += 1;
      return serializeEntry(entry, ns, indexCounter);
    });
    topByNamespace[ns] = topItems(serialized, TOP_PER_NAMESPACE);
    all.push(...serialized);
  }

  all.sort((a, b) => {
    if (b.occurrences !== a.occurrences) {
      return b.occurrences - a.occurrences;
    }
    return a.text.localeCompare(b.text);
  });

  const timestamp = getTimestamp();
  const reportPath = path.join(REPORT_DIR, `extracted-hangul-${timestamp}.json`);
  const report = {
    generatedAt: new Date().toISOString(),
    scanRoot: path.relative(ROOT, SCAN_ROOT).split(path.sep).join('/'),
    summary: {
      filesScanned: files.length,
      totalUniqueStrings,
      totalOccurrences,
      byNamespace
    },
    topByNamespace,
    all
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('[i18n-extract] === 요약 ===');
  console.log(`  unique 한글 문자열: ${totalUniqueStrings}`);
  console.log(`  총 등장 횟수      : ${totalOccurrences}`);
  console.log('  namespace 분포    :');
  for (const ns of ALL_NAMESPACES) {
    console.log(`    - ${ns.padEnd(8)}: ${byNamespace[ns]}`);
  }
  const top5 = all.slice(0, 5);
  if (top5.length > 0) {
    console.log('  전체 빈도 Top 5   :');
    for (const item of top5) {
      console.log(`    - "${item.text}" × ${item.occurrences} [${item.namespaces.join(',')}]`);
    }
  }
  console.log(`[i18n-extract] 리포트: ${path.relative(ROOT, reportPath)}`);
  console.log('[i18n-extract] dry-run 전용 — 소스 코드/locales JSON 은 변경되지 않았습니다.');
}

main();
