/**
 * 결정 저장 뒤 목록·상세를 기존 조회 함수로 다시 받는다.
 * 페이지 전체 리로드 없이 호출부가 받은 값만 반영한다.
 */

export interface OnboardingViewSnapshot<TDetail, TListItem> {
  detail: TDetail | null;
  list: TListItem[] | null;
  detailError: string;
  listError: string;
}

function messageFromRejection(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }
  return fallback;
}

export async function refreshOnboardingViews<TDetail, TListItem>(input: {
  fetchDetail: () => Promise<TDetail>;
  fetchList: () => Promise<TListItem[]>;
  detailFailureMessage: string;
  listFailureMessage: string;
}): Promise<OnboardingViewSnapshot<TDetail, TListItem>> {
  const [detailResult, listResult] = await Promise.allSettled([
    input.fetchDetail(),
    input.fetchList()
  ]);

  return {
    detail: detailResult.status === "fulfilled" ? detailResult.value : null,
    list: listResult.status === "fulfilled" ? listResult.value : null,
    detailError:
      detailResult.status === "rejected"
        ? messageFromRejection(detailResult.reason, input.detailFailureMessage)
        : "",
    listError:
      listResult.status === "rejected"
        ? messageFromRejection(listResult.reason, input.listFailureMessage)
        : ""
  };
}

/**
 * 목록·상세 조회가 끝나면 성공한 쪽만 반영한다.
 * 한 쪽이 실패해도 다른 쪽의 최신 값은 화면에 남긴다.
 */
export async function applyRefreshedOnboardingViews<TDetail, TListItem>(input: {
  fetchDetail: () => Promise<TDetail>;
  fetchList: () => Promise<TListItem[]>;
  detailFailureMessage: string;
  listFailureMessage: string;
  applyDetail: (detail: TDetail) => void;
  applyList: (rows: TListItem[]) => void;
}): Promise<OnboardingViewSnapshot<TDetail, TListItem>> {
  const snapshot = await refreshOnboardingViews(input);
  if (snapshot.list) {
    input.applyList(snapshot.list);
  }
  if (snapshot.detail) {
    input.applyDetail(snapshot.detail);
  }
  return snapshot;
}

type CacheListener<T> = (value: T) => void;

/**
 * 상세 화면에서 다시 받은 목록을 목록 화면이 구독한다.
 */
export function createSnapshotCache<T>() {
  let current: T | null = null;
  const listeners = new Set<CacheListener<T>>();

  return {
    read(): T | null {
      return current;
    },
    publish(value: T) {
      current = value;
      listeners.forEach((listener) => listener(value));
    },
    subscribe(listener: CacheListener<T>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
