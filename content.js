// content.js — ProxyHub smart link watcher
//
// Detects domains a page needed but couldn't reach, and offers to add proxy
// rules for them + reload. Combines several signals because no single one
// catches everything a real page does:
//
//   1) DOM resource failures — <img>/<script>/<link>/<iframe>/<video>/<audio>
//      elements whose "error" event fires. Catches most static assets
//      (stylesheets, JS bundles, images) declared directly in the HTML.
//
//   2) fetch() / XMLHttpRequest failures — analytics beacons, API calls,
//      "generate_204" pings, etc. never create a DOM element at all, so (1)
//      never sees them. page-hook.js (injected into the page's own MAIN
//      JS world — see below) patches both to observe network-level
//      failures without altering their real behavior, then relays them
//      here via a DOM CustomEvent.
//
//   3) new Image() / new Audio() failures — sound effects and prefetched
//      images that are never attached to the document don't bubble through
//      window's capturing listener (there's no DOM ancestor to capture
//      through), so page-hook.js patches these constructors too.
//
//   4) A proactive scan of the page's own HTML for references to domains
//      already known to be CDNs/companion asset hosts (lib/groups.js) —
//      run only when the current site itself is already being routed
//      through a proxy rule, so this doesn't fire noisy suggestions on
//      ordinary browsing.
//
//   5) Content-Security-Policy violations are tracked separately and
//      EXCLUDED from suggestions — a proxy rule can't make a page's own CSP
//      allow a connection it explicitly disallows, so recommending one
//      there would be actively misleading.
//
// Timing matters as much as mechanism: this script runs at document_start
// (see manifest.json) specifically so these listeners/patches are in place
// before the page's own <head> resources start loading and before the
// page's own scripts run — otherwise early failures happen before we're
// even watching.
(() => {
  if (window.top !== window) return; // main frame only

  const send = (msg) => {
    try {
      // Promise-based on both Chrome (MV3) and Firefox. A callback param
      // here would silently do nothing on Firefox, since its `browser.*`
      // namespace (aliased as PH_API) only ever resolves via Promise.
      return Promise.resolve(PH_API.runtime.sendMessage(msg)).catch(() => null);
    } catch (e) {
      return Promise.resolve(null);
    }
  };

  // Lightweight mirror of PAC's shExpMatch (only "*" wildcard).
  function shExpMatchLike(host, pattern) {
    const esc = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${esc}$`, "i").test(host);
  }

  const pageHost = location.hostname;
  const failedHosts = new Set();     // signal 1/2/3: confirmed broken loads
  const scannedHosts = new Set();    // signal 4: known-CDN references found in the DOM
  const cspBlockedHosts = new Set(); // signal 5: blocked by the page's own CSP, not network
  let dismissed = false;

  // Direct tabs don't go through a proxy, so a CDN domain "failing" or
  // being referenced here means nothing about proxy coverage — there's
  // nothing useful to suggest. Resolve this up front and make every signal
  // a no-op for Direct tabs instead of just hiding the banner at the end.
  let directPage = false;
  (async () => {
    const res = await send({ type: "GET_ROUTE_MODE", host: pageHost });
    directPage = !res || res.mode !== "proxy";
    if (directPage) {
      failedHosts.clear();
      scannedHosts.clear();
      cspBlockedHosts.clear();
    } else {
      scheduleEvaluate(); // in case failures were queued while mode was still unknown
    }
  })();

  function hostFromUrl(raw) {
    if (!raw) return null;
    try {
      const h = new URL(raw, location.href).hostname.toLowerCase();
      return h || null;
    } catch (e) {
      return null;
    }
  }

  function reportFailedUrl(raw) {
    if (directPage) return;
    const host = hostFromUrl(raw);
    if (!host || host === pageHost) return;
    failedHosts.add(host);
    scheduleEvaluate();
  }

  // ---- Signal 1: DOM element resource failures ----
  window.addEventListener("error", (e) => {
    const target = e.target;
    if (!target || target === window) return;
    const tag = target.tagName;
    if (!["IMG", "SCRIPT", "LINK", "IFRAME", "VIDEO", "AUDIO", "SOURCE"].includes(tag)) return;
    reportFailedUrl(target.src || target.href);
  }, true);

  // ---- Signal 2 & 3: fetch()/XHR/Image/Audio failures from the page's own
  // scripts ----
  // Isolated-world content scripts (this file) get their own private copies
  // of window.fetch/XMLHttpRequest/Image — patching them here would only
  // affect code the extension itself writes, never the page's own scripts.
  // The actual patching happens in page-hook.js, injected into the page's
  // real ("MAIN") JS world (see manifest.json), which reports failures back
  // via a CustomEvent on `document` — one of the few channels shared
  // between the MAIN and ISOLATED worlds.
  document.addEventListener("__proxyhub_resource_fail__", (e) => {
    reportFailedUrl(e.detail && e.detail.url);
  });

  // ---- Signal 5: CSP violations (tracked to EXCLUDE, not suggest) ----
  document.addEventListener("securitypolicyviolation", (e) => {
    const host = hostFromUrl(e.blockedURI);
    if (host && host !== pageHost) cspBlockedHosts.add(host);
  });

  // ---- Signal 4: proactive known-CDN scan (only on sites already routed) ----
  const RESOURCE_SELECTOR = "img[src], script[src], link[href], iframe[src], video[src], audio[src], source[src], video[poster]";

  function scanDomForKnownCdnHosts(state) {
    const overrides = state && state.knownHosts;
    document.querySelectorAll(RESOURCE_SELECTOR).forEach((el) => {
      const raw = el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("poster");
      const host = hostFromUrl(raw);
      if (!host || host === pageHost) return;
      const isKnown = (typeof findKnownCdnDomain === "function" && findKnownCdnDomain(host, overrides)) ||
        (typeof findGroupForPattern === "function" && findGroupForPattern(host, overrides));
      if (isKnown) scannedHosts.add(host);
    });
  }

  // Bursts of failures (a dozen analytics pings failing at once, say) would
  // otherwise trigger a GET_STATE round-trip + re-render per failure.
  let evalScheduled = false;
  function scheduleEvaluate() {
    if (directPage || evalScheduled) return;
    evalScheduled = true;
    setTimeout(() => { evalScheduled = false; evaluate(); }, 400);
  }

  async function evaluate() {
    if (dismissed || directPage) return;

    const state = await send({ type: "GET_STATE" });
    if (!state) return;
    if (!state.enabled) return; // routing is off globally, nothing to suggest

    const pageIsRouted = state.rules.some(r =>
      r.enabled !== false && r.patterns.some(p => shExpMatchLike(pageHost, p))
    );
    if (pageIsRouted) scanDomForKnownCdnHosts(state);

    const alreadyCovered = (host) =>
      state.rules.some(r => r.enabled !== false && r.patterns.some(p => shExpMatchLike(host, p)));

    const merged = new Set([...failedHosts, ...scannedHosts]);
    const excludedForCsp = [...merged].filter(h => cspBlockedHosts.has(h));
    const candidates = [...merged].filter(h => !alreadyCovered(h) && !cspBlockedHosts.has(h));
    if (!candidates.length) return;

    const failedSet = new Set(failedHosts);
    showBanner(candidates, state, failedSet, excludedForCsp.length);
  }

  function labelFor(host, failedSet, overrides) {
    const bits = [];
    if (failedSet.has(host)) bits.push("failed to load");
    if (typeof findKnownCdnDomain === "function") {
      const known = findKnownCdnDomain(host, overrides);
      if (known) bits.push(`known CDN: ${known}`);
    } else if (typeof findGroupForPattern === "function" && findGroupForPattern(host, overrides)) {
      bits.push("related CDN");
    }
    return bits.length ? `${host} (${bits.join(", ")})` : host;
  }

  let bannerHost = null;
  let bannerShadow = null;
  let cachedTheme = null;

  function getTheme() {
    if (cachedTheme) return Promise.resolve(cachedTheme);
    return Promise.resolve(PH_API.storage.local.get("ph_theme"))
      .then((r) => {
        cachedTheme = (r && r.ph_theme) || "dark";
        return cachedTheme;
      })
      .catch(() => "dark");
  }

  function mountBannerHost() {
    if (bannerHost) return;
    bannerHost = document.createElement("div");
    bannerHost.id = "proxyhub-banner-host";
    bannerShadow = bannerHost.attachShadow({ mode: "open" });
    const attach = () => {
      (document.documentElement || document.body).appendChild(bannerHost);
    };
    // At document_start, <html> is virtually always already present, but
    // guard anyway rather than assume.
    if (document.documentElement) attach();
    else document.addEventListener("DOMContentLoaded", attach, { once: true });
  }

  // Common two-part public suffixes where the registrable domain needs 3
  // labels instead of 2 (e.g. "example.co.uk", not "co.uk").
  const MULTI_PART_TLDS = new Set([
    "co.uk", "org.uk", "gov.uk", "ac.uk", "co.jp", "co.kr", "com.br",
    "com.au", "com.cn", "com.tr", "com.mx", "com.ar", "co.in", "co.za",
    "com.sg", "com.hk", "net.au", "org.au", "co.nz"
  ]);

  function registrableDomain(host) {
    const parts = host.toLowerCase().split(".").filter(Boolean);
    if (parts.length <= 2) return parts.join(".");
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
    return lastTwo;
  }

  function patternsForFailedHost(host, overrides) {
    const clean = host.replace(/^www\./i, "").toLowerCase();
    // If this host belongs to a known CDN/group (e.g. "*.hcaptcha.com"),
    // generalize straight to that base — it already covers every rotating
    // sub-subdomain a provider like hCaptcha hands out on each page load,
    // instead of adding a fresh one-off rule per random hash every reload.
    const knownGroup = typeof findGroupForPattern === "function" ? findGroupForPattern(clean, overrides) : null;
    const knownCdn = typeof findKnownCdnDomain === "function" ? findKnownCdnDomain(clean, overrides) : null;
    const base = (knownGroup && knownGroup.key) || knownCdn || registrableDomain(clean);
    return [...new Set([base, `*.${base}`])];
  }

  async function showBanner(hosts, state, failedSet, cspExcludedCount) {
    if (dismissed) return;

    mountBannerHost();
    const theme = await getTheme();
    const shadow = bannerShadow;
    const overrides = state.knownHosts;
    const shown = hosts.slice(0, 4);
    const extra = hosts.length - shown.length;

    const hasProfiles = state.profiles && state.profiles.length > 0;
    const profileOptions = hasProfiles
      ? state.profiles.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")
      : "";

    shadow.innerHTML = `
      <style>${SHADOW_CSS}</style>
      <div class="ph-wrap ph-theme-${theme}" dir="ltr" lang="en">
        <div class="ph-banner">
          <div class="ph-icon">${typeof PH_ICONS !== "undefined" ? PH_ICONS.warning : ""}</div>
          <div class="ph-body">
            <div class="ph-title">${hosts.length} CDN domain${hosts.length > 1 ? "s" : ""} on <strong>${escapeHtml(pageHost)}</strong> aren't covered yet</div>
            <div class="ph-list">${shown.map(h => `<span class="ph-domain">${escapeHtml(labelFor(h, failedSet, overrides))}</span>`).join("")}${extra > 0 ? `<span class="ph-more">+${extra}</span>` : ""}</div>
            ${cspExcludedCount > 0 ? `<div class="ph-sub">${cspExcludedCount} more blocked by this site's own CSP — a proxy can't override that.</div>` : ""}
            ${!hasProfiles ? `<div class="ph-sub ph-warn">No proxy profile exists yet.</div>` : ""}
          </div>
          <div class="ph-actions">
            ${hasProfiles ? `<select id="ph-profile-select" class="ph-select">${profileOptions}</select>` : ""}
            ${hasProfiles
              ? `<button id="ph-add-reload" class="ph-btn ph-primary">Add &amp; reload</button>`
              : `<button id="ph-open-options" class="ph-btn ph-primary">Open options</button>`}
            <button id="ph-dismiss" class="ph-btn ph-secondary">Dismiss</button>
          </div>
        </div>
      </div>
    `;

    const dismissBtn = shadow.getElementById("ph-dismiss");
    dismissBtn.addEventListener("click", () => {
      dismissed = true;
      bannerHost.remove();
      bannerHost = null;
      bannerShadow = null;
    });

    const addBtn = shadow.getElementById("ph-add-reload");
    if (addBtn) {
      addBtn.addEventListener("click", async () => {
        addBtn.disabled = true;
        addBtn.textContent = "Adding…";
        const profileId = shadow.getElementById("ph-profile-select").value;
        // Merged into pageHost's own rule (nested), not spawned as separate
        // top-level rules — this is what makes them show up under the site
        // they were detected on in Options → Rules, and what makes the
        // "already added" check above correctly stop re-suggesting them.
        const patterns = hosts.flatMap((h) => patternsForFailedHost(h, overrides));
        const res = await send({ type: "MERGE_CDN_PATTERNS", host: pageHost, patterns, profileId });
        if (res && res.ok) {
          location.reload();
        } else {
          addBtn.disabled = false;
          addBtn.textContent = "Add & reload";
          alert("ProxyHub: could not add rules. Open the options page to add them manually.");
        }
      });
    }

    const openOptionsBtn = shadow.getElementById("ph-open-options");
    if (openOptionsBtn) {
      openOptionsBtn.addEventListener("click", async () => {
        await send({ type: "OPEN_OPTIONS_PAGE" });
      });
    }
  }

  const SHADOW_CSS = `
    :host, .ph-wrap { all: initial; }
    .ph-wrap {
      display: block;
      font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif;
      font-size: 12.5px;
      direction: ltr;
      text-align: left;
      padding: 8px 10px 0;
    }
    .ph-theme-dark {
      --ph-bg: #262521; --ph-border: rgba(250,249,245,.11); --ph-text: #f5f4ee;
      --ph-text-dim: #a39e93; --ph-accent: #da7756; --ph-accent2: #e28763;
      --ph-warn: #c96a5c; --ph-chip-bg: rgba(250,249,245,.07);
    }
    .ph-theme-light {
      --ph-bg: #ffffff; --ph-border: rgba(30,26,20,.1); --ph-text: #201d17;
      --ph-text-dim: #6f6a5e; --ph-accent: #c8683f; --ph-accent2: #b25936;
      --ph-warn: #b1503f; --ph-chip-bg: rgba(30,26,20,.05);
    }
    @keyframes ph-slide-down {
      from { transform: translateY(-10px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
    .ph-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--ph-bg);
      color: var(--ph-text);
      border: 1px solid var(--ph-border);
      border-radius: 12px;
      box-shadow: 0 8px 28px -8px rgba(0,0,0,.35);
      padding: 9px 12px;
      max-width: 640px;
      margin: 0 auto;
      animation: ph-slide-down .25s cubic-bezier(.2,1,.3,1) both;
    }
    @media (prefers-reduced-motion: reduce) {
      .ph-banner { animation: none; }
    }
    .ph-icon { width: 16px; height: 16px; color: var(--ph-warn); flex-shrink: 0; }
    .ph-icon svg { width: 100%; height: 100%; display: block; }
    .ph-body { flex: 1; min-width: 0; }
    .ph-title { font-weight: 600; font-size: 12.5px; margin-bottom: 4px; line-height: 1.35; }
    .ph-title strong { font-weight: 700; }
    .ph-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .ph-domain, .ph-more {
      font-family: ui-monospace, Menlo, Consolas, monospace;
      font-size: 10.5px;
      background: var(--ph-chip-bg);
      border: 1px solid var(--ph-border);
      border-radius: 6px;
      padding: 1px 6px;
      color: var(--ph-text-dim);
    }
    .ph-sub { color: var(--ph-text-dim); font-size: 11px; line-height: 1.4; margin-top: 4px; }
    .ph-sub.ph-warn { color: var(--ph-warn); }
    .ph-select {
      background: var(--ph-chip-bg); color: var(--ph-text); border: 1px solid var(--ph-border);
      border-radius: 7px; padding: 5px 7px; font-size: 11.5px; max-width: 130px;
    }
    .ph-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .ph-btn {
      border: none; border-radius: 7px; padding: 6px 11px; font-size: 11.5px;
      font-weight: 700; cursor: pointer; white-space: nowrap;
    }
    .ph-primary { background: var(--ph-accent); color: #241a14; }
    .ph-secondary { background: var(--ph-chip-bg); color: var(--ph-text-dim); border: 1px solid var(--ph-border); }
    .ph-btn:hover { filter: brightness(1.08); }
    .ph-btn:disabled { opacity: .6; cursor: not-allowed; }
  `;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // Three evaluation passes on top of the live per-failure triggers above:
  //  - "early": shortly after the DOM is interactive, so a proactive
  //    known-CDN scan can surface a suggestion before the page even
  //    finishes loading.
  //  - "settle": after window.load plus a short grace period, to catch
  //    resources that failed late or were added dynamically.
  //  - "late": a further delay to catch slow timeouts (ERR_TIMED_OUT can
  //    take 20-30s to actually fire).
  const scheduleInitialPasses = () => {
    setTimeout(evaluate, 1200);
    window.addEventListener("load", () => {
      setTimeout(evaluate, 2500);
      setTimeout(evaluate, 15000);
    });
    if (document.readyState === "complete") {
      setTimeout(evaluate, 2500);
      setTimeout(evaluate, 15000);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInitialPasses, { once: true });
  } else {
    scheduleInitialPasses();
  }
})();
