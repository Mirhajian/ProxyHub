// background.js — ProxyHub service worker
importScripts("lib/constants.js", "lib/groups.js", "lib/crypto.js");

const STORAGE_KEY = PH_STORAGE_KEY;

/**
 * State shape:
 * {
 *   enabled: true,               // master switch — off routes EVERYTHING direct
 *   defaultMode: PH_DIRECT_ID | <profileId>,
 *   vault: { locked: bool, saltB64: string|null },
 *   profiles: [{ id, name, color, scheme, host, port, username, password|encPassword }],
 *   rules: [{
 *     id, patterns: [string,...], profileId, note,
 *     ownerHost,          // set only for rules created/managed from the popup's
 *                         // per-site selector — lets us find & UPDATE the same
 *                         // rule instead of creating a new one every time the
 *                         // user changes the profile for a site.
 *     includeSubdomains,  // whether ownerHost's rule includes *.host
 *   }]
 * }
 * Rules are evaluated in array order (first match wins). patterns[0] is
 * treated as the "site" pattern in the UI; any further patterns are shown
 * as nested/related CDN patterns under it.
 * A rule with no `enabled` field is treated as enabled — the standalone
 * "Enabled" toggle was removed; a site is turned off by pointing its
 * profile at PH_DIRECT_ID instead.
 */

let cachedKey = null; // in-memory AES-GCM CryptoKey while vault unlocked, this session only

async function getState() {
  const { [STORAGE_KEY]: state } = await chrome.storage.local.get(STORAGE_KEY);
  const base = state || { enabled: true, vault: { locked: false, saltB64: null }, profiles: [], rules: [] };
  if (!base.defaultMode) base.defaultMode = PH_DIRECT_ID;
  if (typeof base.enabled !== "boolean") base.enabled = true;
  if (!base.knownHosts) base.knownHosts = defaultKnownHosts();
  return base;
}

async function setState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

// ---------- Small shared helpers ----------

function shExpMatchLike(host, pattern) {
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${esc}$`, "i").test(host);
}

function baseDomainFor(host) {
  return host.replace(/^www\./i, "");
}

function patternsForHost(host, includeSubdomains) {
  if (!includeSubdomains) return [host];
  const base = baseDomainFor(host);
  const patterns = [base, `*.${base}`];
  if (base !== host) patterns.push(host);
  return [...new Set(patterns)];
}

function ruleEnabled(rule) {
  return rule.enabled !== false; // absent/undefined => enabled
}

// Finds the single rule the popup's per-site selector "owns" for this host,
// so changing the profile there updates that one rule instead of stacking
// up duplicates. Prefers an explicitly tagged owner; falls back to a
// pre-existing rule whose patterns are exactly what quick-add would have
// generated for this host (covers rules created before ownerHost existed).
function findOwnerRule(state, host) {
  const lower = host.toLowerCase();
  let rule = state.rules.find(r => r.ownerHost && r.ownerHost.toLowerCase() === lower);
  if (rule) return rule;
  for (const withSub of [true, false]) {
    const candidate = new Set(patternsForHost(host, withSub));
    rule = state.rules.find(r => {
      const set = new Set(r.patterns || []);
      return set.size === candidate.size && [...candidate].every(p => set.has(p));
    });
    if (rule) return rule;
  }
  return null;
}

// ---------- PAC generation ----------

function proxyDirective(profile) {
  const hp = `${profile.host}:${profile.port}`;
  switch (profile.scheme) {
    case "https": return `HTTPS ${hp}`;
    case "socks4": return `SOCKS ${hp}`;
    case "socks5": return `SOCKS5 ${hp}`;
    case "http":
    default: return `PROXY ${hp}`;
  }
}

function isProfileUsable(profile) {
  return !!profile && !!profile.host && String(profile.host).trim() !== "" &&
    Number.isFinite(Number(profile.port)) && Number(profile.port) > 0;
}

function buildPacScript(state) {
  const profileById = Object.fromEntries(state.profiles.map(p => [p.id, p]));
  const lines = [];
  for (const rule of state.rules) {
    if (!ruleEnabled(rule)) continue;
    const patterns = (rule.patterns || []).filter(p => typeof p === "string" && p.trim() !== "");
    if (!patterns.length) continue;
    const checks = patterns
      .map(p => `shExpMatch(host, ${JSON.stringify(p)})`)
      .join(" || ");
    if (rule.profileId === PH_DIRECT_ID) {
      lines.push(`  if (${checks}) { return "DIRECT"; }`);
      continue;
    }
    const profile = profileById[rule.profileId];
    if (!isProfileUsable(profile)) continue;
    const directive = proxyDirective(profile);
    lines.push(`  if (${checks}) { return ${JSON.stringify(directive + "; DIRECT")}; }`);
  }
  const tailDirective = resolveDefaultDirective(state);
  return `function FindProxyForURL(url, host) {\n  try {\n${lines.join("\n")}\n  } catch (e) {}\n  return ${JSON.stringify(tailDirective)};\n}`;
}

function resolveDefaultDirective(state) {
  if (state.defaultMode && state.defaultMode !== PH_DIRECT_ID) {
    const profile = state.profiles.find(p => p.id === state.defaultMode);
    if (isProfileUsable(profile)) return proxyDirective(profile) + "; DIRECT";
  }
  return "DIRECT";
}

function resolveRouteMode(state, host) {
  if (!state.enabled) return { mode: "direct", reason: "disabled" };
  const profileById = Object.fromEntries(state.profiles.map(p => [p.id, p]));
  for (const rule of state.rules) {
    if (!ruleEnabled(rule)) continue;
    if (!(rule.patterns || []).some(p => shExpMatchLike(host, p))) continue;
    if (rule.profileId === PH_DIRECT_ID) {
      return { mode: "direct", ruleId: rule.id, explicit: true };
    }
    const profile = profileById[rule.profileId];
    if (!isProfileUsable(profile)) continue;
    return { mode: "proxy", ruleId: rule.id, profileId: profile.id, profileName: profile.name };
  }
  if (state.defaultMode && state.defaultMode !== PH_DIRECT_ID) {
    const profile = profileById[state.defaultMode];
    if (isProfileUsable(profile)) {
      return { mode: "proxy", isDefault: true, profileId: profile.id, profileName: profile.name };
    }
  }
  return { mode: "direct", isDefault: true };
}

function stateNeedsPac(state) {
  const defaultIsUsableProxy = state.defaultMode && state.defaultMode !== PH_DIRECT_ID &&
    isProfileUsable(state.profiles.find(p => p.id === state.defaultMode));
  return state.rules.length > 0 || defaultIsUsableProxy;
}

async function applyProxySettings() {
  const state = await getState();
  if (!state.enabled || !stateNeedsPac(state)) {
    await chrome.proxy.settings.clear({ scope: "regular" });
    chrome.action.setBadgeText({ text: "" });
    await refreshAllTabIcons(state);
    return;
  }
  try {
    const pacScript = buildPacScript(state);
    await chrome.proxy.settings.set({
      value: { mode: "pac_script", pacScript: { data: pacScript } },
      scope: "regular"
    });
    chrome.action.setBadgeText({ text: "" });
  } catch (e) {
    console.error("ProxyHub: failed to apply proxy settings, clearing to avoid blocking browsing.", e);
    await chrome.proxy.settings.clear({ scope: "regular" });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#c9694a" });
  }
  await refreshAllTabIcons(state);
}

// ---------- Per-tab toolbar icon: shows at a glance whether the active
// tab is being proxied, going direct, or routing is globally off ----------

const ICON_SETS = {
  proxy: { 16: "icons/icon-proxy16.png", 48: "icons/icon-proxy48.png", 128: "icons/icon-proxy128.png" },
  direct: { 16: "icons/icon-direct16.png", 48: "icons/icon-direct48.png", 128: "icons/icon-direct128.png" },
  off: { 16: "icons/icon-off16.png", 48: "icons/icon-off48.png", 128: "icons/icon-off128.png" },
};
const ICON_TITLES = {
  proxy: "ProxyHub — this site is routed through a proxy",
  direct: "ProxyHub — this site loads direct (no proxy)",
  off: "ProxyHub — routing is turned off",
};

async function updateIconForTab(tabId, urlOrPendingUrl, state) {
  if (!tabId) return;
  let host = null;
  try { host = urlOrPendingUrl ? new URL(urlOrPendingUrl).hostname : null; } catch (e) {}
  let kind = "direct";
  if (!state.enabled) kind = "off";
  else if (host) kind = resolveRouteMode(state, host).mode === "proxy" ? "proxy" : "direct";
  try {
    await chrome.action.setIcon({ tabId, path: ICON_SETS[kind] });
    await chrome.action.setTitle({ tabId, title: ICON_TITLES[kind] });
  } catch (e) { /* tab may have closed mid-update */ }
}

async function refreshAllTabIcons(state) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      await updateIconForTab(tab.id, tab.pendingUrl || tab.url, state);
    }
  } catch (e) { /* ignore */ }
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    const state = await getState();
    await updateIconForTab(tabId, tab.pendingUrl || tab.url, state);
  } catch (e) { /* ignore */ }
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "loading") return;
  const state = await getState();
  await updateIconForTab(tabId, tab.pendingUrl || tab.url, state);
});

// ---------- Proxy authentication ----------

chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const state = await getState();
    const match = state.profiles.find(p => {
      return details.isProxy && details.challenger &&
        details.challenger.host === p.host && details.challenger.port === Number(p.port);
    });
    if (!match) { callback({}); return; }

    let password = match.password;
    if (match.encPassword) {
      if (!cachedKey) { callback({}); return; }
      try {
        password = await decryptString(match.encPassword, cachedKey);
      } catch (e) {
        callback({});
        return;
      }
    }
    if (!match.username) { callback({}); return; }
    callback({ authCredentials: { username: match.username, password: password || "" } });
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);

// ---------- Vault unlock/lock (session-scoped key cache) ----------

async function unlockVault(passphrase) {
  const state = await getState();
  const { key, saltB64 } = await deriveKey(passphrase, state.vault.saltB64 || null);
  cachedKey = key;
  if (!state.vault.saltB64) {
    state.vault.saltB64 = saltB64;
    await setState(state);
  }
  const jwk = await exportKey(key);
  await chrome.storage.session.set({ vaultKeyJwk: jwk });
}

async function tryRestoreVaultKey() {
  const { vaultKeyJwk } = await chrome.storage.session.get("vaultKeyJwk");
  if (vaultKeyJwk) {
    cachedKey = await importKey(vaultKeyJwk);
  }
}
tryRestoreVaultKey();

// ---------- Context menu: "Load in new tab with ProxyHub" ----------

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "proxyhub-open-link",
      title: "Load in new tab with ProxyHub",
      contexts: ["link"]
    });
  });
}
chrome.runtime.onInstalled.addListener(setupContextMenu);
chrome.runtime.onStartup.addListener(setupContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "proxyhub-open-link" || !info.linkUrl) return;

  let host;
  try { host = new URL(info.linkUrl).hostname.toLowerCase(); } catch (e) { return; }

  const state = await getState();
  const covered = state.rules.some(r =>
    ruleEnabled(r) && r.patterns.some(p => shExpMatchLike(host, p))
  );

  if (!covered) {
    if (!state.profiles.length) {
      chrome.tabs.create({ url: info.linkUrl, index: tab ? tab.index + 1 : undefined });
      chrome.runtime.openOptionsPage();
      return;
    }
    const { ph_last_profile } = await chrome.storage.local.get("ph_last_profile");
    const profileId = state.profiles.some(p => p.id === ph_last_profile)
      ? ph_last_profile
      : state.profiles[0].id;

    const base = baseDomainFor(host);
    const patterns = [...new Set([base, `*.${base}`, host])];
    state.rules.unshift({
      id: crypto.randomUUID(),
      patterns,
      profileId,
      note: "auto: added from right-click \u2192 Load in new tab with ProxyHub",
      ownerHost: host,
      includeSubdomains: true
    });
    await setState(state);
    await applyProxySettings();
  }

  chrome.tabs.create({ url: info.linkUrl, index: tab ? tab.index + 1 : undefined });
});

// ---------- Message API (popup / options talk to background) ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "GET_STATE": {
        sendResponse(await getState());
        break;
      }
      case "SET_STATE": {
        await setState(msg.state);
        await applyProxySettings();
        sendResponse({ ok: true });
        break;
      }
      case "REBUILD_PAC": {
        await applyProxySettings();
        sendResponse({ ok: true });
        break;
      }
      case "GET_ACTIVE_TAB_HOST": {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const effectiveUrl = tab ? (tab.pendingUrl || tab.url) : null;
        let host = null;
        try { host = effectiveUrl ? new URL(effectiveUrl).hostname : null; } catch (e) {}
        sendResponse({
          host,
          tabId: tab ? tab.id : null,
          url: effectiveUrl || null,
          loading: tab ? tab.status === "loading" : false
        });
        break;
      }
      // Popup's per-site profile selector: creates or UPDATES the single
      // rule this host "owns" — never creates a second rule for the same
      // site. profileId === PH_DIRECT_ID means "no rule should apply
      // here", so if an owner rule exists it's removed instead of storing
      // an explicit Direct rule (Direct isn't something the popup adds).
      case "SET_SITE_PROFILE": {
        const state = await getState();
        const host = String(msg.host || "").trim();
        if (!host) { sendResponse({ ok: false, error: "no host" }); break; }
        const includeSubdomains = !!msg.includeSubdomains;
        let owner = findOwnerRule(state, host);

        if (msg.profileId === PH_DIRECT_ID) {
          if (owner) state.rules = state.rules.filter(r => r !== owner);
          await setState(state);
          await applyProxySettings();
          sendResponse({ ok: true, removed: !!owner });
          break;
        }

        const profileExists = state.profiles.some(p => p.id === msg.profileId);
        if (!profileExists) { sendResponse({ ok: false, error: "no such profile" }); break; }

        const newSitePatterns = patternsForHost(host, includeSubdomains);
        if (owner) {
          const prevSitePatterns = new Set(patternsForHost(host, !!owner.includeSubdomains));
          const extras = (owner.patterns || []).filter(p => !prevSitePatterns.has(p));
          owner.patterns = [...new Set([...newSitePatterns, ...extras])];
          owner.profileId = msg.profileId;
          owner.includeSubdomains = includeSubdomains;
          owner.ownerHost = host;
        } else {
          state.rules.unshift({
            id: crypto.randomUUID(),
            patterns: newSitePatterns,
            profileId: msg.profileId,
            note: "Added from the ProxyHub popup",
            ownerHost: host,
            includeSubdomains
          });
        }
        await setState(state);
        await applyProxySettings();
        await chrome.storage.local.set({ ph_last_profile: msg.profileId });
        sendResponse({ ok: true });
        break;
      }
      // Merges a CDN companion group's patterns into the host's OWNER rule
      // (creating one, pointed at profileId, if it doesn't exist yet)
      // instead of spawning a separate rule — keeps a site + its CDNs as
      // one nested group in the UI.
      case "MERGE_CDN_PATTERNS": {
        const state = await getState();
        const host = String(msg.host || "").trim();
        const patterns = Array.isArray(msg.patterns) ? msg.patterns : [];
        if (!host || !patterns.length) { sendResponse({ ok: false, error: "bad request" }); break; }
        const profileExists = state.profiles.some(p => p.id === msg.profileId);
        if (!profileExists) { sendResponse({ ok: false, error: "no such profile" }); break; }

        let owner = findOwnerRule(state, host);
        if (!owner) {
          owner = {
            id: crypto.randomUUID(),
            patterns: patternsForHost(host, true),
            profileId: msg.profileId,
            note: "Added from the ProxyHub popup",
            ownerHost: host,
            includeSubdomains: true
          };
          state.rules.unshift(owner);
        }
        owner.patterns = [...new Set([...owner.patterns, ...patterns])];
        await setState(state);
        await applyProxySettings();
        await chrome.storage.local.set({ ph_last_profile: msg.profileId });
        sendResponse({ ok: true });
        break;
      }
      case "UNLOCK_VAULT": {
        try {
          await unlockVault(msg.passphrase);
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
        break;
      }
      case "LOCK_VAULT": {
        cachedKey = null;
        await chrome.storage.session.remove("vaultKeyJwk");
        sendResponse({ ok: true });
        break;
      }
      case "VAULT_IS_UNLOCKED": {
        sendResponse({ unlocked: !!cachedKey });
        break;
      }
      case "ENCRYPT_SECRET": {
        if (!cachedKey) { sendResponse({ ok: false, error: "locked" }); break; }
        const payload = await encryptString(msg.plainText, cachedKey);
        sendResponse({ ok: true, payload });
        break;
      }
      case "OPEN_OPTIONS_PAGE": {
        chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        break;
      }
      case "GET_ROUTE_MODE": {
        const state = await getState();
        const host = String(msg.host || "").toLowerCase();
        sendResponse(host ? resolveRouteMode(state, host) : { mode: "direct" });
        break;
      }
      case "GET_PAC_DEBUG": {
        const state = await getState();
        const usableRuleCount = state.rules.filter(r => {
          if (!ruleEnabled(r)) return false;
          if (r.profileId === PH_DIRECT_ID) return true;
          const profile = state.profiles.find(p => p.id === r.profileId);
          return isProfileUsable(profile);
        }).length;
        sendResponse({
          enabled: state.enabled,
          totalRules: state.rules.length,
          usableRuleCount,
          defaultMode: state.defaultMode || PH_DIRECT_ID,
          pacScript: (state.enabled && stateNeedsPac(state)) ? buildPacScript(state) : null
        });
        break;
      }
      case "ADD_RULES_FOR_HOSTS": {
        const state = await getState();
        const profileExists = state.profiles.some(p => p.id === msg.profileId);
        if (!profileExists) { sendResponse({ ok: false, error: "no such profile" }); break; }
        let added = 0;
        for (const host of (msg.hosts || [])) {
          const clean = String(host).toLowerCase().trim();
          if (!clean) continue;
          const base = clean.replace(/^www\./i, "");
          const patterns = [...new Set([base, `*.${base}`, clean])];
          const already = state.rules.some(r =>
            ruleEnabled(r) && r.patterns.includes(base) && r.profileId === msg.profileId
          );
          if (already) continue;
          state.rules.unshift({
            id: crypto.randomUUID(),
            patterns,
            profileId: msg.profileId,
            note: "auto: detected failed resource load"
          });
          added++;
        }
        await setState(state);
        await applyProxySettings();
        await chrome.storage.local.set({ ph_last_profile: msg.profileId });
        sendResponse({ ok: true, added });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown message" });
    }
  })();
  return true; // keep channel open for async sendResponse
});

// Re-apply on install/startup so PAC survives browser restarts.
chrome.runtime.onInstalled.addListener(applyProxySettings);
chrome.runtime.onStartup.addListener(applyProxySettings);

// First run: open the Options page. options.html/onboard.js takes care of
// showing the in-page welcome wizard once it loads (it checks storage for
// whether onboarding has already been seen), so this just needs to get the
// page open — it works the same whether the extension came from the Chrome
// Web Store or was loaded unpacked.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});
