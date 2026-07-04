// page-hook.js — runs in the page's own ("MAIN") JS world, unlike content.js
// which runs in the extension's isolated world.
//
// Isolated-world content scripts get their own private copies of built-ins
// like window.fetch, XMLHttpRequest, and Image — patching them there only
// affects code the *extension* writes, not the page's own scripts, which
// keep calling the real, unpatched versions. To actually observe fetch/XHR/
// Image/Audio failures made by the page itself, this file is injected
// directly into the page's world (see manifest.json's "world": "MAIN"
// content script entry) and reports failures back to content.js via a
// CustomEvent on `document` — DOM events are one of the few things shared
// between the MAIN and ISOLATED worlds.
(() => {
  const EVENT_NAME = "__proxyhub_resource_fail__";

  function report(url) {
    if (!url) return;
    try {
      document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { url: String(url) } }));
    } catch (e) { /* ignore */ }
  }

  // fetch() — only reacts to genuine network-level failures (rejected
  // promise), never to ordinary non-2xx responses.
  try {
    const nativeFetch = window.fetch;
    if (typeof nativeFetch === "function") {
      window.fetch = function (...args) {
        const urlArg = args[0];
        const urlStr = typeof urlArg === "string" ? urlArg : (urlArg && urlArg.url) || "";
        return nativeFetch.apply(this, args).catch((err) => {
          report(urlStr);
          throw err;
        });
      };
    }
  } catch (e) { /* ignore */ }

  // XMLHttpRequest — "error"/"timeout" events only (network-level).
  try {
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__phUrl = url;
      return nativeOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (...args) {
      this.addEventListener("error", () => report(this.__phUrl));
      this.addEventListener("timeout", () => report(this.__phUrl));
      return nativeSend.apply(this, args);
    };
  } catch (e) { /* ignore */ }

  // new Image() / new Audio() — these are frequently created and used
  // without ever being attached to the document (sound effects, prefetch),
  // so window's capturing "error" listener in content.js never sees them.
  function wrapMediaCtor(Ctor) {
    if (typeof Ctor !== "function") return Ctor;
    return new Proxy(Ctor, {
      construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, newTarget);
        instance.addEventListener("error", () => {
          report(instance.currentSrc || instance.src);
        });
        return instance;
      }
    });
  }
  try { window.Image = wrapMediaCtor(window.Image); } catch (e) { /* ignore */ }
  try { window.Audio = wrapMediaCtor(window.Audio); } catch (e) { /* ignore */ }
})();
