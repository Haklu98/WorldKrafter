// Typed accessor for the API exposed via contextBridge in preload.ts
import type { API } from '../../preload/preload';

declare global {
  interface Window {
    api: API;
  }
}

export const api = window.api;
