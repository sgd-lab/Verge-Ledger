import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Ensure Dexie uses fake-indexeddb in jsdom
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

// Polyfill for HTMLDialogElement in JSDOM
if (typeof window !== 'undefined' && typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.removeAttribute('open');
  };
}

// Mock container dimensions for Leaflet in JSDOM
if (typeof HTMLElement !== 'undefined') {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 });
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600 }),
  });
}
