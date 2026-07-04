// lib/crypto.js
// Optional master-password vault for proxy credentials (username/password).
// Uses WebCrypto AES-GCM with a PBKDF2-derived key. The derived key lives
// only in chrome.storage.session (cleared automatically when the browser
// fully closes) — never written to disk in chrome.storage.local.
//
// This protects credentials at rest (e.g. from casual disk/backup exposure)
// but is not a defense against a fully compromised machine while unlocked.

const PBKDF2_ITERATIONS = 250000;

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function deriveKey(passphrase, saltB64) {
  const enc = new TextEncoder();
  const salt = saltB64 ? b64ToBuf(saltB64) : crypto.getRandomValues(new Uint8Array(16)).buffer;
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return { key, saltB64: bufToB64(salt) };
}

async function encryptString(plainText, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(plainText)
  );
  return { iv: bufToB64(iv), data: bufToB64(cipherBuf) };
}

async function decryptString(payload, key) {
  const iv = new Uint8Array(b64ToBuf(payload.iv));
  const dec = new TextDecoder();
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, b64ToBuf(payload.data)
  );
  return dec.decode(plainBuf);
}

// Export a raw AES-GCM CryptoKey to a storable JWK so it can be cached
// in chrome.storage.session for the duration of the browser session.
async function exportKey(key) {
  return crypto.subtle.exportKey("jwk", key);
}
async function importKey(jwk) {
  return crypto.subtle.importKey(
    "jwk", jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
}
