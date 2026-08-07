// popup.js
let state = null;
let currentHost = null;
let currentTabId = null;
let pendingGroup = null;

function send(msg) {
  return PH_API.runtime.sendMessage(msg);
}

function shExpMatchLike(host, pattern) {
  const esc = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${esc}$`, "i").test(host);
}

function isProfileUsableLite(profile) {
  return !!profile && !!profile.host && String(profile.host).trim() !== "" &&
    Number.isFinite(Number(profile.port)) && Number(profile.port) > 0;
}

function profileById(id) {
  return (state.profiles || []).find(p => p.id === id);
}

function resolveEffective(host) {
  if (!host) return { mode: "unavailable" };
  if (!state.enabled) return { mode: "off" };
  for (const rule of state.rules) {
    if (rule.enabled === false) continue;
    if (!rule.patterns.some(p => shExpMatchLike(host, p))) continue;
    if (rule.profileId === PH_DIRECT_ID) return { mode: "direct", rule };
    const profile = profileById(rule.profileId);
    if (!isProfileUsableLite(profile)) continue;
    return { mode: "proxy", rule, profile };
  }
  if (state.defaultMode && state.defaultMode !== PH_DIRECT_ID) {
    const profile = profileById(state.defaultMode);
    if (isProfileUsableLite(profile)) return { mode: "proxy", isDefault: true, profile };
  }
  return { mode: "direct", isDefault: true };
}

function flashInlineMsg(text, kind) {
  const el = document.getElementById("quickAddMsg");
  el.textContent = text;
  el.className = `ph-inline-msg ${kind || ""}`;
  el.hidden = false;
  clearTimeout(flashInlineMsg._t);
  flashInlineMsg._t = setTimeout(() => { el.hidden = true; }, 3200);
}

function injectIcons() {
  document.getElementById("brandLogo").innerHTML = PH_ICONS.logo;
  document.getElementById("reloadIcon").innerHTML = PH_ICONS.reload;
  document.getElementById("manageIcon").innerHTML = PH_ICONS.layers;
}

async function refresh() {
  state = await send({ type: "GET_STATE" });
  const { host, tabId } = await send({ type: "GET_ACTIVE_TAB_HOST" });
  currentHost = host;
  currentTabId = tabId;

  document.getElementById("currentHost").textContent = host || "Not a proxyable address";
  document.getElementById("reloadPageBtn").disabled = !tabId;
  document.getElementById("profileField").hidden = !host;
  document.getElementById("subdomainRow").hidden = !host;

  renderStatusPill();
  renderProfileSelect();
  renderGroupHint();
  renderQuickToggle();
}

function renderStatusPill() {
  const pill = document.getElementById("statusPill");
  const effective = currentHost ? resolveEffective(currentHost) : { mode: !state.enabled ? "off" : "unavailable" };
  let cls = "st-direct", icon = "direct", label = "Direct";
  if (effective.mode === "off") { cls = "st-off"; icon = "power"; label = "Routing off"; }
  else if (effective.mode === "proxy") { cls = "st-proxy"; icon = "proxy"; label = effective.profile ? effective.profile.name : "Proxied"; }
  else if (effective.mode === "direct") { cls = "st-direct"; icon = "direct"; label = "Direct"; }
  else { cls = "st-direct"; icon = "direct"; label = "—"; }
  pill.className = `ph-status-pill ${cls}`;
  pill.innerHTML = `<span class="ph-svg">${PH_ICONS[icon]}</span><span>${label}</span>`;
}

// One-click "route this site / stop routing this site" toggle: no dropdown
// needed — proxy it through the first usable profile, or drop the rule back
// to Direct. Reuses SET_SITE_PROFILE so the rule lands in the same store.
function renderQuickToggle() {
  const btn = document.getElementById("quickToggleBtn");
  if (!currentHost || !state.enabled) { btn.hidden = true; return; }
  btn.hidden = false;
  const proxied = resolveEffective(currentHost).mode === "proxy";
  document.getElementById("quickToggleText").textContent = proxied ? "Stop routing this site" : "Route this site";
}

async function onQuickToggle() {
  if (!currentHost) return;
  const effective = resolveEffective(currentHost);
  const includeSubdomains = document.getElementById("includeSubdomains").checked;
  if (effective.mode === "proxy") {
    await send({ type: "SET_SITE_PROFILE", host: currentHost, profileId: PH_DIRECT_ID, includeSubdomains });
  } else {
    const usable = (state.profiles || []).find(isProfileUsableLite);
    if (!usable) { flashInlineMsg("Add a proxy profile in Options first.", "info"); return; }
    await send({ type: "SET_SITE_PROFILE", host: currentHost, profileId: usable.id, includeSubdomains });
  }
  await refresh();
  pulseReloadBtn();
}

function renderProfileSelect() {
  const sel = document.getElementById("profileSelect");
  sel.innerHTML = "";

  // "Direct" is shown so the current state is legible, but it is never a
  // rule the popup *creates* — picking it just removes this site's rule
  // (see background.js SET_SITE_PROFILE). A brand-new "add a rule" action
  // therefore only ever needs a real proxy profile to be selectable.
  const directOpt = document.createElement("option");
  directOpt.value = PH_DIRECT_ID;
  directOpt.textContent = "Direct (no proxy)";
  sel.appendChild(directOpt);

  for (const p of state.profiles) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} — ${p.scheme}://${p.host}:${p.port}`;
    sel.appendChild(opt);
  }

  if (!currentHost) { sel.disabled = true; return; }
  sel.disabled = false;
  const effective = resolveEffective(currentHost);
  if (effective.mode === "proxy" && effective.rule) sel.value = effective.rule.profileId;
  else sel.value = PH_DIRECT_ID;
}

function renderGroupHint() {
  const hintEl = document.getElementById("groupHint");
  if (!currentHost || typeof findGroupForPattern !== "function") { hintEl.hidden = true; return; }
  const group = findGroupForPattern(currentHost, state.knownHosts);
  if (!group) { hintEl.hidden = true; return; }
  const alreadyCovered = group.patterns.every(p =>
    state.rules.some(r => r.enabled !== false && r.patterns.includes(p))
  );
  if (alreadyCovered) { hintEl.hidden = true; return; }
  pendingGroup = group;
  hintEl.hidden = false;
  hintEl.innerHTML = `
    <div class="ph-group-hint-title"><span class="ph-svg">${PH_ICONS.link}</span>${group.label} — related CDN domains</div>
    <p>This site usually serves images/video from separate CDN domains. Add them under the same rule to avoid broken thumbnails.</p>
    <button id="addGroupBtn" type="button">Add ${group.patterns.length} related domain${group.patterns.length > 1 ? "s" : ""}</button>
  `;
  document.getElementById("addGroupBtn").addEventListener("click", addGroupPatterns);
}

async function addGroupPatterns() {
  const profileId = document.getElementById("profileSelect").value;
  if (!profileId || profileId === PH_DIRECT_ID || !pendingGroup) {
    flashInlineMsg("Pick a proxy profile above first.", "info");
    return;
  }
  await send({ type: "MERGE_CDN_PATTERNS", host: currentHost, patterns: pendingGroup.patterns, profileId });
  await refresh();
  pulseReloadBtn();
}

async function onProfileChange() {
  const profileId = document.getElementById("profileSelect").value;
  const includeSubdomains = document.getElementById("includeSubdomains").checked;
  if (!currentHost) return;
  const res = await send({ type: "SET_SITE_PROFILE", host: currentHost, profileId, includeSubdomains });
  if (res && res.ok) {
    if (profileId === PH_DIRECT_ID) {
      flashInlineMsg(res.removed ? "Rule removed — this site now loads direct." : "Already direct — nothing to change.", "info");
    }
    await refresh();
    pulseReloadBtn();
  }
}

function pulseReloadBtn() {
  const btn = document.getElementById("reloadPageBtn");
  btn.classList.remove("ph-pulse");
  void btn.offsetWidth;
  btn.classList.add("ph-pulse");
  setTimeout(() => btn.classList.remove("ph-pulse"), 3000);
}

document.getElementById("reloadPageBtn").addEventListener("click", () => {
  if (currentTabId) PH_API.tabs.reload(currentTabId);
});
document.getElementById("quickToggleBtn").addEventListener("click", onQuickToggle);
document.getElementById("profileSelect").addEventListener("change", onProfileChange);
document.getElementById("includeSubdomains").addEventListener("change", () => {
  const sel = document.getElementById("profileSelect");
  if (sel.value !== PH_DIRECT_ID) onProfileChange();
});
document.getElementById("openOptions").addEventListener("click", () => PH_API.runtime.openOptionsPage());

PH_API.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[PH_STORAGE_KEY]) refresh();
});

injectIcons();
refresh();
