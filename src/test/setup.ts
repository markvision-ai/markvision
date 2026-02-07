import '@testing-library/jest-dom';
// Mock ResizeObserver for Recharts ResponsiveContainer in JSDOM
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = global.ResizeObserver || MockResizeObserver as any;
