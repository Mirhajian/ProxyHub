// lib/constants.js — small values shared across background.js, popup.js,
// options.js and content.js. Loaded as a plain script everywhere except
// background.js, which pulls it in via importScripts().
//
// PH_DIRECT_ID is a reserved pseudo-profile id meaning "no proxy — load the
// site directly". It's never stored in state.profiles; it's only ever used
// as the value of rule.profileId or state.defaultMode.
const PH_DIRECT_ID = "__direct__";

// Storage key for the extension's whole state blob (background.js is the
// only writer; other pages read it via GET_STATE, but all of them also
// listen to chrome.storage.onChanged on this key for live updates).
const PH_STORAGE_KEY = "proxyhub_state_v1";
