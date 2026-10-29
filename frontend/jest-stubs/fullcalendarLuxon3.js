/**
 * Jest resolver for @fullcalendar/luxon3.
 * 패키지가 있으면 실제 플러그인을 쓰고, 없을 때는 FullCalendar createPlugin
 * 형태(deps 포함)를 써서 addDefs 가 순회 가능하게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const fs = require('fs');
const path = require('path');

const LUXON3_PLUGIN_NAME = '@fullcalendar/luxon3';
const realPackageJson = path.join(
  __dirname,
  '..',
  'node_modules',
  '@fullcalendar',
  'luxon3',
  'package.json'
);

function createLoadOnlyPlugin() {
  try {
    const { createPlugin } = require('@fullcalendar/core/index.cjs');
    return createPlugin({ name: LUXON3_PLUGIN_NAME });
  } catch (_error) {
    return {
      id: 'luxon3',
      name: LUXON3_PLUGIN_NAME,
      deps: [],
      reducers: [],
      isLoadingFuncs: [],
      contextInit: [],
      eventRefiners: {},
      eventDefMemberAdders: [],
      eventSourceRefiners: {},
      isDraggableTransformers: [],
      eventDragMutationMassagers: [],
      eventDefMutationAppliers: [],
      dateSelectionTransformers: [],
      datePointTransforms: [],
      dateSpanTransforms: [],
      views: {},
      viewPropsTransformers: [],
      isPropsValid: null,
      externalDefTransforms: [],
      viewContainerAppends: [],
      eventDropTransformers: [],
      componentInteractions: [],
      calendarInteractions: [],
      themeClasses: {},
      eventSourceDefs: [],
      cmdFormatter: null,
      recurringTypes: [],
      namedTimeZonedImpl: null,
      initialView: '',
      elementDraggingImpl: null,
      optionChangeHandlers: {},
      scrollGridImpl: null,
      listenerRefiners: {},
      optionRefiners: {},
      propSetHandlers: {}
    };
  }
}

if (fs.existsSync(realPackageJson)) {
  module.exports = require(path.join(
    __dirname,
    '..',
    'node_modules',
    '@fullcalendar',
    'luxon3'
  ));
} else {
  const plugin = createLoadOnlyPlugin();
  module.exports = plugin;
  module.exports.__esModule = true;
  module.exports.default = plugin;
}
