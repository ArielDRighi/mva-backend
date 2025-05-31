// Polyfill for crypto.randomUUID for Node.js compatibility
import { webcrypto } from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}