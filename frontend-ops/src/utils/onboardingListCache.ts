import type { OnboardingRequest } from "@/types/onboarding";

import { createSnapshotCache } from "@/utils/onboardingViewRefresh";

/** 온보딩 목록의 마지막 조회 결과. 상세 저장 직후 목록 화면과 공유한다. */
export const onboardingListCache = createSnapshotCache<OnboardingRequest[]>();
