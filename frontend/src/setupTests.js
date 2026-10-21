// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// @fullcalendar/luxon3 may be listed in package.json but absent even when listed;
// ScheduleCalendarView imports it. Use the real plugin when installed so suites
// that render FullCalendar keep working; otherwise stub the module.
jest.mock('@fullcalendar/luxon3', () => {
  try {
    return jest.requireActual('@fullcalendar/luxon3');
  } catch {
    return { __esModule: true, default: { id: 'luxon3' } };
  }
}, {
  virtual: true
});

// react-router v7 (development 번들)이 Jest/jsdom에서 TextEncoder를 요구함
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
