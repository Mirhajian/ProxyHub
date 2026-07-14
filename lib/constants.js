// lib/constants.js — small values shared across background.js, popup.js,
// options.js and content.js. Loaded as a plain script everywhere except
// background.js, which pulls it in via importScripts().
//
// PH_DIRECT_ID is a reserved pseudo-profile id meaning "no proxy — load the
// site directly". It's never stored in state.profiles; it's only ever used
// as the value of rule.profileId or state.defaultMode.
// ---------- Cross-browser API shim ----------
// Chrome (MV3) exposes the extension API under `chrome.*` and supports
// promises on (almost) every async method. Firefox exposes the same API
// under `browser.*` with promises everywhere, and also exposes `chrome.*`
// as a Chrome-compat alias — but that alias is CALLBACK-based, not
// promise-based, so `await chrome.storage.local.get(...)` silently breaks
// on Firefox (it resolves immediately with `undefined` instead of waiting).
// Every file in this extension calls the API through PH_API instead of
// calling `chrome.*` directly, so the same code works unmodified on both.
const PH_API = (typeof browser !== "undefined" && browser.runtime && browser.runtime.id)
  ? browser
  : chrome;

// True only on Firefox. Firefox doesn't allow regular (unprivileged)
// extensions to use chrome.proxy.settings' pac_script mode — that's
// restricted to Mozilla-signed privileged add-ons. Regular extensions must
// use proxy.onRequest instead, which decides the proxy for each request as
// it happens rather than installing one PAC script for the whole browser.
// background.js branches on this flag to pick the right strategy.
const PH_IS_FIREFOX = PH_API === browser;

const PH_DIRECT_ID = "__direct__";

// Storage key for the extension's whole state blob (background.js is the
// only writer; other pages read it via GET_STATE, but all of them also
// listen to chrome.storage.onChanged on this key for live updates).
const PH_STORAGE_KEY = "proxyhub_state_v1";
