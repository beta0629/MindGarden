# BW-4 커뮤니티 API 표면 (OpenAPI 수준 요약)

| Method | Path | 인증 | 역할·비고 |
|--------|------|------|-----------|
| GET | `/api/v1/community` | 필수 | 테넌트 보유 사용자. 쿼리 `tab`: `reviews` \| `columns` \| 생략(전체). **승인된 게시만** 목록. |
| GET | `/api/v1/community/{postId}` | 필수 | 승인 게시 **또는** 작성자 본인의 비승인·반려 건 조회. |
| POST | `/api/v1/community` | 필수 | 게시 작성 → `PENDING`. `CLIENT_REVIEW`는 **내담자**만, `CONSULTANT_COLUMN`은 **전문가(상담사·치료사 계열)**만. |
| PATCH | `/api/v1/community/{postId}` | 필수 | 본인 + **PENDING**만 수정. |
| DELETE | `/api/v1/community/{postId}` | 필수 | 본인 소프트 삭제. |
| POST | `/api/v1/community/{postId}/comments` | 필수 | **승인** 게시에만 댓글. |
| DELETE | `/api/v1/community/comments/{commentId}` | 필수 | 본인 댓글만 삭제. |
| POST | `/api/v1/community/{postId}/likes` | 필수 | **승인** 게시에 좋아요(멱등). |
| DELETE | `/api/v1/community/{postId}/likes` | 필수 | 본인 좋아요 취소. |
| POST | `/api/v1/community/{postId}/reports` | 필수 | **승인** 게시(및 선택적 `commentId`) 신고. |
| GET | `/api/v1/admin/community/moderation-queue` | 필수 | **`ROLE_ADMIN`만** (`@PreAuthorize`). 검수 대기 목록. |
| PATCH | `/api/v1/admin/community/posts/{postId}/moderation` | 필수 | **`ROLE_ADMIN`만**. 본문: `{ decision: APPROVE \| REJECT, reasonCode?, note? }` — `moderated_at`, `moderated_by_user_id`, `moderation_reason_code`, `moderation_note` 갱신. |

- **테넌트**: 모든 조회·쓰기는 세션 사용자 `tenantId`와 일치하는 행만 대상.
- **Expo 정합**: 피드 항목 필드는 `expo-app/src/utils/communityNormalize.ts` 가 기대하는 키(`id`, `title`, `body`, `author`, `likes`, `comments`, `createdAt`/`time`, `isConsultant`, `isAnonymous`, 탭 매핑용 `tab`/`category`)와 호환되도록 JSON을 구성함.
- **Flyway**: `V20260515_002__bw4_community_moderation.sql` — `community_posts`, `community_comments`, `community_post_likes`, `community_reports`.

## core-tester 권장 검증 (bullet)

- **테넌트 교차**: 테넌트 A 사용자로 테넌트 B `postId` 접근 시 404/403.
- **역할**: 내담자가 `CONSULTANT_COLUMN` 작성 시 거부; 상담사가 `CLIENT_REVIEW` 작성 시 거부; `ROLE_STAFF`가 `GET /admin/community/moderation-queue` 시 403.
- **모더레이션**: `PENDING` 글은 피드(`GET /community`)에 없음; 승인 후 피드·댓글·좋아요·신고 가능; 작성자는 비승인 단건 `GET /community/{id}` 조회 가능.
- **멱등**: 동일 사용자 동일 글 `POST .../likes` 두 번 — 오류 없음·좋아요 수 1.
- **감사**: `PATCH .../moderation` 후 DB에 `moderated_at`, `moderated_by_user_id`, `reasonCode`/`note` 반영 여부.
