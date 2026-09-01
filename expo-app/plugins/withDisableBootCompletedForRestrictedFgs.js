/**
 * Expo config plugin — Google Play Console 「주의 필요」완화.
 *
 * Android 15+ 제한된 포그라운드 서비스(FGS: mediaPlayback / microphone, expo-audio)와
 * BOOT_COMPLETED(및 reboot 계열) BroadcastReceiver가 동일 앱 매니페스트에 공존하면
 * Play 정적 분석이 경고한다. 우리 앱에서 BOOT → FGS 직접 호출 경로는 확인되지 않았으며,
 * 본 플러그인은 병합 매니페스트에서 BOOT/reboot action만 제거해 정적 경고를 완화한다.
 *
 * 대상: expo-notifications `NotificationsService`, expo-task-manager `TaskBroadcastReceiver`.
 * expo-audio FGS 선언·오디오 권한은 삭제하지 않는다.
 *
 * 부작용: 재부팅 후 예약 로컬 알림·백그라운드 태스크가 자동 복원되지 않을 수 있다.
 * 앱 실행 시 스케줄/태스크를 다시 등록해야 한다. MY_PACKAGE_REPLACED·NOTIFICATION_EVENT·
 * TaskBroadcastReceiver.INTENT_ACTION 은 유지한다.
 *
 * 라이브러리 매니페스트는 prebuild 앱 매니페스트에 없으므로, 기존 action이 있으면 필터링하고
 * 병합 시에는 tools:node="remove" 마커로 BOOT/reboot action만 제거한다 (전체 receiver replace 보다
 * 라이브러리 측 비-BOOT action 추가에 덜 깨짐).
 *
 * @see https://github.com/expo/expo/issues/41627
 * @see https://developer.android.com/about/versions/15/behavior-changes-15
 */
const { withAndroidManifest } = require('@expo/config-plugins');

/** Play 경고 핵심 — BOOT / 벤더 reboot 계열만 제거 */
const BOOT_OR_REBOOT_ACTIONS = new Set([
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.REBOOT',
  'android.intent.action.QUICKBOOT_POWERON',
  'com.htc.intent.action.QUICKBOOT_POWERON',
]);

/**
 * nameIncludes: 앱/병합 매니페스트에서 매칭
 * fullName: 앱 매니페스트에 없을 때 merge override 용 정식 이름 (라이브러리 namespace 기준)
 */
const TARGET_RECEIVERS = [
  {
    nameIncludes: 'NotificationsService',
    fullName: 'expo.modules.notifications.service.NotificationsService',
  },
  {
    nameIncludes: 'TaskBroadcastReceiver',
    fullName: 'expo.modules.taskManager.TaskBroadcastReceiver',
  },
];

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function ensureToolsNamespace(manifestRoot) {
  manifestRoot.$ = manifestRoot.$ || {};
  if (!manifestRoot.$['xmlns:tools']) {
    manifestRoot.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  }
}

/**
 * 이미 앱 매니페스트에 들어온 BOOT/reboot action 을 제거.
 * tools:node="remove" 마커는 병합용으로 유지.
 *
 * @param {object} receiver
 */
function stripBootActionsFromIntentFilters(receiver) {
  const filters = asArray(receiver['intent-filter']);
  if (filters.length === 0) {
    return;
  }

  receiver['intent-filter'] = filters
    .map((filter) => {
      const actions = asArray(filter.action);
      if (actions.length === 0) {
        return filter;
      }
      filter.action = actions.filter((action) => {
        const name = action?.$?.['android:name'];
        if (action?.$?.['tools:node'] === 'remove') {
          return true;
        }
        return !BOOT_OR_REBOOT_ACTIONS.has(name);
      });
      return filter;
    })
    .filter((filter) => {
      const actions = asArray(filter.action);
      if (actions.length > 0) {
        return true;
      }
      const data = asArray(filter.data);
      const category = asArray(filter.category);
      return data.length > 0 || category.length > 0;
    });
}

/**
 * AGP Manifest Merger 가 라이브러리 receiver 의 BOOT/reboot action 을 제거하도록 마커 주입.
 *
 * @param {object} receiver
 */
function ensureBootActionRemoveMarkers(receiver) {
  const filters = asArray(receiver['intent-filter']);
  const existingRemoveNames = new Set();

  for (const filter of filters) {
    for (const action of asArray(filter.action)) {
      if (action?.$?.['tools:node'] === 'remove' && action?.$?.['android:name']) {
        existingRemoveNames.add(action.$['android:name']);
      }
    }
  }

  const missing = [...BOOT_OR_REBOOT_ACTIONS].filter((name) => !existingRemoveNames.has(name));
  if (missing.length === 0) {
    return;
  }

  let targetFilter = filters[0];
  if (!targetFilter) {
    targetFilter = { action: [] };
    filters.push(targetFilter);
    receiver['intent-filter'] = filters;
  }
  targetFilter.action = asArray(targetFilter.action);
  for (const name of missing) {
    targetFilter.action.push({
      $: {
        'android:name': name,
        'tools:node': 'remove',
      },
    });
  }
}

/**
 * @param {object} app
 * @param {{ nameIncludes: string, fullName: string }} target
 */
function findOrCreateReceiver(app, target) {
  const receivers = asArray(app.receiver);
  app.receiver = receivers;

  let receiver = receivers.find((entry) =>
    String(entry?.$?.['android:name'] || '').includes(target.nameIncludes),
  );

  if (!receiver) {
    receiver = {
      $: {
        'android:name': target.fullName,
      },
      'intent-filter': [],
    };
    receivers.push(receiver);
  }

  return receiver;
}

function withDisableBootCompletedForRestrictedFgs(config) {
  return withAndroidManifest(config, (mod) => {
    const manifestRoot = mod.modResults?.manifest;
    if (!manifestRoot) {
      return mod;
    }

    ensureToolsNamespace(manifestRoot);

    const app = asArray(manifestRoot.application)[0];
    if (!app) {
      return mod;
    }

    for (const target of TARGET_RECEIVERS) {
      const receiver = findOrCreateReceiver(app, target);
      stripBootActionsFromIntentFilters(receiver);
      ensureBootActionRemoveMarkers(receiver);
    }

    return mod;
  });
}

module.exports = withDisableBootCompletedForRestrictedFgs;
