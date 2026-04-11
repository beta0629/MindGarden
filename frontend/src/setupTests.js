// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// react-router v7 (development 번들)이 Jest/jsdom에서 TextEncoder를 요구함
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
