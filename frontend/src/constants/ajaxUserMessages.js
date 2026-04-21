/**
 * ajax.js에서 사용자에게 노출될 수 있는 짧은 문구 모음.
 *
 * @author Core Solution
 * @since 2026-04-21
 */

export const AJAX_PARSE_RESPONSE_FAILED = '응답 데이터를 파싱할 수 없습니다.';

export const AJAX_TENANT_INFO_MISSING_RELOGIN = '테넌트 정보가 없습니다. 다시 로그인해 주세요.';

export const AJAX_ACCESS_DENIED_DEFAULT = '접근 권한이 없습니다.';

export const AJAX_SERVER_ERROR_SHORT = '서버 오류';

export const AJAX_REQUEST_ERROR_SHORT = '요청 오류';

export const AJAX_POST_REQUEST_FAILED = 'POST 요청 실패';

export const AJAX_POST_FORMDATA_FAILED = 'POST FormData 요청 실패';

export const AJAX_BAD_REQUEST_400_DEFAULT = '요청이 잘못되었습니다. (400)';

export const AJAX_ERROR_WITH_CODE_PREFIX = '오류: ';

export const AJAX_DELETE_REQUEST_FAILED = 'DELETE 요청 실패';

export const AJAX_FILE_UPLOAD_FAILED = '파일 업로드 실패';

export const buildAjaxSubdomainLoginMessage = (host) =>
  `서브도메인이 필요합니다.\n\n예: mindgarden.dev.core-solution.co.kr\n\n현재 도메인: ${host}\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.`;

export const buildAjaxLoginHttpErrorMessage = (status, responseData) =>
  `HTTP ${status}: ${JSON.stringify(responseData)}`;

export const buildAjaxTestLoginHttpErrorMessage = (status) =>
  `HTTP error! status: ${status}`;
