// Grundeinstellungen für die Jest-Tests
import '@testing-library/jest-dom';

// Mock für die Browser-Umgebung
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mocks für Browser APIs hinzufügen
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// React console.error in Tests zu Fehlern machen
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};