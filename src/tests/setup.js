import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mock de funciones del navegador
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock de navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  }
});

// Mock de window.confirm
global.confirm = vi.fn(() => true);

// Mock de localStorage y sessionStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  hasOwnProperty(key) {
    return key in this.store;
  }
}

global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();

// Set default language to Spanish for tests
global.localStorage.setItem('pictoforge-language', 'es');

// Limpiar storage después de cada test
afterEach(() => {
  global.localStorage.clear();
  global.sessionStorage.clear();
  // Restore default language after each test
  global.localStorage.setItem('pictoforge-language', 'es');
});

// Mock de console.error para tests más limpios
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
