/**
 * 시각 하네스 브라우저 진입점 (react-native-web). `?key=<spec key>` 로 화면 하나를 그린다.
 * 앱 번들·라우트와 무관하며 `build.js` 가 esbuild 로만 묶는다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { useCallback } from 'react';
import { AppRegistry, Text } from 'react-native';
import type { CoverLayoutMode } from '@/utils/coverChapterViewModel';
import { collectDomSnapshot, scrollAllToEnd } from './domProbe';
import {
  HarnessClientDock,
  HarnessCounselorDock,
  HarnessFrame,
  HarnessSafeAreaProvider,
} from './HarnessChrome';
import {
  CLIENT_FIXTURES,
  COUNSELOR_FIXTURES,
  HARNESS_FIXTURE_TAG,
  buildClientHarnessView,
  buildCounselorHarnessView,
  harnessNow,
} from './harnessFixtures';
import { HarnessClientHome, HarnessClientSchedule, HarnessCounselorHome } from './HarnessScreens';
import {
  EDGE_CASE_GROUPS,
  VISUAL_SCREEN_SPECS,
  evaluateScreenAssertions,
  type VisualScreenSpec,
} from './visualMatrixSpec';

const APP_KEY = 'CoverChapterVisualHarness';

const state: { layoutMode: CoverLayoutMode | null } = { layoutMode: null };

function ScreenForSpec({ spec }: Readonly<{ spec: VisualScreenSpec }>) {
  const now = harnessNow();
  const onLayoutMode = useCallback((mode: CoverLayoutMode) => {
    state.layoutMode = mode;
  }, []);

  switch (spec.role) {
    case 'CLIENT': {
      const view = buildClientHarnessView(CLIENT_FIXTURES[spec.fixture], now);
      const screen =
        spec.screen === 'client-home' ? (
          <HarnessClientHome view={view} />
        ) : (
          <HarnessClientSchedule view={view} now={now} />
        );
      const activeRoute = spec.screen === 'client-home' ? '(home)' : '(sessions)';
      return (
        <HarnessFrame
          screen={screen}
          dock={<HarnessClientDock activeRoute={activeRoute} />}
          onLayoutMode={onLayoutMode}
        />
      );
    }
    case 'CONSULTANT': {
      const view = buildCounselorHarnessView(COUNSELOR_FIXTURES[spec.fixture], now);
      return (
        <HarnessFrame
          screen={<HarnessCounselorHome view={view} />}
          dock={<HarnessCounselorDock activeRoute="(home)" />}
          onLayoutMode={onLayoutMode}
        />
      );
    }
    default: {
      const unhandled: never = spec;
      return unhandled;
    }
  }
}

function HarnessApp({ spec }: Readonly<{ spec: VisualScreenSpec | null }>) {
  if (!spec) {
    return (
      <Text>{`${HARNESS_FIXTURE_TAG}: ?key=${VISUAL_SCREEN_SPECS.map((s) => s.key).join(' | ')}`}</Text>
    );
  }
  return (
    <HarnessSafeAreaProvider insets={spec.insets} viewport={spec.viewport}>
      <ScreenForSpec spec={spec} />
    </HarnessSafeAreaProvider>
  );
}

const key = new URLSearchParams(window.location.search).get('key');
const activeSpec = VISUAL_SCREEN_SPECS.find((s) => s.key === key) ?? null;

declare global {
  interface Window {
    __COVER_HARNESS__?: unknown;
  }
}

window.__COVER_HARNESS__ = {
  fixtureTag: HARNESS_FIXTURE_TAG,
  specs: VISUAL_SCREEN_SPECS,
  edgeCaseGroups: EDGE_CASE_GROUPS,
  run: () => {
    if (!activeSpec) {
      return null;
    }
    const snapshot = collectDomSnapshot(activeSpec, state.layoutMode);
    return {
      key: activeSpec.key,
      snapshot,
      assertions: evaluateScreenAssertions(activeSpec, snapshot),
    };
  },
  scrollAllToEnd,
};

function HarnessRoot() {
  return <HarnessApp spec={activeSpec} />;
}

AppRegistry.registerComponent(APP_KEY, () => HarnessRoot);
AppRegistry.runApplication(APP_KEY, { rootTag: document.getElementById('root') });
